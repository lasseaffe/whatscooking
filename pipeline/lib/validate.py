from typing import Any

REQUIRED_FIELDS = [
    "title", "description", "ingredients", "instructions",
    "calories", "servings", "prep_time_minutes", "cook_time_minutes",
    "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
]


def validate_recipe(recipe: dict[str, Any]) -> list[str]:
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in recipe:
            errors.append(f"Missing required field: {field}")

    if recipe.get("title") is not None and not str(recipe["title"]).strip():
        errors.append("title must not be empty")

    if recipe.get("description") is not None and not str(recipe.get("description", "")).strip():
        errors.append("description must not be empty")

    if recipe.get("calories") is not None and recipe["calories"] <= 0:
        errors.append("calories must be > 0")

    if recipe.get("servings") is not None and recipe["servings"] <= 0:
        errors.append("servings must be > 0")

    ingredients = recipe.get("ingredients", [])
    if not ingredients:
        errors.append("ingredients must not be empty")
    else:
        for i, ing in enumerate(ingredients):
            if not isinstance(ing, dict):
                errors.append(f"ingredient[{i}] must be a dict")
                continue
            if "name" not in ing or not ing["name"]:
                errors.append(f"ingredient[{i}] missing name")
            if "amount" not in ing:
                errors.append(f"ingredient[{i}] missing amount")
            if "unit" not in ing:
                errors.append(f"ingredient[{i}] missing unit")

    if not recipe.get("instructions"):
        errors.append("instructions must not be empty")

    return errors
