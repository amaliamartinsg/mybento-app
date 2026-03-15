"""Pydantic schemas for Extra and MenuDayExtra request/response DTOs."""

from pydantic import BaseModel, Field


class ExtraCreate(BaseModel):
    """Payload to create a reusable extra item."""

    name: str
    kcal: float = Field(gt=0)
    prot_g: float = Field(default=0, ge=0)
    hc_g: float = Field(default=0, ge=0)
    fat_g: float = Field(default=0, ge=0)


class ExtraUpdate(BaseModel):
    """Payload to partially update an extra item."""

    name: str | None = None
    kcal: float | None = Field(default=None, gt=0)
    prot_g: float | None = Field(default=None, ge=0)
    hc_g: float | None = Field(default=None, ge=0)
    fat_g: float | None = Field(default=None, ge=0)


class ExtraRead(BaseModel):
    """Extra item as returned by the API."""

    id: int
    name: str
    kcal: float
    prot_g: float
    hc_g: float
    fat_g: float

    model_config = {"from_attributes": True}


class MenuDayExtraCreate(BaseModel):
    """Payload to attach an extra to a menu day."""

    extra_id: int
    quantity: float = Field(default=1.0, gt=0)


class MenuDayExtraRead(BaseModel):
    """Association between a day and an extra, as returned by the API."""

    id: int
    extra_id: int
    quantity: float
    extra: ExtraRead

    model_config = {"from_attributes": True}
