"""Schemas for barcode-based nutrition resolution."""

from pydantic import BaseModel, Field


class NutritionResolvedRead(BaseModel):
    """Normalized nutrition payload shared across resolvers."""

    product_id: int
    name: str
    barcode: str
    source: str
    source_ref: str | None = None
    kcal_100g: float
    prot_100g: float
    hc_100g: float
    fat_100g: float


class BarcodeResolveResponse(BaseModel):
    """Response returned after resolving a barcode image."""

    barcode: str
    product: NutritionResolvedRead


class NutritionLookupResponse(BaseModel):
    """Response returned after resolving nutrition by product name."""

    product: NutritionResolvedRead


class ResolvedNutritionInput(BaseModel):
    """Reference to a trusted nutrition product resolved by the backend."""

    product_id: int = Field(gt=0)
