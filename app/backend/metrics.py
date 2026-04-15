"""Prometheus metrics for backend operational and business observability."""

from __future__ import annotations

from time import perf_counter

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from sqlalchemy import func
from sqlmodel import select

from app.backend.database import get_session
from app.backend.models.extra import Extra, MenuDayExtra
from app.backend.models.menu import MenuSlot, MenuWeek, SlotType
from app.backend.models.nutrition import NutritionProduct
from app.backend.models.profile import Profile
from app.backend.models.recipe import MealType, Recipe
from app.backend.models.unit_weight import UnitWeight

REQUEST_COUNT = Counter(
    "mybento_http_requests_total",
    "Total HTTP requests handled by the backend.",
    ("method", "path", "status_code"),
)

REQUEST_DURATION_SECONDS = Histogram(
    "mybento_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    ("method", "path"),
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)

RECIPES_TOTAL = Gauge(
    "mybento_recipes_total",
    "Total number of recipes stored.",
)

RECIPES_BY_MEAL_TYPE = Gauge(
    "mybento_recipes_by_meal_type",
    "Recipes grouped by meal type.",
    ("meal_type",),
)

MENU_WEEKS_TOTAL = Gauge(
    "mybento_menu_weeks_total",
    "Total number of menu weeks stored.",
)

MENU_SLOTS_FILLED_TOTAL = Gauge(
    "mybento_menu_slots_filled_total",
    "Total number of menu slots with at least one assigned recipe.",
)

MENU_SLOTS_TOTAL = Gauge(
    "mybento_menu_slots_total",
    "Total number of menu slots stored.",
)

MENU_SLOTS_OPEN_TOTAL = Gauge(
    "mybento_menu_slots_open_total",
    "Total number of empty menu slots.",
)

MENU_FILL_RATIO = Gauge(
    "mybento_menu_fill_ratio",
    "Ratio of filled menu slots over total menu slots.",
)

MENU_SLOTS_BY_TYPE = Gauge(
    "mybento_menu_slots_by_type",
    "Menu slots grouped by slot type and fill status.",
    ("slot_type", "state"),
)

EXTRAS_TOTAL = Gauge(
    "mybento_extras_total",
    "Total number of extras stored.",
)

DAY_EXTRAS_TOTAL = Gauge(
    "mybento_day_extras_total",
    "Total number of extra consumptions attached to menu days.",
)

NUTRITION_PRODUCTS_TOTAL = Gauge(
    "mybento_nutrition_products_total",
    "Total number of cached nutrition products.",
)

UNIT_WEIGHTS_TOTAL = Gauge(
    "mybento_unit_weights_total",
    "Total number of configured unit-weight mappings.",
)

PROFILE_KCAL_TARGET = Gauge(
    "mybento_profile_kcal_target",
    "Current stored kcal target for the main profile.",
)

PROFILE_MACRO_TARGET_GRAMS = Gauge(
    "mybento_profile_macro_target_grams",
    "Current stored macro gram targets for the main profile.",
    ("macro",),
)

PROFILE_MACRO_TARGET_PERCENT = Gauge(
    "mybento_profile_macro_target_percent",
    "Current stored macro percentage targets for the main profile.",
    ("macro",),
)

PROFILE_BODY_METRICS = Gauge(
    "mybento_profile_body_metrics",
    "Current stored body metrics for the main profile.",
    ("metric",),
)

RECIPES_AVG_PER_SERVING = Gauge(
    "mybento_recipes_avg_per_serving",
    "Average per-serving macros across all recipes.",
    ("macro",),
)


def observe_http_request(method: str, path: str, status_code: int, started_at: float) -> None:
    """Record latency and count for a completed HTTP request."""
    REQUEST_COUNT.labels(method=method, path=path, status_code=str(status_code)).inc()
    REQUEST_DURATION_SECONDS.labels(method=method, path=path).observe(
        perf_counter() - started_at
    )


