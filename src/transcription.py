from __future__ import annotations

import mimetypes
import tempfile
import time
from pathlib import Path
from typing import Any

import requests
import yt_dlp


ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2"
DEFAULT_SPEECH_MODELS = ["universal-2"]


class TranscriptionError(RuntimeError):
    pass


def transcribe_with_assemblyai(
    api_key: str,
    post_url: str,
    media_url: str | None,
) -> tuple[str, str]:
    if media_url:
        try:
            transcript = _transcribe_remote_media(api_key, media_url)
            return transcript, "assemblyai_remote_url"
        except TranscriptionError:
            pass

    transcript = _transcribe_local_fallback(api_key, post_url)
    return transcript, "assemblyai_local_upload"


def _transcribe_remote_media(api_key: str, media_url: str) -> str:
    transcript_id = _create_transcript_job(
        api_key=api_key,
        audio_url=media_url,
    )
    return _poll_transcript(api_key, transcript_id)


def _transcribe_local_fallback(api_key: str, post_url: str) -> str:
    with tempfile.TemporaryDirectory(prefix="ig_transcribe_") as temp_dir:
        media_path = _download_media(post_url, Path(temp_dir))
        upload_url = _upload_file(api_key, media_path)
        transcript_id = _create_transcript_job(api_key=api_key, audio_url=upload_url)
        return _poll_transcript(api_key, transcript_id)


def _download_media(post_url: str, destination_dir: Path) -> Path:
    output_template = str(destination_dir / "%(id)s.%(ext)s")
    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "format": "bestaudio/best",
        "outtmpl": output_template,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([post_url])
        info = ydl.extract_info(post_url, download=False)
        prepared_path = Path(ydl.prepare_filename(info))

    if prepared_path.exists():
        return prepared_path

    files = sorted(destination_dir.iterdir())
    if not files:
        raise TranscriptionError("No se pudo descargar el media temporalmente.")
    return files[0]


def _upload_file(api_key: str, media_path: Path) -> str:
    headers = {"authorization": api_key}
    mime_type = mimetypes.guess_type(media_path.name)[0] or "application/octet-stream"
    with media_path.open("rb") as file_handle:
        response = requests.post(
            f"{ASSEMBLYAI_BASE_URL}/upload",
            headers=headers,
            files={"file": (media_path.name, file_handle, mime_type)},
            timeout=120,
        )
    response.raise_for_status()
    return response.json()["upload_url"]


def _create_transcript_job(api_key: str, audio_url: str) -> str:
    headers = {
        "authorization": api_key,
        "content-type": "application/json",
    }
    payload = {
        "audio_url": audio_url,
        "speech_models": DEFAULT_SPEECH_MODELS,
        "language_detection": True,
    }
    response = requests.post(
        f"{ASSEMBLYAI_BASE_URL}/transcript",
        headers=headers,
        json=payload,
        timeout=60,
    )
    if response.status_code >= 400:
        raise TranscriptionError(
            f"AssemblyAI rechazo la solicitud: {response.status_code} {response.text}"
        )
    return response.json()["id"]


def _poll_transcript(api_key: str, transcript_id: str) -> str:
    headers = {"authorization": api_key}
    for _ in range(120):
        response = requests.get(
            f"{ASSEMBLYAI_BASE_URL}/transcript/{transcript_id}",
            headers=headers,
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        status = data.get("status")

        if status == "completed":
            return (data.get("text") or "").strip()
        if status == "error":
            raise TranscriptionError(data.get("error") or "AssemblyAI devolvio error.")

        time.sleep(3)

    raise TranscriptionError("Timeout esperando la transcripcion de AssemblyAI.")
