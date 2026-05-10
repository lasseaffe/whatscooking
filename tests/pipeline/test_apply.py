from unittest.mock import MagicMock, patch
from pipeline.lib.apply import upsert_recipes, ApplyResult

RECIPE = {
    "title": "Test Dish",
    "description": "A test.",
    "cuisine_type": "Italian",
    "dish_types": ["pasta"],
    "dietary_tags": [],
    "ingredients": [{"name": "flour", "amount": 1, "unit": "cup"}],
    "instructions": ["Mix."],
    "prep_time_minutes": 5,
    "cook_time_minutes": 10,
    "servings": 2,
    "calories": 300,
    "protein_g": 8,
    "carbs_g": 40,
    "fat_g": 3,
    "fiber_g": 1,
    "sugar_g": 0,
    "sodium_mg": 100,
    "source_name": "Bon Appétit",
    "source_url": "https://bonappetit.com/recipe/test",
    "source": "curated",
}

def test_upsert_returns_apply_result():
    mock_client = MagicMock()
    mock_client.table.return_value.upsert.return_value.execute.return_value.data = [RECIPE]
    with patch("pipeline.lib.apply.create_client", return_value=mock_client):
        result = upsert_recipes([RECIPE])
    assert isinstance(result, ApplyResult)
    assert result.inserted >= 0

def test_upsert_empty_list_returns_zero_inserted():
    mock_client = MagicMock()
    with patch("pipeline.lib.apply.create_client", return_value=mock_client):
        result = upsert_recipes([])
    assert result.inserted == 0
    assert result.errors == []
