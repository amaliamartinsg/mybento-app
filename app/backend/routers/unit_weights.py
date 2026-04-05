"""Router for UnitWeight CRUD endpoints."""

from fastapi import APIRouter, HTTPException, status
from sqlmodel import func, select

from app.backend.database import get_session
from app.backend.models.unit_weight import UnitWeight
from app.backend.schemas.unit_weight import UnitWeightCreate, UnitWeightRead, UnitWeightUpdate

router = APIRouter(prefix="/unit-weights", tags=["unit-weights"])


@router.get("", response_model=list[UnitWeightRead], summary="Listar pesos por unidad")
def list_unit_weights() -> list[UnitWeight]:
    """Return all unit weights."""
    with get_session() as session:
        return list(session.exec(select(UnitWeight)).all())


# Must be declared BEFORE /{unit_weight_id} to avoid path conflicts
@router.get("/lookup", response_model=UnitWeightRead, summary="Buscar peso por nombre de ingrediente")
def lookup_unit_weight(name: str) -> UnitWeight:
    """Find a unit weight by ingredient name (case-insensitive). Returns 404 if not found."""
    with get_session() as session:
        result = session.exec(
            select(UnitWeight).where(func.lower(UnitWeight.ingredient_name) == func.lower(name))
        ).first()
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el peso para ese ingrediente",
            )
        return result


@router.post("", response_model=UnitWeightRead, status_code=status.HTTP_201_CREATED, summary="Crear peso por unidad")
def create_unit_weight(payload: UnitWeightCreate) -> UnitWeight:
    """Create a new unit weight entry."""
    with get_session() as session:
        unit_weight = UnitWeight(
            ingredient_name=payload.ingredient_name,
            grams_per_unit=payload.grams_per_unit,
        )
        session.add(unit_weight)
        session.commit()
        session.refresh(unit_weight)
        return unit_weight


@router.put("/{unit_weight_id}", response_model=UnitWeightRead, summary="Actualizar peso por unidad")
def update_unit_weight(unit_weight_id: int, payload: UnitWeightUpdate) -> UnitWeight:
    """Update an existing unit weight by id."""
    with get_session() as session:
        unit_weight = session.get(UnitWeight, unit_weight_id)
        if unit_weight is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peso no encontrado")
        if payload.ingredient_name is not None:
            unit_weight.ingredient_name = payload.ingredient_name
        if payload.grams_per_unit is not None:
            unit_weight.grams_per_unit = payload.grams_per_unit
        session.add(unit_weight)
        session.commit()
        session.refresh(unit_weight)
        return unit_weight


@router.delete("/{unit_weight_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar peso por unidad")
def delete_unit_weight(unit_weight_id: int) -> None:
    """Delete a unit weight by id."""
    with get_session() as session:
        unit_weight = session.get(UnitWeight, unit_weight_id)
        if unit_weight is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peso no encontrado")
        session.delete(unit_weight)
        session.commit()
