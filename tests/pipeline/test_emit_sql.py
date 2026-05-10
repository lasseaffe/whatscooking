import pytest
from pipeline.emit_sql import recipe_to_sql, escape_sql_string, format_jsonb_ingredients, format_sql_array


def test_escape_sql_string_handles_single_quotes():
    assert escape_sql_string("It's good") == "It''s good"


def test_escape_sql_string_plain():
    assert escape_sql_string("Hello") == "Hello"


def test_format_jsonb_ingredients():
    ingredients = [{"name": "pasta", "amount": 200, "unit": "g"}]
    result = format_jsonb_ingredients(ingredients)
    assert result == '[{"name": "pasta", "amount": 200, "unit": "g"}]'


def test_format_sql_array_strings():
    result = format_sql_array(["main course", "pasta"])
    assert result == "ARRAY['main course','pasta']"


def test_format_sql_array_empty():
    result = format_sql_array([])
    assert result == "ARRAY[]::text[]"


def test_recipe_to_sql_contains_insert(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert sql.startswith("insert into recipes (")


def test_recipe_to_sql_contains_title(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "Silky Carbonara" in sql


def test_recipe_to_sql_contains_curated_source(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "'curated'" in sql


def test_recipe_to_sql_contains_jsonb_cast(sample_composed_recipe):
    sql = recipe_to_sql(sample_composed_recipe)
    assert "::jsonb" in sql


def test_recipe_to_sql_escapes_quotes():
    recipe = {
        "title": "Chef's Special",
        "description": "It's great.",
        "cuisine_type": "American",
        "dish_types": ["main course"],
        "dietary_tags": [],
        "ingredients": [{"name": "chicken", "amount": 1, "unit": "whole"}],
        "instructions": ["Cook it."],
        "prep_time_minutes": 5,
        "cook_time_minutes": 30,
        "servings": 4,
        "calories": 400,
        "protein_g": 30,
        "carbs_g": 10,
        "fat_g": 15,
        "fiber_g": 1,
        "sugar_g": 0,
        "sodium_mg": 500,
        "source_name": "Test",
        "source_url": "https://example.com/test",
    }
    sql = recipe_to_sql(recipe)
    assert "Chef''s Special" in sql
    assert "It''s great." in sql
