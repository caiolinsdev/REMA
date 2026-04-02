from __future__ import annotations

from pathlib import Path

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import (
    Activity,
    Question,
    QuestionOption,
    Review,
    Submission,
    SubmissionAnswer,
    SubmissionFile,
    UserProfile,
)
from core.submissions_payload import (
    submission_detail_payload,
    submission_list_item_payload,
)

ALLOWED_WORK_FILE_TYPES = {"pdf", "doc", "docx", "txt"}


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_submission", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


def _submission_queryset():
    return Submission.objects.select_related(
        "activity", "student", "student__profile", "review", "review__reviewed_by"
    ).prefetch_related("answers", "files")


def _get_submission_for_request(request, submission_id: int) -> Submission:
    queryset = _submission_queryset()
    if _is_professor(request.user):
        queryset = queryset.filter(activity__created_by=request.user)
    else:
        queryset = queryset.filter(student=request.user)
    return get_object_or_404(queryset, pk=submission_id)


def _normalize_answers(activity: Activity, raw_answers) -> list[dict]:
    if raw_answers is None:
        return []
    if not isinstance(raw_answers, list):
        raise ValueError("As respostas devem ser enviadas em lista.")

    questions = {question.id: question for question in activity.questions.all()}
    normalized = []
    for answer in raw_answers:
        if not isinstance(answer, dict):
            raise ValueError("Cada resposta deve ser um objeto.")
        try:
            question_id = int(answer.get("questionId"))
        except (TypeError, ValueError) as exc:
            raise ValueError("Resposta com questionId invalido.") from exc
        question = questions.get(question_id)
        if question is None:
            raise ValueError("Questao nao pertence a atividade.")
        selected_option_id = answer.get("selectedOptionId")
        option = None
        if selected_option_id not in (None, ""):
            try:
                selected_option_id = int(selected_option_id)
            except (TypeError, ValueError) as exc:
                raise ValueError("Opcao selecionada invalida.") from exc
            option = question.options.filter(pk=selected_option_id).first()
            if option is None:
                raise ValueError("Opcao selecionada nao pertence a questao.")
        normalized.append(
            {
                "question": question,
                "answer_text": str(answer.get("answerText") or "").strip(),
                "selected_option": option,
            }
        )
    return normalized


def _normalize_files(raw_files) -> list[dict]:
    if raw_files is None:
        return []
    if not isinstance(raw_files, list):
        raise ValueError("Os anexos devem ser enviados em lista.")

    normalized = []
    for file in raw_files:
        if not isinstance(file, dict):
            raise ValueError("Cada anexo deve ser um objeto.")
        file_name = str(file.get("fileName") or "").strip()
        file_url = str(file.get("fileUrl") or "").strip()
        file_type = str(file.get("fileType") or "").strip().lower()
        if not file_name or not file_url or not file_type:
            raise ValueError("Anexo precisa de nome, url e tipo.")
        extension = Path(file_name).suffix.lower().removeprefix(".")
        effective_type = file_type or extension
        if effective_type not in ALLOWED_WORK_FILE_TYPES:
            raise ValueError("Tipo de arquivo invalido. Use pdf, doc, docx ou txt.")
        normalized.append(
            {
                "file_name": file_name,
                "file_url": file_url,
                "file_type": effective_type,
            }
        )
    return normalized


