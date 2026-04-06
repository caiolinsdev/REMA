from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.media_utils import validate_controlled_media_url
from core.profile_payload import profile_payload


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_item(request):
    profile = request.user.profile

    if request.method == "GET":
        return Response(profile_payload(request.user))

    display_name = str(
        request.data.get("displayName", request.data.get("display_name", profile.display_name))
        or ""
    ).strip()
    bio = str(request.data.get("bio", profile.bio) or "").strip()
    preferences = request.data.get("preferences", profile.preferences or {})
    if not isinstance(preferences, dict):
        return Response(
            {"code": "invalid_profile", "message": "Preferencias devem ser um objeto."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not display_name:
        return Response(
            {"code": "invalid_profile", "message": "Nome de exibicao e obrigatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    profile.display_name = display_name
    profile.bio = bio
    profile.preferences = preferences
    profile.save(update_fields=["display_name", "bio", "preferences"])
    return Response(profile_payload(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def profile_avatar(request):
    try:
        avatar_url = validate_controlled_media_url(
            request.data.get("avatarUrl", request.data.get("avatar_url", "")),
            allowed_kinds={"avatar"},
        )
    except ValueError as exc:
        return Response(
            {"code": "invalid_profile", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not avatar_url:
        return Response(
            {"code": "invalid_profile", "message": "Avatar e obrigatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    request.user.profile.avatar_url = avatar_url
    request.user.profile.save(update_fields=["avatar_url"])
    return Response(profile_payload(request.user))
