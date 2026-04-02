from __future__ import annotations

from typing import Any

from core.models import Content


def content_summary_payload(content: Content) -> dict[str, Any]:
    return {
        "id": str(content.id),
        "title": content.title,
        "subtitle": content.subtitle,
        "publishedAt": content.published_at.isoformat() if content.published_at else "",
        "authorId": str(content.author_id),
        "status": content.status,
        "imageUrl": content.image_url,
    }


def content_detail_payload(content: Content) -> dict[str, Any]:
    return {
        **content_summary_payload(content),
        "description": content.description,
        "videoUrl": content.video_url,
    }
