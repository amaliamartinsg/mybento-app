from __future__ import annotations

import argparse
import json
from dataclasses import asdict

from src.config import load_settings
from src.pipeline import run_pipeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Procesa un reel o post publico de Instagram."
    )
    parser.add_argument("url", help="URL publica del reel o post de Instagram")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    settings = load_settings()

    result = run_pipeline(
        post_url=args.url,
        openai_api_key=settings.openai_api_key,
        openai_model=settings.openai_model,
        assemblyai_api_key=settings.assemblyai_api_key,
        keywords=settings.keywords,
    )

    output = {
        "source_type": result.source_type,
        "matched_keywords": result.matched_keywords,
        "caption": result.caption,
        "web_text": result.web_text,
        "transcript": result.transcript,
        "recipe": asdict(result.recipe),
        "output_dir": str(result.output_dir.resolve()),
        "media_url_found": bool(result.media.media_url),
        "media_id": result.media.media_id,
        "extractor": result.media.extractor,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
