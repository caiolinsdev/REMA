from __future__ import annotations

from typing import Any

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.activities_payload import activity_detail_payload, activity_summary_payload, validation_summary_for
from core.media_utils import validate_controlled_media_url
from core.models import Activity, Question, QuestionOption, UserProfile


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_activity", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


def _parse_due_at(raw_value):
    if raw_value in (None, ""):
        return None
    parsed = parse_datetime(str(raw_value))
    if parsed is None:
        raise ValueError("Prazo inválido.")
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _normalize_options(raw_options) -> list[dict[str, Any]]:
    if raw_options is None:
        return []
    if not isinstance(raw_options, list):
        raise ValueError("As opções da questão devem ser uma lista.")
    normalized = []
    for idx, option in enumerate(raw_options):
        if not isinstance(option, dict):
            raise ValueError("Cada opção deve ser um objeto.")
        try:
            position = int(option.get("position") or idx + 1)
        except (TypeError, ValueError) as exc:
            raise ValueError("A posição da opção deve ser numérica.") from exc
        normalized.append(
            {
                "label": str(option.get("label") or "").strip(),
                "position": position,
                "is_correct": bool(option.get("isCorrect", False)),
            }
        )
    return normalized


def _normalize_questions(raw_questions) -> list[dict[str, Any]]:
    if raw_questions is None:
        return []
    if not isinstance(raw_questions, list):
        raise ValueError("As questões devem ser enviadas em lista.")
    normalized = []
    for idx, question in enumerate(raw_questions):
        if not isinstance(question, dict):
            raise ValueError("Cada questão deve ser um objeto.")
        try:
            weight = int(question.get("weight") or 0)
            position = int(question.get("position") or idx + 1)
        except (TypeError, ValueError) as exc:
            raise ValueError("Peso e posição da questão devem ser numéricos.") from exc
        normalized.append(
            {
                "statement": str(question.get("statement") or "").strip(),
                "type": str(question.get("type") or "").strip(),
                "weight": weight,
                "position": position,
                "support_image_url": validate_controlled_media_url(
                    question.get("supportImageUrl")
                    or question.get("support_image_url"),
                    allowed_kinds={"activity_support_image"},
                ),
                "expected_answer": str(
                    question.get("expectedAnswer") or question.get("expected_answer") or ""
                ).strip(),
                "options": _normalize_options(question.get("options")),
            }
        )
    return normalized


def _validation_summary_from_payload(
    *,
    kind: str,
    description: str,
    total_score: int,
    questions: list[dict[str, Any]],
):
    return validation_summary_for(
        kind=kind,
        description=description,
        total_score=total_score,
        questions=[
            {
                "type": question["type"],
                "weight": question["weight"],
                "options": question["options"],
            }
            for question in questions
        ],
    )


def _prefetched_queryset():
    return Activity.objects.select_related("created_by").prefetch_related(
        "questions__options"
    )


def _get_activity_for_request(request, activity_id: int) -> Activity:
    queryset = _prefetched_queryset()
    if _is_professor(request.user):
        queryset = queryset.filter(created_by=request.user)
    else:
        queryset = queryset.filter(status__in=[Activity.Status.PUBLISHED, Activity.Status.CLOSED])
    return get_object_or_404(queryset, pk=activity_id)


def _save_questions(activity: Activity, questions: list[dict[str, Any]]) -> None:
    activity.questions.all().delete()
    for question_data in questions:
        question = Question.objects.create(
            activity=activity,
            statement=question_data["statement"],
            type=question_data["type"],
            weight=question_data["weight"],
            position=question_data["position"],
            support_image_url=question_data["support_image_url"],
            expected_answer=question_data["expected_answer"],
        )
        for option_data in question_data["options"]:
            QuestionOption.objects.create(
                question=question,
                label=option_data["label"],
                position=option_data["position"],
                is_correct=option_data["is_correct"],
            )


