from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.games_payload import (
    game_detail_payload,
    game_session_payload,
    game_summary_payload,
)
from core.games_runtime import build_game_runtime
from core.models import Game, GameSession, UserProfile


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_game", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


def _student_only(request):
    if _is_student(request.user):
        return None
    return _error(
        "Apenas alunos acessam jogos nesta fase.",
        code="forbidden_role",
        http_status=status.HTTP_403_FORBIDDEN,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def games_collection(request):
    student_only_error = _student_only(request)
    if student_only_error is not None:
        return student_only_error

    games = Game.objects.filter(status=Game.Status.PUBLISHED).prefetch_related("sessions")
    return Response(
        [game_summary_payload(game, student_id=request.user.id) for game in games]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def game_item(request, game_id: int):
    student_only_error = _student_only(request)
    if student_only_error is not None:
        return student_only_error

    game = get_object_or_404(Game, pk=game_id, status=Game.Status.PUBLISHED)
    return Response(game_detail_payload(game, student_id=request.user.id))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def game_runtime(request, game_id: int):
    student_only_error = _student_only(request)
    if student_only_error is not None:
        return student_only_error

    game = get_object_or_404(Game, pk=game_id, status=Game.Status.PUBLISHED)
    try:
        return Response(build_game_runtime(game))
    except ValueError as exc:
        return _error(str(exc), code="unsupported_game")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def game_sessions_collection(request, game_id: int):
    student_only_error = _student_only(request)
    if student_only_error is not None:
        return student_only_error

    game = get_object_or_404(Game, pk=game_id, status=Game.Status.PUBLISHED)
    try:
        score = int(request.data.get("score", 0))
        progress = int(request.data.get("progress", 0))
    except (TypeError, ValueError):
        return _error("Score e progresso devem ser numéricos.")

    if score < 0 or score > 100:
        return _error("Score deve ficar entre 0 e 100.")
    if progress < 0 or progress > 100:
        return _error("Progresso deve ficar entre 0 e 100.")

    session = GameSession.objects.create(
        game=game,
        student=request.user,
        score=score,
        progress=progress,
    )
    return Response(game_session_payload(session), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_game_sessions(request):
    student_only_error = _student_only(request)
    if student_only_error is not None:
        return student_only_error

    sessions = GameSession.objects.select_related("game").filter(student=request.user)
    return Response([game_session_payload(session) for session in sessions])
