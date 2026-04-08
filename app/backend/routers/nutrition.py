"""Endpoints for barcode-based nutrition resolution."""

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.backend.database import get_session
from app.backend.schemas.nutrition import (
    BarcodeResolveResponse,
    NutritionLookupResponse,
    NutritionResolvedRead,
)
from app.backend.services.barcode_nutrition import (
    BarcodeDecodeError,
    BarcodeLookupError,
    resolve_barcode_image,
    search_product_by_name,
)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.post(
    "/barcode/resolve",
    response_model=BarcodeResolveResponse,
    summary="Resolver macros desde una foto de código de barras",
)
async def resolve_barcode_from_image(
    image: UploadFile = File(...),
) -> BarcodeResolveResponse:
    """Decode a barcode from an uploaded image and normalize its macros."""
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes subir una imagen válida.",
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen está vacía.",
        )

    with get_session() as session:
        try:
            result = await resolve_barcode_image(session, image_bytes)
        except BarcodeDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        except BarcodeLookupError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(exc),
            ) from exc

    return BarcodeResolveResponse(
        barcode=result.barcode,
        product=NutritionResolvedRead(
            product_id=result.product_id,
            name=result.name,
            barcode=result.barcode,
            source=result.source,
            source_ref=result.source_ref,
            kcal_100g=result.kcal_100g,
            prot_100g=result.prot_100g,
            hc_100g=result.hc_100g,
            fat_100g=result.fat_100g,
        ),
    )


@router.get(
    "/openfoodfacts/search",
    response_model=NutritionLookupResponse,
    summary="Buscar macros en OpenFoodFacts por nombre",
)
async def search_openfoodfacts_product(
    query: str = Query(..., min_length=2),
) -> NutritionLookupResponse:
    """Search the first usable product in OpenFoodFacts by name."""
    with get_session() as session:
        try:
            result = await search_product_by_name(session, query)
        except BarcodeLookupError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(exc),
            ) from exc

    return NutritionLookupResponse(
        product=NutritionResolvedRead(
            product_id=result.product_id,
            name=result.name,
            barcode=result.barcode,
            source=result.source,
            source_ref=result.source_ref,
            kcal_100g=result.kcal_100g,
            prot_100g=result.prot_100g,
            hc_100g=result.hc_100g,
            fat_100g=result.fat_100g,
        )
    )
