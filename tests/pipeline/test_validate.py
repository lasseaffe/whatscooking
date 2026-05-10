import pytest
from pipeline.lib.validate import validate_recipe

VALID = {
    "title": "Test Dish",
    "description": "A test dish.",
    "cuisine_type": "Italian",
    "dish_types": ["pasta"],
    "dietary_tags": [],
    "ingredients": [{"name": "flour", "amount": 1, "unit": "cup"}],
    "instructions": ["Mix flour with water."],
    "prep_time_minutes": 10,
    "cook_time_minutes": 20,
    "servings": 4,
    "calories": 400,
    "protein_g": 10,
    "carbs_g": 50,
    "fat_g": 5,
    "fiber_g": 2,
    "sugar_g": 1,
    "sodium_mg": 200,
    "source_name": "Bon Appétit",
    "source_url": "https://bonappetit.com/recipe/test",
}

def test_valid_recipe_returns_no_errors():
    assert validate_recipe(VALID) == []

def test_missing_title_returns_error():
    r = {**VALID}
    del r["title"]
    errors = validate_recipe(r)
    assert any("title" in e for e in errors)

def test_empty_ingredients_returns_error():
    r = {**VALID, "ingredients": []}
    errors = validate_recipe(r)
    assert any("ingredients" in e for e in errors)

def test_zero_calories_returns_error():
    r = {**VALID, "calories": 0}
    errors = validate_recipe(r)
    assert any("calories" in e for e in errors)

def test_ingredient_missing_name_returns_error():
    r = {**VALID, "ingredients": [{"amount": 1, "unit": "cup"}]}
    errors = validate_recipe(r)
    assert any("name" in e for e in errors)

def test_negative_calories_returns_error():
    r = {**VALID, "calories": -100}
    errors = validate_recipe(r)
    assert any("calories" in e for e in errors)

def test_empty_instructions_returns_error():
    r = {**VALID, "instructions": []}
    errors = validate_recipe(r)
    assert any("instructions" in e for e in errors)

def test_zero_servings_returns_error():
    r = {**VALID, "servings": 0}
    errors = validate_recipe(r)
    assert any("servings" in e for e in errors)
