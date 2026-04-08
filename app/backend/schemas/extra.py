"""Pydantic schemas for Extra and MenuDayExtra request/response DTOs."""

from typing import Literal

from pydantic import BaseModel, Field

LookupSource = Literal["manual", "barcode", "name"]


class ExtraCreate(BaseModel):
    """Payload to create a reusable extra item."""

    name: str
    serving_g: float = Field(default=100, gt=0)
    kcal: float = Field(gt=0)
    prot_g: float = Field(default=0, ge=0)
    hc_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)
    lookup_source: LookupSource = "manual"


class ExtraUpdate(BaseModel):
    """Payload to partially update an extra item."""

    name: str | None = None
    serving_g: float | None = Field(default=None, gt=0)
    kcal: float | None = Field(default=None, gt=0)
    prot_g: float | None = Field(default=None, ge=0)
    hc_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)
    lookup_source: LookupSource | None = None


class ExtraRead(BaseModel):
    """Extra item as returned by the API."""

    id: int
    name: str
    serving_g: float
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float
    lookup_source: LookupSource

    model_config = {"from_attributes": True}


class MenuDayExtraCreate(BaseModel):
    """Payload to attach an extra to a menu day."""

    extra_id: int
    grams: float = Field(default=100.0, gt=0)


class MenuDayExtraUpdate(BaseModel):
    """Payload to update the consumed grams of an attached extra."""

    grams: float = Field(gt=0)


class MenuDayExtraRead(BaseModel):
    """Association between a day and an extra, as returned by the API."""

    id: int
    extra_id: int
    quantity: float
    grams: float
    extra: ExtraRead

    model_config = {"from_attributes": True}
