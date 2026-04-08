"""Barcode decoding and OpenFoodFacts-backed nutrition resolution."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from io import BytesIO

import httpx
from PIL import Image
from pyzbar.pyzbar import decode
from sqlmodel import Session, select

from app.backend.models.nutrition import NutritionProduct

logger = logging.getLogger("mybento.backend.barcode_nutrition")

_OFF_URL_TEMPLATE = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
_OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"


@dataclass
class BarcodeNutritionResult:
    product_id: int
    name: str
    barcode: str
    source: str
    source_ref: str | None
    kcal_100g: float
    prot_100g: float
    hc_100g: float
    fat_100g: float


class BarcodeDecodeError(Exception):
    """Raised when a barcode cannot be decoded from an image."""


class BarcodeLookupError(Exception):
    """Raised when a barcode product cannot be resolved."""


def decode_barcode_from_image(image_bytes: bytes) -> str:
    """Decode the first barcode found in the uploaded image."""
    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception as exc:
        raise BarcodeDecodeError("No se pudo leer la imagen subida.") from exc

    barcodes = decode(image)
    if not barcodes:
        raise BarcodeDecodeError("No se detectó ningún código de barras en la imagen.")

    return barcodes[0].data.decode("utf-8").strip()


def _to_result(product: NutritionProduct) -> BarcodeNutritionResult:
    return BarcodeNutritionResult(
        product_id=product.id or 0,
        name=product.name,
        barcode=product.barcode,
        source=product.source,
        source_ref=product.source_ref,
        kcal_100g=product.kcal_100g,
        prot_100g=product.prot_100g,
        hc_100g=product.hc_100g,
        fat_100g=product.fat_100g,
    )


async def resolve_barcode_image(session: Session, image_bytes: bytes) -> BarcodeNutritionResult:
    """Decode a barcode from an image and resolve its normalized nutrition."""
    barcode = decode_barcode_from_image(image_bytes)
    return await resolve_barcode(session, barcode)


async def resolve_barcode(session: Session, barcode: str) -> BarcodeNutritionResult:
    """Resolve a barcode to a trusted cached nutrition product."""
    cached = session.exec(
        select(NutritionProduct).where(NutritionProduct.barcode == barcode)
    ).first()
    if cached is not None:
        return _to_result(cached)

    fetched = await _fetch_from_openfoodfacts(barcode)
    now = datetime.utcnow()
    product = NutritionProduct(
        barcode=barcode,
        name=fetched["name"],
        brand=fetched.get("brand"),
        source="openfoodfacts",
        source_ref=barcode,
        kcal_100g=fetched["kcal_100g"],
        prot_100g=fetched["prot_100g"],
        hc_100g=fetched["hc_100g"],
        fat_100g=fetched["fat_100g"],
        created_at=now,
        updated_at=now,
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    logger.info("barcode_product_cached", extra={"barcode": barcode})
    return _to_result(product)


async def search_product_by_name(
    session: Session, query: str
) -> BarcodeNutritionResult:
    """Search OpenFoodFacts by name and normalize the first usable product."""
    fetched = await _search_openfoodfacts(query)
    barcode = fetched.get("barcode")
    if barcode:
        cached = session.exec(
            select(NutritionProduct).where(NutritionProduct.barcode == barcode)
        ).first()
        if cached is not None:
            return _to_result(cached)

        now = datetime.utcnow()
        product = NutritionProduct(
            barcode=barcode,
            name=fetched["name"],
            brand=fetched.get("brand"),
            source="openfoodfacts",
            source_ref=barcode,
            kcal_100g=fetched["kcal_100g"],
            prot_100g=fetched["prot_100g"],
            hc_100g=fetched["hc_100g"],
            fat_100g=fetched["fat_100g"],
            created_at=now,
            updated_at=now,
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        return _to_result(product)

    return BarcodeNutritionResult(
        product_id=0,
        name=str(fetched["name"]),
        barcode="",
        source="openfoodfacts",
        source_ref=None,
        kcal_100g=float(fetched["kcal_100g"]),
        prot_100g=float(fetched["prot_100g"]),
        hc_100g=float(fetched["hc_100g"]),
        fat_100g=float(fetched["fat_100g"]),
    )


def get_product_by_id(session: Session, product_id: int) -> NutritionProduct | None:
    """Load a trusted normalized nutrition product by primary key."""
    return session.get(NutritionProduct, product_id)


async def _fetch_from_openfoodfacts(barcode: str) -> dict[str, str | float | None]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                _OFF_URL_TEMPLATE.format(barcode=barcode),
                headers={"User-Agent": "MyBento/1.0"},
            )
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"No se pudo consultar OpenFoodFacts para el código '{barcode}': {exc}"
        ) from exc

    if response.status_code != 200:
        raise RuntimeError(
            f"OpenFoodFacts devolvió {response.status_code} para el código '{barcode}'."
        )

    data = response.json()
    if data.get("status") != 1:
        raise BarcodeLookupError("No se encontró ningún producto para ese código de barras.")

    product = data.get("product") or {}
    nutriments = product.get("nutriments") or {}
    name = (
        product.get("product_name_es")
        or product.get("product_name")
        or product.get("generic_name_es")
        or product.get("generic_name")
    )
    if not name:
        raise BarcodeLookupError("El producto existe pero no tiene nombre utilizable.")

    macros = {
        "kcal_100g": _coerce_number(nutriments.get("energy-kcal_100g")),
        "prot_100g": _coerce_number(nutriments.get("proteins_100g")),
        "hc_100g": _coerce_number(nutriments.get("carbohydrates_100g")),
        "fat_100g": _coerce_number(nutriments.get("fat_100g")),
    }
    if all(value == 0 for value in macros.values()):
        raise BarcodeLookupError(
            "El producto existe pero no tiene macros por 100 g utilizables."
        )

    return {
        "name": str(name).strip(),
        "brand": _clean_text(product.get("brands")),
        "barcode": barcode,
        **macros,
    }


async def _search_openfoodfacts(query: str) -> dict[str, str | float | None]:
    params = {
        "search_terms": query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 10,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                _OFF_SEARCH_URL,
                params=params,
                headers={"User-Agent": "MyBento/1.0"},
            )
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"No se pudo consultar OpenFoodFacts para '{query}': {exc}"
        ) from exc

    if response.status_code != 200:
        raise RuntimeError(
            f"OpenFoodFacts devolvió {response.status_code} al buscar '{query}'."
        )

    data = response.json()
    products = data.get("products") or []
    for product in products:
        try:
            normalized = _normalize_openfoodfacts_product(product)
        except BarcodeLookupError:
            continue
        if normalized is not None:
            return normalized

    raise BarcodeLookupError("No se encontró ningún producto utilizable para ese nombre.")


def _normalize_openfoodfacts_product(
    product: dict[str, object]
) -> dict[str, str | float | None]:
    nutriments = product.get("nutriments") or {}
    if not isinstance(nutriments, dict):
        raise BarcodeLookupError("Producto sin datos nutricionales.")

    name = (
        product.get("product_name_es")
        or product.get("product_name")
        or product.get("generic_name_es")
        or product.get("generic_name")
    )
    if not name:
        raise BarcodeLookupError("Producto sin nombre.")

    macros = {
        "kcal_100g": _coerce_number(nutriments.get("energy-kcal_100g")),
        "prot_100g": _coerce_number(nutriments.get("proteins_100g")),
        "hc_100g": _coerce_number(nutriments.get("carbohydrates_100g")),
        "fat_100g": _coerce_number(nutriments.get("fat_100g")),
    }
    if all(value == 0 for value in macros.values()):
        raise BarcodeLookupError("Producto sin macros por 100 g.")

    return {
        "name": str(name).strip(),
        "brand": _clean_text(product.get("brands")),
        "barcode": _clean_text(product.get("code")),
        **macros,
    }


def _coerce_number(value: object) -> float:
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _clean_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
