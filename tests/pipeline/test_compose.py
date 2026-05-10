import pytest
from pipeline.compose import build_prompt, validate_recipe, REQUIRED_FIELDS


def test_validate_recipe_passes_valid(sample_composed_recipe):
    errors = validate_recipe(sample_composed_recipe)
    assert errors == []


def test_validate_recipe_missing_title():
    recipe = {"description": "Good", "ingredients": [{"name": "x", "amount": 1, "unit": "g"}],
               "instructions": ["Cook."], "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("title" in e for e in errors)


def test_validate_recipe_zero_calories():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [{"name": "x", "amount": 1, "unit": "g"}],
               "instructions": ["Cook."], "calories": 0, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("calories" in e for e in errors)


def test_validate_recipe_empty_ingredients():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [], "instructions": ["Cook."],
               "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("ingredients" in e for e in errors)


def test_validate_recipe_missing_ingredient_fields():
    recipe = {"title": "Test", "description": "Good",
               "ingredients": [{"name": "pasta"}],  # missing amount + unit
               "instructions": ["Cook."], "calories": 400, "servings": 2,
               "prep_time_minutes": 5, "cook_time_minutes": 10,
               "protein_g": 10, "carbs_g": 20, "fat_g": 5,
               "fiber_g": 1, "sugar_g": 2, "sodium_mg": 300}
    errors = validate_recipe(recipe)
    assert any("amount" in e or "unit" in e for e in errors)


def test_build_prompt_contains_source_titles(sample_raw_recipe):
    raw_recipes = [sample_raw_recipe, {**sample_raw_recipe, "title": "Other Pasta"}]
    prompt = build_prompt(raw_recipes, category="pasta")
    assert "Test Pasta" in prompt
    assert "Other Pasta" in prompt
    assert "pasta" in prompt.lower()


def test_build_prompt_requests_json_output(sample_raw_recipe):
    prompt = build_prompt([sample_raw_recipe], category="pasta")
    assert "JSON" in prompt
