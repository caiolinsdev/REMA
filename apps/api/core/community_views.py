from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.media_utils import validate_controlled_media_url
from core.community_payload import (
    community_post_detail_payload,
    community_post_summary_payload,
)
from core.models import CommunityApproval, CommunityPost, UserProfile


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _is_student(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.ALUNO


def _error(message: str, *, code: str = "invalid_community", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def community_posts_collection(request):
    if request.method == "GET":
        queryset = CommunityPost.objects.prefetch_related("approvals")
        audience = request.query_params.get("audience")
        queue = request.query_params.get("queue")
        scope = request.query_params.get("scope")

        if _is_professor(request.user):
            if queue == "moderation":
                queryset = queryset.filter(
                    audience=CommunityPost.Audience.ALUNOS,
                    status=CommunityPost.Status.PENDING_REVIEW,
                )
            else:
                queryset = queryset.filter(
                    audience=CommunityPost.Audience.PROFESSORES,
                    author__profile__role=UserProfile.Role.PROFESSOR,
                )
        else:
            if scope == "mine":
                queryset = queryset.filter(
                    audience=CommunityPost.Audience.ALUNOS,
                    author=request.user,
                )
            else:
                queryset = queryset.filter(
                    audience=CommunityPost.Audience.ALUNOS,
                    status=CommunityPost.Status.APPROVED,
                )

        if audience in CommunityPost.Audience.values:
            queryset = queryset.filter(audience=audience)
        return Response([community_post_summary_payload(post) for post in queryset])

    audience = str(request.data.get("audience") or "").strip()
    title = str(request.data.get("title") or "").strip()
    body = str(request.data.get("body") or "").strip()
    try:
        image_url = validate_controlled_media_url(
            request.data.get("imageUrl") or request.data.get("image_url"),
            allowed_kinds={"community_image"},
        )
        video_url = validate_controlled_media_url(
            request.data.get("videoUrl") or request.data.get("video_url"),
            allowed_kinds={"community_video"},
        )
        gif_url = validate_controlled_media_url(
            request.data.get("gifUrl") or request.data.get("gif_url"),
            allowed_kinds={"community_gif"},
        )
    except ValueError as exc:
        return _error(str(exc))

    if audience not in CommunityPost.Audience.values:
        return _error("Audience inválida.")
    if not title or not body:
        return _error("Título e corpo são obrigatórios.")

    if _is_student(request.user):
        if audience != CommunityPost.Audience.ALUNOS:
            return _error(
                "Aluno só pode publicar na comunidade de alunos.",
                code="forbidden_role",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        status_value = CommunityPost.Status.PENDING_REVIEW
    elif _is_professor(request.user):
        if audience != CommunityPost.Audience.PROFESSORES:
            return _error(
                "Professor publica no feed privado de professores nesta fase.",
                code="forbidden_role",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        status_value = CommunityPost.Status.APPROVED
    else:
        return _error(
            "Papel sem acesso a comunidade.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    post = CommunityPost.objects.create(
        author=request.user,
        audience=audience,
        title=title,
        body=body,
        status=status_value,
        image_url=image_url,
        video_url=video_url,
        gif_url=gif_url,
    )
    return Response(
        community_post_detail_payload(post), status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def community_post_item(request, post_id: int):
    queryset = CommunityPost.objects.prefetch_related("approvals")
    if _is_professor(request.user):
        queryset = queryset.filter(
            audience__in=[
                CommunityPost.Audience.ALUNOS,
                CommunityPost.Audience.PROFESSORES,
            ]
        )
    else:
        queryset = queryset.filter(
            audience=CommunityPost.Audience.ALUNOS
        ).filter(
            Q(status=CommunityPost.Status.APPROVED) | Q(author=request.user)
        )
    post = get_object_or_404(queryset, pk=post_id)
    return Response(community_post_detail_payload(post))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def community_post_approve(request, post_id: int):
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem moderar posts.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    post = get_object_or_404(
        CommunityPost,
        pk=post_id,
        audience=CommunityPost.Audience.ALUNOS,
    )
    comment = str(request.data.get("comment") or "").strip()
    CommunityApproval.objects.create(
        post=post,
        approved_by=request.user,
        status=CommunityPost.Status.APPROVED,
        comment=comment,
    )
    post.status = CommunityPost.Status.APPROVED
    post.save(update_fields=["status", "updated_at"])
    return Response(community_post_detail_payload(post))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def community_post_reject(request, post_id: int):
    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem moderar posts.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    post = get_object_or_404(
        CommunityPost,
        pk=post_id,
        audience=CommunityPost.Audience.ALUNOS,
    )
    comment = str(request.data.get("comment") or "").strip()
    CommunityApproval.objects.create(
        post=post,
        approved_by=request.user,
        status=CommunityPost.Status.REJECTED,
        comment=comment,
    )
    post.status = CommunityPost.Status.REJECTED
    post.save(update_fields=["status", "updated_at"])
    return Response(community_post_detail_payload(post))
