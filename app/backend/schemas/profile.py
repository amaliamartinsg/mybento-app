"""Pydantic schemas for Profile request/response DTOs."""

from pydantic import BaseModel, Field, model_validator

from app.backend.models.profile import ActivityLevel, Goal


class ProfileUpdate(BaseModel):
    """Payload to update the user profile.

    All fields are optional so partial updates are supported.
    The macro percentages, when provided together, must sum to 100.
    """

    weight_kg: float | None = Field(default=None, gt=0, le=500)
    height_cm: float | None = Field(default=None, gt=0, le=300)
    age: int | None = Field(default=None, gt=0, le=120)
    gender: str | None = None
    activity_level: ActivityLevel | None = None
    goal: Goal | None = None
    prot_pct: float | None = Field(default=None, ge=0, le=100)
    hc_pct: float | None = Field(default=None, ge=0, le=100)
    fat_pct: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def check_macro_pcts_sum(self) -> "ProfileUpdate":
        """Validate that macro percentages sum to 100 when all three are provided."""
        pcts = (self.prot_pct, self.hc_pct, self.fat_pct)
        if all(p is not None for p in pcts):
            total = sum(pcts)  # type: ignore[arg-type]
            if abs(total - 100) > 0.01:
                raise ValueError(
                    f"Los porcentajes de macros deben sumar 100 (actual: {total:.1f})"
                )
        return self


class ProfileRead(BaseModel):
    """Full profile as returned by the API, including computed targets."""

    id: int
    weight_kg: float
    height_cm: float
    age: int
    gender: str
    activity_level: ActivityLevel
    goal: Goal
    kcal_target: float
    prot_pct: float
    hc_pct: float
    fat_pct: float
    prot_g_target: float
    hc_g_target: float
    fat_g_target: float

    model_config = {"from_attributes": True}


class TDEEPreview(BaseModel):
    """Response for the preview-TDEE endpoint (no DB write)."""

    bmr: float
    tdee: float
    kcal_target: float
    prot_g_target: float
    hc_g_target: float
    fat_g_target: float
