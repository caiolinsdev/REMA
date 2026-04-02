from __future__ import annotations

from typing import Any

from core.models import CalendarEvent, PersonalCalendarNote


def calendar_event_payload(event: CalendarEvent | dict[str, Any]) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    return {
        "id": str(event.id),
        "title": event.title,
        "type": event.type,
        "startAt": event.start_at.isoformat(),
        "endAt": event.end_at.isoformat() if event.end_at else None,
        "sourceActivityId": str(event.source_activity_id) if event.source_activity_id else None,
        "description": event.description or None,
    }


def personal_note_payload(note: PersonalCalendarNote) -> dict[str, Any]:
    return {
        "id": str(note.id),
        "studentId": str(note.student_id),
        "title": note.title,
        "description": note.description,
        "startAt": note.start_at.isoformat(),
        "endAt": note.end_at.isoformat() if note.end_at else None,
    }
