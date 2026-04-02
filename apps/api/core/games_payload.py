from __future__ import annotations

from typing import Any

from django.db.models import Max

from core.models import Game, GameSession


def _student_stats(game: Game, student_id: int | None) -> dict[str, Any]:
    if student_id is None:
        return {"bestScore": None, "lastProgress": None, "totalSessions": 0}

    sessions = game.sessions.filter(student_id=student_id)
    aggregate = sessions.aggregate(best_score=Max("score"))
    latest_session = sessions.first()
    return {
        "bestScore": aggregate["best_score"],
        "lastProgress": latest_session.progress if latest_session else None,
        "totalSessions": sessions.count(),
    }


def game_summary_payload(game: Game, *, student_id: int | None = None) -> dict[str, Any]:
    stats = _student_stats(game, student_id)
    return {
        "id": str(game.id),
        "slug": game.slug,
        "title": game.title,
        "description": game.description,
        "experienceType": game.experience_type,
        "estimatedMinutes": game.estimated_minutes,
        "status": game.status,
        "bestScore": stats["bestScore"],
        "lastProgress": stats["lastProgress"],
    }


def game_detail_payload(game: Game, *, student_id: int | None = None) -> dict[str, Any]:
    stats = _student_stats(game, student_id)
    return {
        **game_summary_payload(game, student_id=student_id),
        "instructions": game.instructions,
        "totalSessions": stats["totalSessions"],
    }


def game_session_payload(session: GameSession) -> dict[str, Any]:
    return {
        "id": str(session.id),
        "gameId": str(session.game_id),
        "gameTitle": session.game.title,
        "score": session.score,
        "progress": session.progress,
        "playedAt": session.played_at.isoformat(),
    }