def _upsert_activity(request, *, activity: Activity | None = None):
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem gerir tarefas.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    if activity is not None and activity.created_by_id != request.user.id:
        return _error(
            "Tarefa não encontrada.",
            code="not_found",
            http_status=status.HTTP_404_NOT_FOUND,
        )

    if activity is not None and activity.status != Activity.Status.DRAFT:
        return _error("Apenas itens em draft podem ser editados.")

    data = request.data
    is_create = activity is None

    title = str(data.get("title", activity.title if activity else "")).strip()
    description = str(
        data.get("description", activity.description if activity else "")
    ).strip()
    kind = str(data.get("kind", activity.kind if activity else "")).strip()
    try:
        total_score = int(
            data.get(
                "totalScore",
                data.get("total_score", activity.total_score if activity else 100),
            )
        )
    except (TypeError, ValueError):
        return _error("A pontuação total deve ser numérica.")

    try:
        due_at = _parse_due_at(data.get("dueAt", data.get("due_at", activity.due_at if activity else None)))
    except ValueError as exc:
        return _error(str(exc))

    questions_provided = "questions" in data
    try:
        questions = (
            _normalize_questions(data.get("questions"))
            if questions_provided
            else [
                {
                    "statement": question.statement,
                    "type": question.type,
                    "weight": question.weight,
                    "position": question.position,
                    "support_image_url": question.support_image_url,
                    "expected_answer": question.expected_answer,
                    "options": [
                        {
                            "label": option.label,
                            "position": option.position,
                            "is_correct": option.is_correct,
                        }
                        for option in question.options.all()
                    ],
                }
                for question in activity.questions.all()
            ]
            if activity is not None
            else []
        )
    except ValueError as exc:
        return _error(str(exc))

    if not title:
        return _error("Título é obrigatório.")
    if kind not in Activity.Kind.values:
        return _error("Formato interno da tarefa inválido.")
    if total_score != 100:
        return _error("A pontuação total do item deve ser 100.")
    if kind == Activity.Kind.TRABALHO and questions:
        return _error("Tarefas com anexo não aceitam questões nesta fase inicial.")
    if kind in {Activity.Kind.PROVA, Activity.Kind.ATIVIDADE} and len(questions) > 100:
        return _error("Tarefas com questões aceitam no máximo 100 questões.")

    for question in questions:
        if not question["statement"]:
            return _error("Toda questão precisa de enunciado.")
        if question["type"] not in Question.Type.values:
            return _error("Tipo de questão inválido.")
        if question["type"] == Question.Type.MULTIPLA_ESCOLHA and len(question["options"]) < 2:
            return _error("Questão de múltipla escolha precisa de ao menos 2 opções.")
        if question["type"] == Question.Type.MULTIPLA_ESCOLHA and len(question["options"]) > 5:
            return _error("Questões de múltipla escolha aceitam no máximo 5 opções.")
        if question["type"] == Question.Type.DISSERTATIVA and question["options"]:
            return _error("Questão dissertativa não aceita opções.")

    with transaction.atomic():
        target = activity or Activity(created_by=request.user)
        target.title = title
        target.description = description
        target.kind = kind
        target.total_score = total_score
        target.due_at = due_at
        if is_create:
            target.status = Activity.Status.DRAFT
        target.save()
        if questions_provided or is_create:
            _save_questions(target, questions)

    target = _prefetched_queryset().get(pk=target.pk)
    return Response(
        activity_detail_payload(
            target, include_sensitive=True, include_validation=True
        ),
        status=status.HTTP_201_CREATED if is_create else status.HTTP_200_OK,
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def activities_collection(request):
    if request.method == "GET":
        queryset = _prefetched_queryset()
        if _is_professor(request.user):
            queryset = queryset.filter(created_by=request.user)
        elif _is_student(request.user):
            queryset = queryset.filter(
                status__in=[Activity.Status.PUBLISHED, Activity.Status.CLOSED]
            )
        else:
            queryset = queryset.none()
        return Response([activity_summary_payload(activity) for activity in queryset])

    return _upsert_activity(request)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def activity_item(request, activity_id: int):
    activity = _get_activity_for_request(request, activity_id)
    if request.method == "GET":
        return Response(
            activity_detail_payload(
                activity,
                include_sensitive=_is_professor(request.user),
                include_validation=_is_professor(request.user),
            )
        )
    return _upsert_activity(request, activity=activity)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activity_publish(request, activity_id: int):
    activity = _get_activity_for_request(request, activity_id)
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem publicar tarefas.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    if activity.status != Activity.Status.DRAFT:
        return _error("Apenas itens em draft podem ser publicados.")

    summary = validation_summary_for(
        kind=activity.kind,
        description=activity.description,
        total_score=activity.total_score,
        questions=list(activity.questions.all()),
    )
    if not summary["canPublish"]:
        return Response(
            {
                "code": "invalid_activity",
                "message": "A tarefa ainda não pode ser publicada.",
                "validation": summary,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    activity.status = Activity.Status.PUBLISHED
    activity.save(update_fields=["status", "updated_at"])
    activity = _prefetched_queryset().get(pk=activity.pk)
    return Response(
        activity_detail_payload(
            activity, include_sensitive=True, include_validation=True
        )
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activity_questions_collection(request, activity_id: int):
    activity = _get_activity_for_request(request, activity_id)
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem editar questões.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    if activity.status != Activity.Status.DRAFT:
        return _error("Questões só podem ser alteradas em draft.")
    if activity.kind == Activity.Kind.TRABALHO:
        return _error("Tarefas com anexo não aceitam questões nesta fase inicial.")

    try:
        questions = _normalize_questions([request.data])
    except ValueError as exc:
        return _error(str(exc))
    if not questions:
        return _error("Questão inválida.")
    if activity.questions.count() >= 100:
        return _error("Tarefas com questões aceitam no máximo 100 questões.")

    payload = questions[0]
    if payload["type"] == Question.Type.MULTIPLA_ESCOLHA and len(payload["options"]) > 5:
        return _error("Questões de múltipla escolha aceitam no máximo 5 opções.")
    validation = _validation_summary_from_payload(
        kind=activity.kind,
        description=activity.description,
        total_score=activity.total_score,
        questions=[
            *[
                {
                    "type": question.type,
                    "weight": question.weight,
                    "options": [{"label": option.label} for option in question.options.all()],
                }
                for question in activity.questions.all()
            ],
            {
                "type": payload["type"],
                "weight": payload["weight"],
                "options": payload["options"],
            },
        ],
    )
    question = Question.objects.create(
        activity=activity,
        statement=payload["statement"],
        type=payload["type"],
        weight=payload["weight"],
        position=payload["position"],
        support_image_url=payload["support_image_url"],
        expected_answer=payload["expected_answer"],
    )
    for option_data in payload["options"]:
        QuestionOption.objects.create(
            question=question,
            label=option_data["label"],
            position=option_data["position"],
            is_correct=option_data["is_correct"],
        )
    activity = _prefetched_queryset().get(pk=activity.pk)
    response_payload = activity_detail_payload(
        activity, include_sensitive=True, include_validation=True
    )
    response_payload["validation"] = validation
    return Response(response_payload, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def question_item(request, question_id: int):
    question = get_object_or_404(
        Question.objects.select_related("activity__created_by").prefetch_related("options"),
        pk=question_id,
    )
    activity = question.activity
    if not _is_professor(request.user) or activity.created_by_id != request.user.id:
        return _error(
            "Questão não encontrada.",
            code="not_found",
            http_status=status.HTTP_404_NOT_FOUND,
        )
    if activity.status != Activity.Status.DRAFT:
        return _error("Questões só podem ser alteradas em draft.")

    raw_payload = {
        "statement": request.data.get("statement", question.statement),
        "type": request.data.get("type", question.type),
        "weight": request.data.get("weight", question.weight),
        "position": request.data.get("position", question.position),
        "supportImageUrl": request.data.get("supportImageUrl", question.support_image_url),
        "expectedAnswer": request.data.get("expectedAnswer", question.expected_answer),
        "options": request.data.get(
            "options",
            [
                {
                    "label": option.label,
                    "position": option.position,
                    "isCorrect": option.is_correct,
                }
                for option in question.options.all()
            ],
        ),
    }
    try:
        normalized = _normalize_questions([raw_payload])[0]
    except ValueError as exc:
        return _error(str(exc))
    if normalized["type"] == Question.Type.MULTIPLA_ESCOLHA and len(normalized["options"]) < 2:
        return _error("Questão de múltipla escolha precisa de ao menos 2 opções.")
    if normalized["type"] == Question.Type.MULTIPLA_ESCOLHA and len(normalized["options"]) > 5:
        return _error("Questões de múltipla escolha aceitam no máximo 5 opções.")
    if normalized["type"] == Question.Type.DISSERTATIVA and normalized["options"]:
        return _error("Questão dissertativa não aceita opções.")

    question.statement = normalized["statement"]
    question.type = normalized["type"]
    question.weight = normalized["weight"]
    question.position = normalized["position"]
    question.support_image_url = normalized["support_image_url"]
    question.expected_answer = normalized["expected_answer"]
    question.save()
    question.options.all().delete()
    for option_data in normalized["options"]:
        QuestionOption.objects.create(
            question=question,
            label=option_data["label"],
            position=option_data["position"],
            is_correct=option_data["is_correct"],
        )

    activity = _prefetched_queryset().get(pk=activity.pk)
    return Response(
        activity_detail_payload(
            activity, include_sensitive=True, include_validation=True
        )
    )
