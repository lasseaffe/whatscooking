import pytest

@pytest.fixture
def sample_raw_recipe():
    return {
        "title": "Test Pasta",
        "ingredients": ["200g spaghetti", "2 eggs", "100g pancetta", "50g Pecorino"],
        "instructions": ["Boil pasta.", "Fry pancetta.", "Mix eggs and cheese.", "Combine off heat."],
        "image_url": "https://images.unsplash.com/photo-test?w=800&q=80",
        "cook_time_minutes": 20,
        "prep_time_minutes": 10,
        "servings": 2,
        "cuisine_type": "Italian",
        "dietary_tags": [],
        "source_url": "https://www.seriouseats.com/test-pasta",
        "source_name": "Serious Eats",
    }

@pytest.fixture
def sample_composed_recipe():
    return {
        "title": "Silky Carbonara",
        "description": "A Roman classic done right — guanciale rendered until crisp.",
        "cuisine_type": "Italian",
        "dish_types": ["main course", "pasta"],
        "dietary_tags": [],
        "ingredients": [
            {"name": "spaghetti", "amount": 400, "unit": "g"},
            {"name": "guanciale", "amount": 150, "unit": "g"},
            {"name": "eggs", "amount": 4, "unit": "whole"},
            {"name": "Pecorino Romano", "amount": 80, "unit": "g"},
        ],
        "instructions": ["Cook pasta.", "Render guanciale.", "Mix eggs and cheese.", "Combine off heat."],
        "prep_time_minutes": 10,
        "cook_time_minutes": 20,
        "servings": 4,
        "calories": 620,
        "protein_g": 28,
        "carbs_g": 72,
        "fat_g": 22,
        "fiber_g": 3,
        "sugar_g": 2,
        "sodium_mg": 780,
        "source_name": "Serious Eats, AllRecipes",
        "source_url": "https://www.seriouseats.com/best-pasta-carbonara-recipe",
    }
