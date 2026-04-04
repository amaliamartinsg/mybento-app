from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/135.0.0.0 Safari/537.36"
)


@dataclass(frozen=True)
class WebRecipeContent:
    source_url: str
    title: str
    text: str
    domain: str


def extract_web_recipe_content(url: str) -> WebRecipeContent:
    response = requests.get(
        url,
        headers={"user-agent": USER_AGENT},
        timeout=60,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    _remove_noise(soup)

    title = _extract_title(soup)
    text = _extract_main_text(soup)
    domain = urlparse(url).netloc.lower()

    return WebRecipeContent(
        source_url=url,
        title=title,
        text=text,
        domain=domain,
    )


def _remove_noise(soup: BeautifulSoup) -> None:
    for tag in soup(
        [
            "script",
            "style",
            "noscript",
            "svg",
            "header",
            "footer",
            "nav",
            "aside",
            "form",
        ]
    ):
        tag.decompose()


def _extract_title(soup: BeautifulSoup) -> str:
    if soup.title and soup.title.string:
        return soup.title.string.strip()

    for heading in ("h1", "h2"):
        node = soup.find(heading)
        if node:
            text = node.get_text(" ", strip=True)
            if text:
                return text

    return "N/D"


def _extract_main_text(soup: BeautifulSoup) -> str:
    candidates = []

    selectors = [
        "article",
        "main",
        "[role='main']",
        ".entry-content",
        ".post-content",
        ".recipe-content",
        ".td-post-content",
    ]
    for selector in selectors:
        candidates.extend(soup.select(selector))

    if not candidates:
        candidates = [soup.body] if soup.body else []

    best_text = ""
    for node in candidates:
        if node is None:
            continue
        text = node.get_text("\n", strip=True)
        normalized = _normalize_text(text)
        if len(normalized) > len(best_text):
            best_text = normalized

    if not best_text:
        raise ValueError("No se pudo extraer texto util de la web.")

    return best_text


def _normalize_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    filtered = [line for line in lines if line]
    return "\n".join(filtered)
