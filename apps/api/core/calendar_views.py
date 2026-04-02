from __future__ import annotations

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.calendar_payload import calendar_event_payload, personal_note_payload
from core.models import Activity, CalendarEvent, PersonalCalendarNote, UserProfile


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_calendar", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


def _parse_dt(raw_value, label: str):
    if raw_value in (None, ""):
        return None
    parsed = parse_datetime(str(raw_value))
    if parsed is None:
        raise ValueError(f"{label} invalido.")
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _derived_activity_events(queryset: QuerySet[Activity]):
    payloads = []
    for activity in queryset.exclude(due_at__isnull=True):
        event_type = {
            Activity.Kind.PROVA: CalendarEvent.Type.DELIVERY_PROVA,
            Activity.Kind.ATIVIDADE: CalendarEvent.Type.DELIVERY_ATIVIDADE,
            Activity.Kind.TRABALHO: CalendarEvent.Type.DELIVERY_TRABALHO,
        }[activity.kind]
        payloads.append(
            {
                "id": f"activity-{activity.id}",
                "title": f"Prazo: {activity.title}",
                "type": event_type,
                "startAt": activity.due_at.isoformat(),
                "endAt": None,
                "sourceActivityId": str(activity.id),
                "description": activity.description or None,
            }
        )
    return payloads


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def calendar_events_collection(request):
    if request.method == "GET":
        manual_events = CalendarEvent.objects.select_related("source_activity").all()
        if _is_professor(request.user):
            manual_events = manual_events.filter(created_by=request.user)
            activities = Activity.objects.filter(created_by=request.user)
        else:
            manual_events = manual_events
            activities = Activity.objects.filter(status__in=[Activity.Status.PUBLISHED, Activity.Status.CLOSED])
        payload = [calendar_event_payload(event) for event in manual_events]
        payload.extend(_derived_activity_events(activities))
        payload.sort(key=lambda item: item["startAt"])
        return Response(payload)

    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem criar eventos globais.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    title = str(request.data.get("title") or "").strip()
    description = str(request.data.get("description") or "").strip()
    event_type = str(request.data.get("type") or "").strip()
    try:
        start_at = _parse_dt(request.data.get("startAt") or request.data.get("start_at"), "Inicio")
        end_at = _parse_dt(request.data.get("endAt") or request.data.get("end_at"), "Fim")
    except ValueError as exc:
        return _error(str(exc))

    if not title or not start_at:
        return _error("Titulo e inicio sao obrigatorios.")
    if event_type not in CalendarEvent.Type.values:
        return _error("Tipo de evento invalido.")

    event = CalendarEvent.objects.create(
        title=title,
        description=description,
        type=event_type,
        start_at=start_at,
        end_at=end_at,
        created_by=request.user,
    )
    return Response(calendar_event_payload(event), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def calendar_event_item(request, event_id: int):
    event = get_object_or_404(CalendarEvent, pk=event_id)

    if request.method == "GET":
        return Response(calendar_event_payload(event))

    if not _is_professor(request.user) or event.created_by_id != request.user.id:
        return _error(
            "Evento nao encontrado.",
            code="not_found",
            http_status=status.HTTP_404_NOT_FOUND,
        )

    try:
        start_at = _parse_dt(request.data.get("startAt", event.start_at), "Inicio")
        end_at = _parse_dt(request.data.get("endAt", event.end_at), "Fim")
    except ValueError as exc:
        return _error(str(exc))

    title = str(request.data.get("title", event.title) or "").strip()
    description = str(request.data.get("description", event.description) or "").strip()
    event_type = str(request.data.get("type", event.type) or "").strip()
    if not title or not start_at:
        return _error("Titulo e inicio sao obrigatorios.")
    if event_type not in CalendarEvent.Type.values:
        return _error("Tipo de evento invalido.")

    event.title = title
    event.description = description
    event.type = event_type
    event.start_at = start_at
    event.end_at = end_at
    event.save()
    return Response(calendar_event_payload(event))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def calendar_notes_collection(request):
    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem gerir notas pessoais.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        notes = PersonalCalendarNote.objects.filter(student=request.user)
        return Response([personal_note_payload(note) for note in notes])

    title = str(request.data.get("title") or "").strip()
    description = str(request.data.get("description") or "").strip()
    try:
        start_at = _parse_dt(request.data.get("startAt") or request.data.get("start_at"), "Inicio")
        end_at = _parse_dt(request.data.get("endAt") or request.data.get("end_at"), "Fim")
    except ValueError as exc:
        return _error(str(exc))
    if not title or not description or not start_at:
        return _error("Titulo, descricao e inicio sao obrigatorios.")

    note = PersonalCalendarNote.objects.create(
        student=request.user,
        title=title,
        description=description,
        start_at=start_at,
        end_at=end_at,
    )
    return Response(personal_note_payload(note), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def calendar_note_item(request, note_id: int):
    if not _is_student(request.user):
        return _error(
            "Apenas alunos podem alterar notas pessoais.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    note = get_object_or_404(PersonalCalendarNote, pk=note_id, student=request.user)
    try:
        start_at = _parse_dt(request.data.get("startAt", note.start_at), "Inicio")
        end_at = _parse_dt(request.data.get("endAt", note.end_at), "Fim")
    except ValueError as exc:
        return _error(str(exc))

    title = str(request.data.get("title", note.title) or "").strip()
    description = str(request.data.get("description", note.description) or "").strip()
    if not title or not description or not start_at:
        return _error("Titulo, descricao e inicio sao obrigatorios.")

    note.title = title
    note.description = description
    note.start_at = start_at
    note.end_at = end_at
    note.save()
    return Response(personal_note_payload(note))