def _upsert_submission_status(submission: Submission) -> None:
    has_answers = submission.answers.exists()
    has_files = submission.files.exists()
    submission.status = (
        Submission.Status.IN_PROGRESS if has_answers or has_files else Submission.Status.PENDING
    )
    submission.save(update_fields=["status", "updated_at"])


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def activity_submissions_collection(request, activity_id: int):
    activity = get_object_or_404(
        Activity.objects.prefetch_related("questions__options"), pk=activity_id
    )

    if request.method == "GET":
        if not _is_professor(request.user) or activity.created_by_id != request.user.id:
            return _error(
                "Apenas professores podem consultar os envios da atividade.",
                code="forbidden_role",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        submissions = _submission_queryset().filter(activity=activity)
        return Response([submission_list_item_payload(submission) for submission in submissions])

    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem submeter respostas.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    if activity.status != Activity.Status.PUBLISHED:
        return _error("A atividade nao esta disponivel para envio.")

    submission, _ = Submission.objects.get_or_create(activity=activity, student=request.user)
    if submission.status in {Submission.Status.SUBMITTED, Submission.Status.REVIEWED}:
        return _error("Nao e possivel editar apos o envio final.")

    try:
        answers = _normalize_answers(activity, request.data.get("answers"))
        files = _normalize_files(request.data.get("files"))
    except ValueError as exc:
        return _error(str(exc))

    if activity.kind == Activity.Kind.TRABALHO:
        if answers:
            return _error("Trabalhos nao aceitam respostas por questao nesta fase.")
        if len(files) > 1:
            return _error("Trabalho aceita apenas um arquivo no envio inicial.")
    elif files:
        return _error("Apenas trabalhos aceitam anexo nesta fase.")

    with transaction.atomic():
        if request.data.get("answers") is not None:
            submission.answers.all().delete()
            SubmissionAnswer.objects.bulk_create(
                [
                    SubmissionAnswer(
                        submission=submission,
                        question=answer["question"],
                        answer_text=answer["answer_text"],
                        selected_option=answer["selected_option"],
                    )
                    for answer in answers
                ]
            )
        if request.data.get("files") is not None:
            submission.files.all().delete()
            SubmissionFile.objects.bulk_create(
                [
                    SubmissionFile(
                        submission=submission,
                        file_name=file["file_name"],
                        file_url=file["file_url"],
                        file_type=file["file_type"],
                    )
                    for file in files
                ]
            )
        _upsert_submission_status(submission)

    submission = _submission_queryset().get(pk=submission.pk)
    return Response(submission_detail_payload(submission), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_submission(request, activity_id: int):
    activity = get_object_or_404(Activity, pk=activity_id)
    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem consultar o proprio envio.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    submission = get_object_or_404(
        _submission_queryset(), activity=activity, student=request.user
    )
    return Response(submission_detail_payload(submission))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def submission_item(request, submission_id: int):
    submission = _get_submission_for_request(request, submission_id)
    return Response(submission_detail_payload(submission))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submission_confirm(request, submission_id: int):
    submission = _get_submission_for_request(request, submission_id)
    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem confirmar o envio.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    if submission.status in {Submission.Status.SUBMITTED, Submission.Status.REVIEWED}:
        return _error("Nao e possivel reenviar apos confirmacao.")
    if submission.activity.status != Activity.Status.PUBLISHED:
        return _error("A atividade nao esta recebendo envios.")

    if submission.activity.kind == Activity.Kind.TRABALHO:
        if submission.files.count() != 1:
            return _error("Trabalho exige exatamente um anexo antes da confirmacao.")

    submission.status = Submission.Status.SUBMITTED
    submission.submitted_at = timezone.now()
    submission.save(update_fields=["status", "submitted_at", "updated_at"])
    submission = _submission_queryset().get(pk=submission.pk)
    return Response(submission_detail_payload(submission))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submission_review(request, submission_id: int):
    submission = _get_submission_for_request(request, submission_id)
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem revisar envios.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    if submission.activity.created_by_id != request.user.id:
        return _error("Envio nao encontrado.", code="not_found", http_status=404)
    if submission.status not in {Submission.Status.SUBMITTED, Submission.Status.REVIEWED}:
        return _error("O envio precisa estar submetido para ser corrigido.")

    try:
        score = int(request.data.get("score"))
    except (TypeError, ValueError):
        return _error("Nota invalida.")
    comment = str(request.data.get("comment") or "").strip()
    if not 0 <= score <= 100:
        return _error("Nota deve ficar entre 0 e 100.")
    if (
        submission.activity.kind == Activity.Kind.TRABALHO
        and not comment
    ):
        return _error("Comentario do professor e obrigatorio em trabalho.")

    Review.objects.update_or_create(
        submission=submission,
        defaults={
            "reviewed_by": request.user,
            "score": score,
            "comment": comment,
        },
    )
    submission.score = score
    submission.feedback = comment
    submission.status = Submission.Status.REVIEWED
    submission.save(update_fields=["score", "feedback", "status", "updated_at"])
    submission = _submission_queryset().get(pk=submission.pk)
    return Response(submission_detail_payload(submission))