def _sync_business_metrics() -> None:
    """Refresh gauges from the current SQLite state just before scraping."""
    with get_session() as session:
        recipes_total = session.exec(select(func.count()).select_from(Recipe)).one()
        menu_weeks_total = session.exec(select(func.count()).select_from(MenuWeek)).one()
        extras_total = session.exec(select(func.count()).select_from(Extra)).one()
        day_extras_total = session.exec(select(func.count()).select_from(MenuDayExtra)).one()
        nutrition_products_total = session.exec(
            select(func.count()).select_from(NutritionProduct)
        ).one()
        unit_weights_total = session.exec(select(func.count()).select_from(UnitWeight)).one()
        menu_slots_total = session.exec(select(func.count()).select_from(MenuSlot)).one()
        menu_slots_filled = session.exec(
            select(func.count()).select_from(MenuSlot).where(
                (MenuSlot.recipe_id.is_not(None)) | (MenuSlot.second_recipe_id.is_not(None))
            )
        ).one()
        profile = session.get(Profile, 1)

        RECIPES_TOTAL.set(float(recipes_total))
        MENU_WEEKS_TOTAL.set(float(menu_weeks_total))
        EXTRAS_TOTAL.set(float(extras_total))
        DAY_EXTRAS_TOTAL.set(float(day_extras_total))
        NUTRITION_PRODUCTS_TOTAL.set(float(nutrition_products_total))
        UNIT_WEIGHTS_TOTAL.set(float(unit_weights_total))
        MENU_SLOTS_TOTAL.set(float(menu_slots_total))
        MENU_SLOTS_FILLED_TOTAL.set(float(menu_slots_filled))
        MENU_SLOTS_OPEN_TOTAL.set(float(menu_slots_total - menu_slots_filled))
        MENU_FILL_RATIO.set(
            float(menu_slots_filled) / float(menu_slots_total) if menu_slots_total else 0.0
        )
        PROFILE_KCAL_TARGET.set(float(profile.kcal_target) if profile is not None else 0.0)
        if profile is not None:
            PROFILE_MACRO_TARGET_GRAMS.labels(macro="protein").set(float(profile.prot_g_target))
            PROFILE_MACRO_TARGET_GRAMS.labels(macro="carbs").set(float(profile.hc_g_target))
            PROFILE_MACRO_TARGET_GRAMS.labels(macro="fat").set(float(profile.fat_g_target))
            PROFILE_MACRO_TARGET_PERCENT.labels(macro="protein").set(float(profile.prot_pct))
            PROFILE_MACRO_TARGET_PERCENT.labels(macro="carbs").set(float(profile.hc_pct))
            PROFILE_MACRO_TARGET_PERCENT.labels(macro="fat").set(float(profile.fat_pct))
            PROFILE_BODY_METRICS.labels(metric="weight_kg").set(float(profile.weight_kg))
            PROFILE_BODY_METRICS.labels(metric="height_cm").set(float(profile.height_cm))
            PROFILE_BODY_METRICS.labels(metric="age").set(float(profile.age))
        else:
            for macro in ("protein", "carbs", "fat"):
                PROFILE_MACRO_TARGET_GRAMS.labels(macro=macro).set(0.0)
                PROFILE_MACRO_TARGET_PERCENT.labels(macro=macro).set(0.0)
            for metric in ("weight_kg", "height_cm", "age"):
                PROFILE_BODY_METRICS.labels(metric=metric).set(0.0)

        counts_by_type = {
            row[0]: row[1]
            for row in session.exec(
                select(Recipe.meal_type, func.count())
                .group_by(Recipe.meal_type)
                .order_by(Recipe.meal_type)
            ).all()
        }
        for meal_type in MealType:
            RECIPES_BY_MEAL_TYPE.labels(meal_type=meal_type.value).set(
                float(counts_by_type.get(meal_type, 0))
            )

        slot_counts: dict[tuple[SlotType, str], int] = {}
        for slot in session.exec(select(MenuSlot)).all():
            state = (
                "filled"
                if slot.recipe_id is not None or slot.second_recipe_id is not None
                else "open"
            )
            key = (slot.slot_type, state)
            slot_counts[key] = slot_counts.get(key, 0) + 1
        for slot_type in SlotType:
            MENU_SLOTS_BY_TYPE.labels(slot_type=slot_type.value, state="filled").set(
                float(slot_counts.get((slot_type, "filled"), 0))
            )
            MENU_SLOTS_BY_TYPE.labels(slot_type=slot_type.value, state="open").set(
                float(slot_counts.get((slot_type, "open"), 0))
            )

        recipe_rows = session.exec(select(Recipe)).all()
        if recipe_rows:
            servings_total = len(recipe_rows)
            RECIPES_AVG_PER_SERVING.labels(macro="kcal").set(
                sum(recipe.kcal / max(1, recipe.servings or 1) for recipe in recipe_rows)
                / servings_total
            )
            RECIPES_AVG_PER_SERVING.labels(macro="protein").set(
                sum(recipe.prot_g / max(1, recipe.servings or 1) for recipe in recipe_rows)
                / servings_total
            )
            RECIPES_AVG_PER_SERVING.labels(macro="carbs").set(
                sum(recipe.hc_g / max(1, recipe.servings or 1) for recipe in recipe_rows)
                / servings_total
            )
            RECIPES_AVG_PER_SERVING.labels(macro="fat").set(
                sum(recipe.fat_g / max(1, recipe.servings or 1) for recipe in recipe_rows)
                / servings_total
            )
        else:
            for macro in ("kcal", "protein", "carbs", "fat"):
                RECIPES_AVG_PER_SERVING.labels(macro=macro).set(0.0)


def metrics_response() -> tuple[bytes, str]:
    """Return the latest Prometheus exposition payload and content type."""
    _sync_business_metrics()
    return generate_latest(), CONTENT_TYPE_LATEST
