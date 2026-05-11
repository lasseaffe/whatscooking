import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import scripts.import_datasets as imp


class TestParsePythonList:
    def test_parses_valid_list(self):
        assert imp.parse_python_list("['a', 'b', 'c']") == ["a", "b", "c"]

    def test_returns_empty_on_garbage(self):
        assert imp.parse_python_list("not a list") == []

    def test_returns_empty_on_empty_string(self):
        assert imp.parse_python_list("") == []

    def test_strips_whitespace_from_items(self):
        assert imp.parse_python_list("['  flour  ', 'sugar']") == ["flour", "sugar"]


class TestParseNumberList:
    def test_parses_float_list(self):
        result = imp.parse_number_list("[215.7, 7.0, 4.0, 0.0, 15.0, 3.0, 22.0]")
        assert len(result) == 7
        assert abs(result[0] - 215.7) < 0.01

    def test_empty_string(self):
        assert imp.parse_number_list("") == []


class TestParseTags:
    def test_extracts_cuisine(self):
        result = imp.parse_tags("['italian', 'pasta', 'dinner']")
        assert result["cuisine_type"] == "Italian"

    def test_extracts_diet_tags(self):
        result = imp.parse_tags("['vegetarian', 'gluten-free', 'quick']")
        assert "vegetarian" in result["dietary_tags"]
        assert "gluten-free" in result["dietary_tags"]

    def test_extracts_dish_types(self):
        result = imp.parse_tags("['breakfast', 'quick', 'easy']")
        assert "breakfast" in result["dish_types"]

    def test_no_match_returns_none_cuisine(self):
        result = imp.parse_tags("['easy', 'quick', 'weeknight']")
        assert result["cuisine_type"] is None
        assert result["dietary_tags"] == []

    def test_north_american_maps_to_american(self):
        result = imp.parse_tags("['north-american', 'dinner']")
        assert result["cuisine_type"] == "American"


class TestParseNutrition:
    def test_extracts_calories(self):
        result = imp.parse_nutrition("[215.7, 7.0, 4.0, 0.0, 15.0, 3.0, 22.0]")
        assert result["calories"] == 216

    def test_rounds_calories(self):
        result = imp.parse_nutrition("[100.4, 0, 0, 0, 0, 0, 0]")
        assert result["calories"] == 100

    def test_bad_input_returns_none(self):
        result = imp.parse_nutrition("garbage")
        assert result["calories"] is None


class TestIsQualityFoodcom:
    def _row(self, **overrides):
        base = {
            "n_ingredients": "8",
            "n_steps": "5",
            "minutes": "30",
            "description": "A great recipe for everyone",
        }
        return {**base, **overrides}

    def test_passes_quality_row(self):
        assert imp.is_quality_foodcom(self._row()) is True

    def test_fails_too_few_ingredients(self):
        assert imp.is_quality_foodcom(self._row(n_ingredients="3")) is False

    def test_fails_too_few_steps(self):
        assert imp.is_quality_foodcom(self._row(n_steps="2")) is False

    def test_fails_no_description(self):
        assert imp.is_quality_foodcom(self._row(description="")) is False

    def test_fails_too_long(self):
        assert imp.is_quality_foodcom(self._row(minutes="300")) is False

    def test_fails_too_short(self):
        assert imp.is_quality_foodcom(self._row(minutes="2")) is False


class TestMapFoodcomRow:
    def _good_row(self):
        return {
            "name": "chocolate chip cookies",
            "id": "12345",
            "minutes": "45",
            "submitted": "2020-03-15",
            "tags": "['north-american', 'desserts', 'vegetarian']",
            "nutrition": "[250.0, 10.0, 5.0, 2.0, 4.0, 3.0, 8.0]",
            "n_steps": "6",
            "steps": "['preheat oven', 'mix butter and sugar', 'add eggs', 'add flour', 'bake 12 min', 'cool on rack']",
            "description": "Classic chewy cookies everyone loves",
            "ingredients": "['butter', 'sugar', 'eggs', 'flour', 'chocolate chips', 'vanilla', 'baking soda']",
            "n_ingredients": "7",
        }

    def test_maps_title_to_title_case(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result is not None
        assert result["title"] == "Chocolate Chip Cookies"

    def test_sets_source_fields(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["source"] == "dataset"
        assert result["source_name"] == "Food.com"
        assert result["source_url"] == "https://www.food.com/recipe/12345"

    def test_maps_ingredients_as_name_dicts(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["ingredients"][0] == {"name": "butter"}
        assert len(result["ingredients"]) == 7

    def test_maps_calories_from_nutrition_first_element(self):
        result = imp.map_foodcom_row(self._good_row())
        assert result["calories"] == 250

    def test_returns_none_for_low_quality(self):
        row = self._good_row()
        row["n_ingredients"] = "2"
        assert imp.map_foodcom_row(row) is None


class TestIsQualityRecipeNLG:
    def test_passes_good_row(self):
        row = {
            "title": "No-Bake Nut Cookies",
            "ingredients": '["brown sugar", "milk", "vanilla", "nuts", "butter"]',
            "directions": '["Mix ingredients.", "Drop on wax paper.", "Let set 30 minutes."]',
        }
        assert imp.is_quality_recipenlg(row) is True

    def test_fails_short_title(self):
        row = {
            "title": "Cake",
            "ingredients": '["a", "b", "c", "d", "e"]',
            "directions": '["step1", "step2"]',
        }
        assert imp.is_quality_recipenlg(row) is False

    def test_fails_too_few_ingredients(self):
        row = {
            "title": "Simple Recipe Thing",
            "ingredients": '["a", "b"]',
            "directions": '["step1", "step2"]',
        }
        assert imp.is_quality_recipenlg(row) is False


class TestMapRecipeNLGRow:
    def _good_row(self):
        return {
            "title": "No-Bake Nut Cookies",
            "ingredients": '["1 c. brown sugar", "1/2 c. milk", "1/2 tsp. vanilla", "1/2 c. nuts", "2 Tbsp. butter", "3 c. rice biscuits"]',
            "directions": '["Mix brown sugar and milk.", "Boil 5 minutes.", "Add vanilla and cereal.", "Drop on wax paper."]',
            "link": "https://www.cookbooks.com/Recipe-Details.aspx?id=44874",
            "source": "Gathered",
        }

    def test_maps_core_fields(self):
        result = imp.map_recipenlg_row(self._good_row())
        assert result is not None
        assert result["title"] == "No-Bake Nut Cookies"
        assert result["source"] == "dataset"
        assert result["source_url"] == "https://www.cookbooks.com/Recipe-Details.aspx?id=44874"

    def test_ingredients_wrapped_as_name_dicts(self):
        result = imp.map_recipenlg_row(self._good_row())
        assert result["ingredients"][0] == {"name": "1 c. brown sugar"}

    def test_returns_none_without_link(self):
        row = self._good_row()
        row["link"] = ""
        assert imp.map_recipenlg_row(row) is None
