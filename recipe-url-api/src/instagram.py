from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import yt_dlp


@dataclass(frozen=True)
class InstagramMedia:
    source_url: str
    caption: str
    media_url: str | None
    media_id: str | None
    extractor: str | None


def extract_instagram_media(post_url: str) -> InstagramMedia:
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(post_url, download=False)

    caption = _extract_caption(info)
    media_url = _extract_media_url(info)

    return InstagramMedia(
        source_url=post_url,
        caption=caption,
        media_url=media_url,
        media_id=_first_non_empty(info.get("id"), info.get("display_id")),
        extractor=info.get("extractor_key"),
    )


def _extract_caption(info: dict[str, Any]) -> str:
    candidates = [
        info.get("description"),
        info.get("title"),
        info.get("fulltitle"),
        info.get("alt_title"),
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ""


def _extract_media_url(info: dict[str, Any]) -> str | None:
    direct_url = info.get("url")
    if isinstance(direct_url, str) and direct_url.strip():
        return direct_url

    requested_downloads = info.get("requested_downloads") or []
    for item in requested_downloads:
        candidate = item.get("url")
        if isinstance(candidate, str) and candidate.strip():
            return candidate

    formats = info.get("formats") or []
    for fmt in formats:
        candidate = fmt.get("url")
        if isinstance(candidate, str) and candidate.strip():
            return candidate

    return None


def _first_non_empty(*values: object) -> str | None:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None
