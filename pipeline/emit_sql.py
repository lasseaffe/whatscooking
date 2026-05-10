import json
from datetime import date
from pathlib import Path
from typing import Any


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


def format_jsonb_ingredients(ingredients: list[dict]) -> str:
    return json.dumps(ingredients, ensure_ascii=False)


def format_sql_array(items: list[str]) -> str:
    if not items:
        return "ARRAY[]::text[]"
    escaped = [f"'{escape_sql_string(i)}'" for i in items]
    return f"ARRAY[{','.join(escaped)}]"


def recipe_to_sql(recipe: dict[str, Any]) -> str:
    def s(val: Any) -> str:
        if val is None:
            return "NULL"
        return f"'{escape_sql_string(str(val))}'"

    def n(val: Any) -> str:
        if val is None:
            return "NULL"
        return str(val)

    ingredients_json = escape_sql_string(format_jsonb_ingredients(recipe["ingredients"]))
    instructions_sql = format_sql_array(recipe["instructions"])
    dish_types_sql = format_sql_array(recipe.get("dish_types", []))
    dietary_tags_sql = format_sql_array(recipe.get("dietary_tags", []))

    return (
        f"insert into recipes (\n"
        f"  source, source_name, source_url,\n"
        f"  title, description, image_url,\n"
        f"  cuisine_type, dish_types, dietary_tags,\n"
        f"  ingredients, instructions,\n"
        f"  prep_time_minutes, cook_time_minutes, servings,\n"
        f"  calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg\n"
        f") values (\n"
        f"  'curated', {s(recipe.get('source_name'))}, {s(recipe.get('source_url'))},\n"
        f"  {s(recipe['title'])},\n"
        f"  {s(recipe.get('description', ''))},\n"
        f"  {s(recipe.get('image_url'))},\n"
        f"  {s(recipe.get('cuisine_type'))},\n"
        f"  {dish_types_sql}, {dietary_tags_sql},\n"
        f"  '{ingredients_json}'::jsonb,\n"
        f"  {instructions_sql},\n"
        f"  {n(recipe.get('prep_time_minutes'))}, {n(recipe.get('cook_time_minutes'))}, {n(recipe.get('servings'))},\n"
        f"  {n(recipe.get('calories'))}, {n(recipe.get('protein_g'))}, {n(recipe.get('carbs_g'))},\n"
        f"  {n(recipe.get('fat_g'))}, {n(recipe.get('fiber_g'))}, {n(recipe.get('sugar_g'))}, {n(recipe.get('sodium_mg'))}\n"
        f");"
    )


def write_sql_file(recipes: list[dict], output_dir: str = "pipeline/output") -> str:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    filename = f"{date.today().isoformat()}.sql"
    filepath = Path(output_dir) / filename

    header = (
        "-- What's Cooking — Weekly Curated Recipes\n"
        f"-- Generated: {date.today().isoformat()}\n"
        "-- Review before applying to Supabase\n\n"
    )

    statements = "\n\n".join(recipe_to_sql(r) for r in recipes)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header + statements + "\n")

    return str(filepath)
