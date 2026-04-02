from __future__ import annotations

from typing import Any

from django.contrib.auth.models import User

from core.models import UserProfile


def display_name_for(user: User, profile: UserProfile) -> str:
    if profile.display_name:
        return profile.display_name
    full = user.get_full_name()
    if full:
        return full
    return user.username


def user_me_payload(user: User) -> dict[str, Any]:
    profile = user.profile
    name = display_name_for(user, profile)
    uid = str(user.id)
    return {
        "id": uid,
        "name": name,
        "email": user.email or "",
        "role": profile.role,
        "profile": {
            "userId": uid,
            "role": profile.role,
            "displayName": name,
            "avatarUrl": profile.avatar_url,
            "bio": profile.bio or None,
            "preferences": profile.preferences or {},
        },
    }
