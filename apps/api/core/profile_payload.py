from __future__ import annotations

from typing import Any

from django.contrib.auth.models import User


def profile_payload(user: User) -> dict[str, Any]:
    profile = user.profile
    return {
        "userId": str(user.id),
        "role": profile.role,
        "displayName": profile.display_name or user.get_full_name() or user.username,
        "avatarUrl": profile.avatar_url,
        "bio": profile.bio or None,
        "preferences": profile.preferences or {},
    }
