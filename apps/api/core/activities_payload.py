from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from core.models import Activity, Question, QuestionOption


def _option_payload(option: QuestionOption, include_sensitive: bool) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": str(option.id),
        "label": option.label,
        "position": option.position,
    }
    if include_sensitive:
        payload["isCorrect"] = option.is_correct
    return payload


def _question_payload(question: Question, include_sensitive: bool) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": str(question.id),
        "activityId": str(question.activity_id),
        "statement": question.statement,
        "type": question.type,
        "weight": question.weight,
        "position": question.position,
        "supportImageUrl": question.support_image_url,
        "options": [
            _option_payload(option, include_sensitive=include_sensitive)
            for option in question.options.all()
        ],
    }
    if include_sensitive:
        payload["expectedAnswer"] = question.expected_answer or None
    return payload


def validation_summary_for(
    *,
    kind: str,
    description: str,
    total_score: int,
    questions: Iterable[Question] | list[dict[str, Any]],
) -> dict[str, Any]:
    normalized_questions: list[dict[str, Any]] = []
    for question in questions:
        if isinstance(question, dict):
            normalized_questions.append(question)
            continue
        normalized_questions.append(
            {
                "type": question.type,
                "weight": question.weight,
                "options": [{"label": option.label} for option in question.options.all()],
            }
        )

    issues: list[dict[str, str]] = []
    if total_score != 100:
        issues.append(
            {
                "code": "total_score_must_be_100",
                "message": "A pontuacao total do item deve ser 100.",
            }
        )

    if kind in {Activity.Kind.PROVA, Activity.Kind.ATIVIDADE}:
        if len(normalized_questions) > 100:
            issues.append(
                {
                    "code": "question_limit_exceeded",
                    "message": "Tarefas com questões aceitam no máximo 100 questões.",
                }
            )
        total_weight = sum(int(question.get("weight") or 0) for question in normalized_questions)
        if total_weight != 100:
            issues.append(
                {
                    "code": "question_weights_must_sum_100",
                    "message": "A soma dos pesos das questões deve ser 100.",
                }
            )

    if kind == Activity.Kind.TRABALHO and not description.strip():
        issues.append(
            {
                "code": "trabalho_requires_description",
                "message": "Tarefa com anexo precisa de descrição clara do que deve ser feito.",
            }
        )

    multiple_choice_with_too_many_options = any(
        question.get("type") == Question.Type.MULTIPLA_ESCOLHA
        and len(question.get("options") or []) > 5
        for question in normalized_questions
    )
    if multiple_choice_with_too_many_options:
        issues.append(
            {
                "code": "multiple_choice_limit_exceeded",
                "message": "Questões de múltipla escolha aceitam no máximo 5 opções.",
            }
        )

    return {"canPublish": len(issues) == 0, "issues": issues}


def activity_summary_payload(activity: Activity) -> dict[str, Any]:
    return {
        "id": str(activity.id),
        "title": activity.title,
        "kind": activity.kind,
        "status": activity.status,
        "dueAt": activity.due_at.isoformat() if activity.due_at else None,
        "totalScore": activity.total_score,
        "createdBy": str(activity.created_by_id),
    }


def activity_detail_payload(
    activity: Activity,
    *,
    include_sensitive: bool,
    include_validation: bool,
) -> dict[str, Any]:
    payload = {
        **activity_summary_payload(activity),
        "description": activity.description,
        "questions": [
            _question_payload(question, include_sensitive=include_sensitive)
            for question in activity.questions.all()
        ],
    }
    if include_validation:
        payload["validation"] = validation_summary_for(
            kind=activity.kind,
            description=activity.description,
            total_score=activity.total_score,
            questions=list(activity.questions.all()),
        )
    return payload
