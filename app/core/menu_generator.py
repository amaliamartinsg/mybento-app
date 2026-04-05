"""Menu generation logic: slot budgets, recipe filtering, and week autofill.

This module contains pure business logic with no FastAPI or database
dependencies — all objects are passed in by the caller.
"""

import random
from dataclasses import dataclass, field

from app.backend.models.menu import MenuWeek, SlotType
from app.backend.models.recipe import MealType, Recipe
from app.backend.services.macro_calculator import MacroTotals


# ---------------------------------------------------------------------------
# Slot → Category name mapping (lowercased for case-insensitive comparison)
# ---------------------------------------------------------------------------

SLOT_CATEGORY_MAP: dict[SlotType, str] = {
    SlotType.DESAYUNO: "desayuno",
    SlotType.MEDIA_MANANA: "snack",
    SlotType.COMIDA: "comida",
    SlotType.MERIENDA: "snack",
    SlotType.CENA: "cena",
}


# ---------------------------------------------------------------------------
# Return type
# ---------------------------------------------------------------------------


@dataclass
class SlotAssignment:
    """A recipe assignment (or clearance) for a specific menu slot.

    Attributes:
        slot_id: Primary key of the MenuSlot to update.
        recipe_id: Recipe to assign, or None to leave the slot empty.
        second_recipe_id: Second course for Comida primero+segundo pairs.
    """

    slot_id: int
    recipe_id: int | None
    second_recipe_id: int | None = None


# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------


def get_slot_macro_budget(
    day_macros: MacroTotals,
    slot_type: SlotType,
    target: MacroTotals,
) -> MacroTotals:
    """Return the remaining macro budget for the next slot to fill.

    Budget = target - already_consumed, floored at zero so it never goes
    negative.  The *slot_type* parameter is accepted for API stability and
    future per-slot weighting but is unused in the MVP simplification.

    Args:
        day_macros: Macros already consumed today (filled slots + extras).
        slot_type: The meal slot being filled (reserved for future weighting).
        target: Daily macro target from the user profile.

    Returns:
        A :class:`MacroTotals` with the remaining budget (≥ 0 in each field).
    """
    return MacroTotals(
        kcal=max(0.0, target.kcal - day_macros.kcal),
        prot_g=max(0.0, target.prot_g - day_macros.prot_g),
        hc_g=max(0.0, target.hc_g - day_macros.hc_g),
        fat_g=max(0.0, target.fat_g - day_macros.fat_g),
    )


def filter_compatible_recipes(
    recipes: list[Recipe],
    slot_type: SlotType,
    budget: MacroTotals,
    meal_type: MealType | None = None,
) -> list[Recipe]:
    """Return recipes that are compatible with *slot_type* and fit *budget*.

    Compatibility is determined by comparing the recipe's category name
    (accessed via ``recipe.subcategory.category.name``) against
    :data:`SLOT_CATEGORY_MAP`.  Recipes without a subcategory are excluded.

    Only recipes whose ``kcal`` is within the calorie budget are returned;
    the result is sorted by kcal ascending (best fit first).

    Args:
        recipes: Full recipe list with ``subcategory.category`` loaded.
        slot_type: The meal slot to fill.
        budget: Available macro budget for this slot.
        meal_type: If provided, only recipes with this meal_type are returned.

    Returns:
        Filtered and sorted list of compatible recipes.
    """
    target_category = SLOT_CATEGORY_MAP[slot_type]
    compatible: list[Recipe] = []

    for recipe in recipes:
        if recipe.subcategory is None:
            continue
        category_name = recipe.subcategory.category.name.lower()
        if category_name != target_category:
            continue
        if meal_type is not None and recipe.meal_type != meal_type:
            continue
        if recipe.kcal <= budget.kcal:
            compatible.append(recipe)

    return sorted(compatible, key=lambda r: r.kcal)


def _all_for_category(recipes: list[Recipe], slot_type: SlotType) -> list[Recipe]:
    """Return all recipes matching a slot's category, regardless of budget."""
    target_cat = SLOT_CATEGORY_MAP[slot_type]
    return [
        r
        for r in recipes
        if r.subcategory is not None
        and r.subcategory.category.name.lower() == target_cat
    ]


