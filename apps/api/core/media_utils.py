from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from django.conf import settings


@dataclass(frozen=True)
class MediaRule:
    allowed_extensions: set[str]
    max_size_bytes: int
    expected_type_prefix: str | None = None
    expected_content_types: set[str] | None = None


MEDIA_RULES: dict[str, MediaRule] = {
    "avatar": MediaRule(
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp"},
        max_size_bytes=2 * 1024 * 1024,
        expected_type_prefix="image/",
    ),
    "content_image": MediaRule(
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp"},
        max_size_bytes=5 * 1024 * 1024,
        expected_type_prefix="image/",
    ),
    "content_video": MediaRule(
        allowed_extensions={".mp4", ".webm", ".mov"},
        max_size_bytes=25 * 1024 * 1024,
        expected_type_prefix="video/",
    ),
    "community_image": MediaRule(
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp"},
        max_size_bytes=5 * 1024 * 1024,
        expected_type_prefix="image/",
    ),
    "community_video": MediaRule(
        allowed_extensions={".mp4", ".webm", ".mov"},
        max_size_bytes=25 * 1024 * 1024,
        expected_type_prefix="video/",
    ),
    "community_gif": MediaRule(
        allowed_extensions={".gif"},
        max_size_bytes=8 * 1024 * 1024,
        expected_content_types={"image/gif"},
    ),
    "activity_support_image": MediaRule(
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp"},
        max_size_bytes=5 * 1024 * 1024,
        expected_type_prefix="image/",
    ),
}


def validate_uploaded_file(file, *, kind: str) -> MediaRule:
    rule = MEDIA_RULES.get(kind)
    if rule is None:
        raise ValueError("Tipo de midia invalido.")

    extension = Path(file.name or "").suffix.lower()
    if extension not in rule.allowed_extensions:
        allowed = ", ".join(sorted(ext.lstrip(".") for ext in rule.allowed_extensions))
        raise ValueError(f"Formato invalido para este contexto. Use: {allowed}.")

    if file.size > rule.max_size_bytes:
        limit_mb = rule.max_size_bytes // (1024 * 1024)
        raise ValueError(f"Arquivo excede o limite de {limit_mb} MB.")

    content_type = str(getattr(file, "content_type", "") or "").lower()
    if rule.expected_type_prefix and not content_type.startswith(rule.expected_type_prefix):
        raise ValueError("Tipo de arquivo invalido para este contexto.")
    if rule.expected_content_types and content_type not in rule.expected_content_types:
        raise ValueError("Tipo de arquivo invalido para este contexto.")

    return rule


def media_asset_payload(request, asset) -> dict[str, str | int]:
    return {
        "id": str(asset.id),
        "kind": asset.kind,
        "url": request.build_absolute_uri(asset.file.url),
        "contentType": asset.content_type,
        "size": asset.size,
    }


def validate_controlled_media_url(
    value,
    *,
    allowed_kinds: set[str] | None = None,
) -> str | None:
    if value in (None, ""):
        return None

    raw_value = str(value).strip()
    parsed = urlparse(raw_value)
    path = parsed.path or raw_value

    if not path.startswith(settings.MEDIA_URL):
        raise ValueError("Use um arquivo enviado pela API.")

    relative_path = path[len(settings.MEDIA_URL) :].lstrip("/")
    if not relative_path:
        raise ValueError("Arquivo de midia invalido.")

    from core.models import MediaAsset

    asset = MediaAsset.objects.filter(file=relative_path).first()
    if asset is None:
        raise ValueError("Arquivo de midia nao encontrado.")
    if allowed_kinds and asset.kind not in allowed_kinds:
        raise ValueError("Tipo de midia invalido para este campo.")

    return raw_value
