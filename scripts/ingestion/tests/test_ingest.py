from scripts.ingestion.ingest import filter_new_urls, build_upsert_payload


def test_filter_new_urls_removes_existing():
    existing = {"https://allrecipes.com/recipe/old", "https://allrecipes.com/recipe/another"}
    candidates = [
        "https://allrecipes.com/recipe/old",
        "https://allrecipes.com/recipe/new",
        "https://allrecipes.com/recipe/another",
        "https://allrecipes.com/recipe/brand-new",
    ]
    result = filter_new_urls(candidates, existing)
    assert result == ["https://allrecipes.com/recipe/new", "https://allrecipes.com/recipe/brand-new"]


def test_filter_new_urls_all_new():
    result = filter_new_urls(["https://a.com/1", "https://a.com/2"], set())
    assert result == ["https://a.com/1", "https://a.com/2"]


def test_build_upsert_payload_strips_none_keys():
    recipe = {
        "title": "Pasta",
        "source_url": "https://allrecipes.com/recipe/pasta",
        "ingredients": [],
        "instructions": [],
        "image_url": None,
        "cook_time_minutes": None,
        "servings": None,
        "cuisine_type": None,
        "source": "scraped",
        "category": "Classic",
        "dish_types": [],
        "dietary_tags": [],
    }
    payload = build_upsert_payload(recipe)
    assert payload["title"] == "Pasta"
    assert "image_url" not in payload
    assert "cook_time_minutes" not in payload


def test_build_upsert_payload_keeps_non_none():
    recipe = {
        "title": "Soup",
        "source_url": "https://allrecipes.com/recipe/soup",
        "ingredients": [{"name": "water", "amount": None, "unit": None}],
        "instructions": ["Boil water."],
        "image_url": "https://img.com/soup.jpg",
        "cook_time_minutes": 20,
        "servings": 4,
        "cuisine_type": "American",
        "source": "scraped",
        "category": "Classic",
        "dish_types": [],
        "dietary_tags": [],
    }
    payload = build_upsert_payload(recipe)
    assert payload["image_url"] == "https://img.com/soup.jpg"
    assert payload["cook_time_minutes"] == 20
