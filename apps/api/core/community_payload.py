from __future__ import annotations

from typing import Any

from core.models import CommunityApproval, CommunityPost


def moderation_payload(approval: CommunityApproval | None, post: CommunityPost) -> dict[str, Any]:
    return {
        "postId": str(post.id),
        "status": post.status,
        "moderatedBy": str(approval.approved_by_id) if approval else None,
        "moderatedAt": approval.approved_at.isoformat() if approval else None,
        "comment": approval.comment if approval and approval.comment else None,
    }


def community_post_summary_payload(post: CommunityPost) -> dict[str, Any]:
    return {
        "id": str(post.id),
        "authorId": str(post.author_id),
        "audience": post.audience,
        "title": post.title,
        "body": post.body,
        "status": post.status,
        "createdAt": post.created_at.isoformat(),
        "imageUrl": post.image_url,
        "videoUrl": post.video_url,
        "gifUrl": post.gif_url,
    }


def community_post_detail_payload(post: CommunityPost) -> dict[str, Any]:
    latest_approval = post.approvals.first()
    return {
        **community_post_summary_payload(post),
        "moderation": moderation_payload(latest_approval, post)
        if post.status in {"pending_review", "approved", "rejected"}
        else None,
    }
