from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.content_payload import content_detail_payload, content_summary_payload
from core.models import Content, UserProfile


def _is_professor(user) -> bool:
    return getattr(user.profile, "role", None) == UserProfile.Role.PROFESSOR


def _error(message: str, *, code: str = "invalid_content", http_status: int = 400):
    return Response({"code": code, "message": message}, status=http_status)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def contents_collection(request):
    if request.method == "GET":
        queryset = Content.objects.select_related("author")
        if _is_professor(request.user):
            queryset = queryset.filter(author=request.user)
        else:
            queryset = queryset.filter(status=Content.Status.PUBLISHED)
        return Response([content_summary_payload(content) for content in queryset])

    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem criar conteudos.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    title = str(request.data.get("title") or "").strip()
    subtitle = str(request.data.get("subtitle") or "").strip()
    description = str(request.data.get("description") or "").strip()
    image_url = request.data.get("imageUrl") or request.data.get("image_url")
    video_url = request.data.get("videoUrl") or request.data.get("video_url")

    if not title or not subtitle or not description:
        return _error("Titulo, subtitulo e descricao sao obrigatorios.")

    content = Content.objects.create(
        title=title,
        subtitle=subtitle,
        description=description,
        author=request.user,
        image_url=image_url,
        video_url=video_url,
    )
    return Response(content_detail_payload(content), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def content_item(request, content_id: int):
    queryset = Content.objects.select_related("author")
    if _is_professor(request.user):
        queryset = queryset.filter(author=request.user)
    else:
        queryset = queryset.filter(status=Content.Status.PUBLISHED)
    content = get_object_or_404(queryset, pk=content_id)

    if request.method == "GET":
        return Response(content_detail_payload(content))

    if not _is_professor(request.user):
        return _error(
            "Apenas professores podem alterar conteudos.",
            code="forbidden_role",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "DELETE":
        content.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    title = str(request.data.get("title", content.title) or "").strip()
    subtitle = str(request.data.get("subtitle", content.subtitle) or "").strip()
    description = str(request.data.get("description", content.description) or "").strip()
    image_url = request.data.get("imageUrl", request.data.get("image_url", content.image_url))
    video_url = request.data.get("videoUrl", request.data.get("video_url", content.video_url))
    requested_status = request.data.get("status", content.status)

    if not title or not subtitle or not description:
        return _error("Titulo, subtitulo e descricao sao obrigatorios.")
    if requested_status not in Content.Status.values:
        return _error("Status de conteudo invalido.")

    content.title = title
    content.subtitle = subtitle
    content.description = description
    content.image_url = image_url
    content.video_url = video_url
    content.status = requested_status
    if requested_status == Content.Status.PUBLISHED and content.published_at is None:
        content.published_at = timezone.now()
    if requested_status != Content.Status.PUBLISHED:
        content.published_at = None
    content.save()
    return Response(content_detail_payload(content))
