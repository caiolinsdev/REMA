from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.media_utils import media_asset_payload, validate_uploaded_file
from core.models import MediaAsset


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def media_upload(request):
    file = request.FILES.get("file")
    kind = str(request.data.get("kind") or "").strip()

    if file is None:
        return Response(
            {"code": "invalid_media", "message": "Arquivo e obrigatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_uploaded_file(file, kind=kind)
    except ValueError as exc:
        return Response(
            {"code": "invalid_media", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    asset = MediaAsset.objects.create(
        file=file,
        kind=kind,
        content_type=str(getattr(file, "content_type", "") or "application/octet-stream"),
        size=file.size,
        uploaded_by=request.user,
    )
    return Response(
        media_asset_payload(request, asset),
        status=status.HTTP_201_CREATED,
    )
