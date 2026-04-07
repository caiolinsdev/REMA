from __future__ import annotations

from rest_framework import authentication, exceptions

from core.models import AuthSession


class AuthSessionAuthentication(authentication.BaseAuthentication):
    keyword = "Token"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).split()
        if not header:
            return None
        if header[0].decode().lower() != self.keyword.lower():
            return None
        if len(header) != 2:
            raise exceptions.AuthenticationFailed("Token inválido.")

        session_key = header[1].decode()
        try:
            session = AuthSession.objects.select_related("user").get(key=session_key)
        except AuthSession.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Sessão inválida ou expirada.") from exc

        session.touch()
        return (session.user, session)

    def authenticate_header(self, request) -> str:
        return self.keyword
