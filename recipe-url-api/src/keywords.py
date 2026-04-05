from __future__ import annotations


def find_matching_keywords(text: str, keywords: tuple[str, ...]) -> list[str]:
    normalized_text = text.lower()
    return [keyword for keyword in keywords if keyword in normalized_text]
