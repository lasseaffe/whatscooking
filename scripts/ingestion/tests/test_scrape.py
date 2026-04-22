from scripts.ingestion.scrape import normalize_recipe_scraper, parse_yield


def test_parse_yield_with_number():
    assert parse_yield("4 servings") == 4


def test_parse_yield_with_just_number():
    assert parse_yield("6") == 6


def test_parse_yield_none():
    assert parse_yield(None) is None


def test_parse_yield_empty():
    assert parse_yield("") is None


def test_normalize_ingredients_list():
    result = normalize_recipe_scraper(
        title="Test",
        ingredients=["2 cups flour", "1 tsp salt"],
        instructions=["Mix.", "Bake."],
        image=None,
        total_time=30,
        yields="4 servings",
        cuisine=None,
        source_url="https://allrecipes.com/recipe/test",
        category="Classic",
        cuisine_type=None,
    )
    assert result["title"] == "Test"
    assert len(result["ingredients"]) == 2
    assert result["ingredients"][0] == {"name": "2 cups flour", "amount": None, "unit": None}
    assert result["cook_time_minutes"] == 30
    assert result["servings"] == 4
    assert result["source_url"] == "https://allrecipes.com/recipe/test"
    assert result["source"] == "scraped"
    assert result["category"] == "Classic"
