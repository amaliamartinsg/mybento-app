from __future__ import annotations

from dataclasses import dataclass

from src.instagram import InstagramMedia, extract_instagram_media
from src.keywords import find_matching_keywords
from src.openai_processor import process_text
from src.transcription import transcribe_with_assemblyai


@dataclass(frozen=True)
class PipelineResult:
    source_type: str
    matched_keywords: list[str]
    caption: str
    transcript: str | None
    processed_text: str
    media: InstagramMedia


def run_pipeline(
    post_url: str,
    openai_api_key: str,
    openai_model: str,
    assemblyai_api_key: str,
    keywords: tuple[str, ...],
) -> PipelineResult:
    media = extract_instagram_media(post_url)
    matched_keywords = find_matching_keywords(media.caption, keywords)

    if matched_keywords:
        processed_text = process_text(
            api_key=openai_api_key,
            model=openai_model,
            text=media.caption,
            source="instagram_caption",
        )
        return PipelineResult(
            source_type="caption",
            matched_keywords=matched_keywords,
            caption=media.caption,
            transcript=None,
            processed_text=processed_text,
            media=media,
        )

    transcript, source_type = transcribe_with_assemblyai(
        api_key=assemblyai_api_key,
        post_url=post_url,
        media_url=media.media_url,
    )
    processed_text = process_text(
        api_key=openai_api_key,
        model=openai_model,
        text=transcript,
        source=source_type,
    )
    return PipelineResult(
        source_type=source_type,
        matched_keywords=[],
        caption=media.caption,
        transcript=transcript,
        processed_text=processed_text,
        media=media,
    )
