from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from urllib.parse import urlparse

from src.instagram import InstagramMedia, extract_instagram_media
from src.keywords import find_matching_keywords
from src.openai_processor import process_text
from src.transcription import transcribe_with_assemblyai


@dataclass(frozen=True)
class PipelineResult:
    source_type: str
    matched_keywords: list[str]
    caption: str
    web_text: str | None
    transcript: str | None
    processed_text: str
    media: InstagramMedia
    output_dir: Path


def run_pipeline(
    post_url: str,
    openai_api_key: str,
    openai_model: str,
    assemblyai_api_key: str,
    keywords: tuple[str, ...],
) -> PipelineResult:
    if _is_instagram_url(post_url):
        return _run_instagram_pipeline(
            post_url=post_url,
            openai_api_key=openai_api_key,
            openai_model=openai_model,
            assemblyai_api_key=assemblyai_api_key,
            keywords=keywords,
        )
    return _run_web_pipeline(
        url=post_url,
        openai_api_key=openai_api_key,
        openai_model=openai_model,
    )


def _run_instagram_pipeline(
    post_url: str,
    openai_api_key: str,
    openai_model: str,
    assemblyai_api_key: str,
    keywords: tuple[str, ...],
) -> PipelineResult:
    media = extract_instagram_media(post_url)
    output_dir = _prepare_output_dir(media)
    _write_text_file(output_dir / "caption.txt", media.caption)
    matched_keywords = find_matching_keywords(media.caption, keywords)

    if matched_keywords:
        processed_text = process_text(
            api_key=openai_api_key,
            model=openai_model,
            text=media.caption,
            source="instagram_caption",
        )
        _write_json_file(output_dir / "receta.json", processed_text)
        output_dir = _finalize_output_dir(output_dir, processed_text)
        _write_metadata_file(
            output_dir=output_dir,
            post_url=post_url,
            source_type="caption",
            matched_keywords=matched_keywords,
            media=media,
            transcript_created=False,
        )
        return PipelineResult(
            source_type="caption",
            matched_keywords=matched_keywords,
            caption=media.caption,
            transcript=None,
            processed_text=processed_text,
            media=media,
            output_dir=output_dir,
        )

    transcript, source_type = transcribe_with_assemblyai(
        api_key=assemblyai_api_key,
        post_url=post_url,
        media_url=media.media_url,
    )
    _write_text_file(output_dir / "transcripcion.txt", transcript)
    combined_text = _build_recipe_input(media.caption, transcript)
    processed_text = process_text(
        api_key=openai_api_key,
        model=openai_model,
        text=combined_text,
        source=source_type,
    )
    _write_json_file(output_dir / "receta.json", processed_text)
    output_dir = _finalize_output_dir(output_dir, processed_text)
    _write_metadata_file(
        output_dir=output_dir,
        post_url=post_url,
        source_type=source_type,
        matched_keywords=[],
        media=media,
        transcript_created=True,
    )
    return PipelineResult(
        source_type=source_type,
        matched_keywords=[],
        caption=media.caption,
        transcript=transcript,
        processed_text=processed_text,
        media=media,
        output_dir=output_dir,
    )


