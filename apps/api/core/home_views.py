from __future__ import annotations

from typing import Any

from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.community_payload import community_post_summary_payload
from core.content_payload import content_summary_payload
from core.models import (
    Activity,
    CalendarEvent,
    CommunityPost,
    Content,
    PersonalCalendarNote,
    Submission,
    UserProfile,
)


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_home", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


def _activity_event_type(kind: str) -> str:
    return {
        Activity.Kind.PROVA: CalendarEvent.Type.DELIVERY_PROVA,
        Activity.Kind.ATIVIDADE: CalendarEvent.Type.DELIVERY_ATIVIDADE,
        Activity.Kind.TRABALHO: CalendarEvent.Type.DELIVERY_TRABALHO,
    }[kind]


def _student_upcoming_items(user) -> list[dict[str, Any]]:
    now = timezone.now()
    items: list[dict[str, Any]] = []

    manual_events = CalendarEvent.objects.filter(start_at__gte=now).order_by("start_at", "id")
    for event in manual_events:
        items.append(
            {
                "id": f"calendar-{event.id}",
                "title": event.title,
                "description": event.description or None,
                "startAt": event.start_at.isoformat(),
                "endAt": event.end_at.isoformat() if event.end_at else None,
                "source": "calendar_event",
                "eventType": event.type,
                "sourceActivityId": str(event.source_activity_id) if event.source_activity_id else None,
            }
        )

    activities = (
        Activity.objects.filter(
            status__in=[Activity.Status.PUBLISHED, Activity.Status.CLOSED],
            due_at__gte=now,
        )
        .exclude(due_at__isnull=True)
        .order_by("due_at", "id")
    )
    for activity in activities:
        items.append(
            {
                "id": f"activity-{activity.id}",
                "title": f"Prazo: {activity.title}",
                "description": activity.description or None,
                "startAt": activity.due_at.isoformat(),
                "endAt": None,
                "source": "calendar_event",
                "eventType": _activity_event_type(activity.kind),
                "sourceActivityId": str(activity.id),
            }
        )

    notes = PersonalCalendarNote.objects.filter(student=user, start_at__gte=now).order_by(
        "start_at", "id"
    )
    for note in notes:
        items.append(
            {
                "id": f"note-{note.id}",
                "title": note.title,
                "description": note.description,
                "startAt": note.start_at.isoformat(),
                "endAt": note.end_at.isoformat() if note.end_at else None,
                "source": "personal_note",
                "eventType": None,
                "sourceActivityId": None,
            }
        )

    items.sort(key=lambda item: (item["startAt"], item["id"]))
    return items[:3]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_home_summary(request):
    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem acessar este resumo.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    recent_posts = CommunityPost.objects.filter(
        audience=CommunityPost.Audience.ALUNOS,
        status=CommunityPost.Status.APPROVED,
    ).order_by("-created_at", "-id")[:3]

    return Response(
        {
            "recentPosts": [
                community_post_summary_payload(post) for post in recent_posts
            ],
            "upcomingItems": _student_upcoming_items(request.user),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def teacher_home_summary(request):
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem acessar este resumo.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    recent_contents = (
        Content.objects.filter(author=request.user)
        .annotate(recency_at=Coalesce("published_at", "created_at"))
        .order_by("-recency_at", "-id")[:3]
    )

    pending_reviews = (
        Submission.objects.select_related("activity", "student", "student__profile")
        .filter(
            activity__created_by=request.user,
            status=Submission.Status.SUBMITTED,
        )
        .order_by("submitted_at", "created_at", "id")[:5]
    )

    return Response(
        {
            "recentContents": [
                content_summary_payload(content) for content in recent_contents
            ],
            "pendingReviews": [
                {
                    "submissionId": str(submission.id),
                    "activityId": str(submission.activity_id),
                    "activityTitle": submission.activity.title,
                    "studentId": str(submission.student_id),
                    "studentName": (
                        submission.student.profile.display_name
                        or submission.student.get_full_name()
                        or submission.student.username
                    ),
                    "submittedAt": (
                        submission.submitted_at.isoformat()
                        if submission.submitted_at
                        else None
                    ),
                    "status": submission.status,
                }
                for submission in pending_reviews
            ],
        }
    )
