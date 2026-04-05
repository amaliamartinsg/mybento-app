"""Pydantic schemas for UnitWeight endpoints."""

from pydantic import BaseModel, Field


class UnitWeightCreate(BaseModel):
    ingredient_name: str
    grams_per_unit: float = Field(gt=0)


class UnitWeightRead(BaseModel):
    id: int
    ingredient_name: str
    grams_per_unit: float

    model_config = {"from_attributes": True}


class UnitWeightUpdate(BaseModel):
    ingredient_name: str | None = None
    grams_per_unit: float | None = Field(default=None, gt=0)
