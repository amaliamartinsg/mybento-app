"""SQLModel models for normalized nutrition products resolved from barcodes."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class NutritionProduct(SQLModel, table=True):
    """Normalized barcode product cache used by recipe ingredients."""

    id: int | None = Field(default=None, primary_key=True)
    barcode: str = Field(index=True, unique=True)
    name: str
    brand: str | None = None
    source: str = Field(default="openfoodfacts")
    source_ref: str | None = None
    kcal_100g: float = Field(default=0)
    prot_100g: float = Field(default=0)
    hc_100g: float = Field(default=0)
    fat_100g: float = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
