"""Pydantic schemas for Category and SubCategory request/response DTOs."""

from pydantic import BaseModel


class SubCategoryCreate(BaseModel):
    """Payload to create a new SubCategory."""

    name: str


class SubCategoryRead(BaseModel):
    """SubCategory as returned by the API."""

    id: int
    name: str
    category_id: int

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    """Payload to create a new Category."""

    name: str
    color: str | None = None


class CategoryRead(BaseModel):
    """Category with its nested subcategories as returned by the API."""

    id: int
    name: str
    color: str | None
    subcategories: list[SubCategoryRead] = []

    model_config = {"from_attributes": True}


class CategoryUpdate(BaseModel):
    """Payload to partially update a Category."""

    name: str | None = None
    color: str | None = None


class SubCategoryUpdate(BaseModel):
    """Payload to partially update a SubCategory."""

    name: str | None = None
