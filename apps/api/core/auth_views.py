from __future__ import annotations

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.auth_payload import user_me_payload
from core.models import AuthSession, UserProfile


def authenticate_by_email(email: str, password: str):
    candidates = User.objects.filter(email__iexact=email).order_by("id")
    authenticated_user = None
    for candidate in candidates:
        user = authenticate(username=candidate.username, password=password)
        if user is None:
            continue
        if authenticated_user is not None:
            return None
        authenticated_user = user
    return authenticated_user


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response(
            {
                "code": "invalid_body",
                "message": "Campos email e password sao obrigatorios.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = authenticate_by_email(email=email, password=password)
    if user is None:
        return Response(
            {
                "code": "invalid_credentials",
                "message": "Email ou senha invalidos.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not UserProfile.objects.filter(user=user).exists():
        return Response(
            {"code": "no_profile", "message": "Usuario sem perfil configurado."},
            status=status.HTTP_403_FORBIDDEN,
        )
    session = AuthSession.objects.create(user=user)
    return Response({"token": session.key, "user": user_me_payload(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me(request):
    return Response(user_me_payload(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auth_logout(request):
    if isinstance(request.auth, AuthSession):
        request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
