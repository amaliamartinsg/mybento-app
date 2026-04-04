from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from urllib.parse import urlparse

from src.instagram import InstagramMedia, extract_instagram_media
from src.keywords import find_matching_keywords
from src.models import RecipeData
from src.openai_processor import process_text
from src.transcription import transcribe_with_assemblyai
from src.web_recipe import extract_web_recipe_content


@dataclass(frozen=True)
class PipelineResult:
    source_type: str
    matched_keywords: list[str]
    caption: str
    web_text: str | None
    transcript: str | None
    recipe: RecipeData
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
            web_text=None,
            transcript=None,
            recipe=processed_text,
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
        web_text=None,
        transcript=transcript,
        recipe=processed_text,
        media=media,
        output_dir=output_dir,
    )


def _run_web_pipeline(
    url: str,
    openai_api_key: str,
    openai_model: str,
) -> PipelineResult:
    web_content = extract_web_recipe_content(url)
    media = InstagramMedia(
        source_url=url,
        caption=web_content.title,
        media_url=None,
        media_id=None,
        extractor=f"web:{web_content.domain}",
    )
    output_dir = _prepare_output_dir(media)
    _write_text_file(output_dir / "text_web.txt", web_content.text)

    processed_text = process_text(
        api_key=openai_api_key,
        model=openai_model,
        text=_build_web_input(web_content.title, web_content.text),
        source="web_text",
    )
    _write_json_file(output_dir / "receta.json", processed_text)
    output_dir = _finalize_output_dir(output_dir, processed_text)
    _write_metadata_file(
        output_dir=output_dir,
        post_url=url,
        source_type="web_text",
        matched_keywords=[],
        media=media,
        transcript_created=False,
    )
    return PipelineResult(
        source_type="web_text",
        matched_keywords=[],
        caption=web_content.title,
        web_text=web_content.text,
        transcript=None,
        recipe=processed_text,
        media=media,
        output_dir=output_dir,
    )


def _build_recipe_input(caption: str, transcript: str) -> str:
    parts: list[str] = []
    if caption.strip():
        parts.append(f"Caption:\n{caption.strip()}")
    if transcript.strip():
        parts.append(f"Transcripcion:\n{transcript.strip()}")
    return "\n\n".join(parts)


def _build_web_input(title: str, text: str) -> str:
    parts: list[str] = []
    if title.strip():
        parts.append(f"Titulo web:\n{title.strip()}")
    if text.strip():
        parts.append(f"Texto web:\n{text.strip()}")
    return "\n\n".join(parts)


def _prepare_output_dir(media: InstagramMedia) -> Path:
    base_dir = Path("outputs")
    base_dir.mkdir(exist_ok=True)

    media_id = media.media_id or "instagram_post"
    slug_source = media.caption or media.source_url
    slug = _slugify(slug_source)[:50] or "sin_titulo"
    output_dir = _unique_path(base_dir / f"_tmp_{media_id}_{slug}")
    output_dir.mkdir(exist_ok=True)
    return output_dir


def _write_text_file(path: Path, content: str | None) -> None:
    path.write_text((content or "").strip(), encoding="utf-8")


def _write_json_file(path: Path, recipe: RecipeData) -> None:
    parsed = _recipe_to_dict(recipe)
    path.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")


def _write_metadata_file(
    output_dir: Path,
    post_url: str,
    source_type: str,
    matched_keywords: list[str],
    media: InstagramMedia,
    transcript_created: bool,
) -> None:
    metadata = {
        "post_url": post_url,
        "source_type": source_type,
        "matched_keywords": matched_keywords,
        "transcript_created": transcript_created,
        "caption_found": bool(media.caption.strip()),
        "media_url_found": bool(media.media_url),
        "media_id": media.media_id,
        "extractor": media.extractor,
    }
    path = output_dir / "metadata.json"
    path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")


def _finalize_output_dir(current_dir: Path, recipe: RecipeData) -> Path:
    title = recipe.name.strip()
    final_name = _slugify(title)[:80] or current_dir.name.replace("_tmp_", "", 1)
    final_dir = _unique_path(current_dir.parent / final_name, current_dir)
    if final_dir != current_dir:
        current_dir.rename(final_dir)
    return final_dir


def _recipe_to_dict(recipe: RecipeData) -> dict:
    return {
        "name": recipe.name,
        "servings": recipe.servings,
        "instructions_text": recipe.instructions_text,
        "ingredients": [
            {
                "name": ingredient.name,
                "quantity_g": ingredient.quantity_g,
            }
            for ingredient in recipe.ingredients
        ],
    }


def _unique_path(path: Path, current_path: Path | None = None) -> Path:
    if current_path is not None and path == current_path:
        return path
    if not path.exists():
        return path

    base_name = path.name
    parent = path.parent
    counter = 2
    while True:
        candidate = parent / f"{base_name}_{counter}"
        if current_path is not None and candidate == current_path:
            return candidate
        if not candidate.exists():
            return candidate
        counter += 1


def _slugify(value: str) -> str:
    allowed = []
    previous_was_separator = False
    for char in value.lower():
        if char.isalnum():
            allowed.append(char)
            previous_was_separator = False
            continue
        if not previous_was_separator:
            allowed.append("_")
            previous_was_separator = True
    return "".join(allowed).strip("_")


def _is_instagram_url(url: str) -> bool:
    netloc = urlparse(url).netloc.lower()
    return "instagram.com" in netloc