def autofill_week(
    week: MenuWeek,
    recipes: list[Recipe],
    target: MacroTotals,
) -> list[SlotAssignment]:
    """Fill all empty slots in *week* with appropriate recipes.

    For each day, iterates through empty slots in order.  For each empty slot:

    1. Compute macros already consumed (filled slots + extras).
    2. Compute remaining budget = target − consumed.
    3. Filter recipes compatible with the slot type and within budget.
    4. For COMIDA slots: try plato_unico first; if none fit, try primero+segundo pair.
    5. Pick randomly from compatible recipes.
    6. If nothing fits, fall back to the lowest-kcal recipe for that category.
    7. If no recipe exists for the category at all, skip the slot.

    Args:
        week: The :class:`MenuWeek` with days/slots/extras fully loaded.
        recipes: All available recipes with ``subcategory.category`` loaded.
        target: Daily macro target from the user profile.

    Returns:
        List of :class:`SlotAssignment` — one per empty slot that could be
        filled.  Slots with no matching recipe are omitted.
    """
    assignments: list[SlotAssignment] = []

    for day in week.days:
        # --- Initialise consumed macros with the extras already on this day ---
        consumed = MacroTotals(kcal=0.0, prot_g=0.0, hc_g=0.0, fat_g=0.0)

        for day_extra in day.day_extras:
            q = day_extra.quantity
            consumed.kcal += day_extra.extra.kcal * q
            consumed.prot_g += day_extra.extra.prot_g * q
            consumed.hc_g += day_extra.extra.hc_g * q
            consumed.fat_g += day_extra.extra.fat_g * q

        # Add already-filled slots so we don't double-budget
        for slot in day.slots:
            if slot.recipe_id is not None and slot.recipe is not None:
                consumed.kcal += slot.recipe.kcal
                consumed.prot_g += slot.recipe.prot_g
                consumed.hc_g += slot.recipe.hc_g
                consumed.fat_g += slot.recipe.fat_g
            if slot.second_recipe_id is not None and slot.second_recipe is not None:
                consumed.kcal += slot.second_recipe.kcal
                consumed.prot_g += slot.second_recipe.prot_g
                consumed.hc_g += slot.second_recipe.hc_g
                consumed.fat_g += slot.second_recipe.fat_g

        # --- Fill empty slots ---
        for slot in day.slots:
            if slot.recipe_id is not None:
                continue  # already filled — skip

            budget = get_slot_macro_budget(consumed, slot.slot_type, target)

            if slot.slot_type == SlotType.COMIDA:
                assignment = _fill_comida_slot(slot.id, recipes, budget)  # type: ignore[arg-type]
            else:
                assignment = _fill_generic_slot(slot.id, recipes, slot.slot_type, budget)  # type: ignore[arg-type]

            if assignment is None:
                continue

            # Account for chosen recipe(s) in running consumed totals
            if assignment.recipe_id is not None:
                chosen = next((r for r in recipes if r.id == assignment.recipe_id), None)
                if chosen:
                    consumed.kcal += chosen.kcal
                    consumed.prot_g += chosen.prot_g
                    consumed.hc_g += chosen.hc_g
                    consumed.fat_g += chosen.fat_g
            if assignment.second_recipe_id is not None:
                second = next((r for r in recipes if r.id == assignment.second_recipe_id), None)
                if second:
                    consumed.kcal += second.kcal
                    consumed.prot_g += second.prot_g
                    consumed.hc_g += second.hc_g
                    consumed.fat_g += second.fat_g

            assignments.append(assignment)

    return assignments


def _fill_comida_slot(
    slot_id: int,
    recipes: list[Recipe],
    budget: MacroTotals,
) -> SlotAssignment | None:
    """Choose recipe(s) for a COMIDA slot.

    Preference order:
    1. A plato_unico that fits the budget.
    2. A primero + segundo pair whose combined kcal fits the budget.
    3. Fallback: lowest-kcal plato_unico (ignoring budget).
    4. Fallback: lowest-kcal primero + lowest-kcal segundo (ignoring budget).
    5. If no comida recipes exist at all, return None.
    """
    all_comida = _all_for_category(recipes, SlotType.COMIDA)
    if not all_comida:
        return None

    # --- 1. Try plato_unico within budget ---
    unicos = filter_compatible_recipes(
        recipes, SlotType.COMIDA, budget, meal_type=MealType.PLATO_UNICO
    )
    if unicos:
        chosen = random.choice(unicos)
        return SlotAssignment(slot_id=slot_id, recipe_id=chosen.id)

    # --- 2. Try primero + segundo pair within budget ---
    primeros = [r for r in all_comida if r.meal_type == MealType.PRIMERO]
    segundos = [r for r in all_comida if r.meal_type == MealType.SEGUNDO]

    if primeros and segundos:
        # Find valid pairs whose combined kcal fits
        valid_pairs: list[tuple[Recipe, Recipe]] = [
            (p, s)
            for p in primeros
            for s in segundos
            if p.kcal + s.kcal <= budget.kcal
        ]
        if valid_pairs:
            chosen_p, chosen_s = random.choice(valid_pairs)
            return SlotAssignment(
                slot_id=slot_id,
                recipe_id=chosen_p.id,
                second_recipe_id=chosen_s.id,
            )

    # --- 3. Fallback: lowest-kcal plato_unico (ignore budget) ---
    unicos_all = [r for r in all_comida if r.meal_type == MealType.PLATO_UNICO]
    if unicos_all:
        chosen = min(unicos_all, key=lambda r: r.kcal)
        return SlotAssignment(slot_id=slot_id, recipe_id=chosen.id)

    # --- 4. Fallback: lowest-kcal primero + segundo (ignore budget) ---
    if primeros and segundos:
        chosen_p = min(primeros, key=lambda r: r.kcal)
        chosen_s = min(segundos, key=lambda r: r.kcal)
        return SlotAssignment(
            slot_id=slot_id,
            recipe_id=chosen_p.id,
            second_recipe_id=chosen_s.id,
        )

    # --- 5. Any comida recipe as last resort ---
    chosen = min(all_comida, key=lambda r: r.kcal)
    return SlotAssignment(slot_id=slot_id, recipe_id=chosen.id)


def _fill_generic_slot(
    slot_id: int,
    recipes: list[Recipe],
    slot_type: SlotType,
    budget: MacroTotals,
) -> SlotAssignment | None:
    """Choose a single recipe for a non-COMIDA slot."""
    compatible = filter_compatible_recipes(recipes, slot_type, budget)
    if compatible:
        chosen = random.choice(compatible)
    else:
        fallback = _all_for_category(recipes, slot_type)
        if not fallback:
            return None
        chosen = min(fallback, key=lambda r: r.kcal)

    return SlotAssignment(slot_id=slot_id, recipe_id=chosen.id)
