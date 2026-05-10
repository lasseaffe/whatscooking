import json
import time
import requests
from pathlib import Path
from pipeline.config import (
    USDA_FDC_API_KEY, SUPERFOOD_NUTRIENT_ROTATION,
    CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY,
    ROTATION_STATE_FILE, SUPABASE_URL, SUPABASE_KEY,
)
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy

# USDA FDC nutrient IDs for each rotation slot
NUTRIENT_IDS = {
    "fiber": 1079,
    "omega-3": 1404,
    "antioxidants": 1162,   # vitamin C as proxy
    "iron": 1089,
    "calcium": 1087,
    "vitamin-c": 1162,
}

# Static fallback ingredients per nutrient when FDC API key is missing
FALLBACK_INGREDIENTS = {
    "fiber": ["lentils", "black beans", "oats", "broccoli", "avocado"],
    "omega-3": ["salmon", "walnuts", "chia seeds", "flaxseed", "mackerel"],
    "antioxidants": ["blueberries", "dark chocolate", "spinach", "pecans", "red cabbage"],
    "iron": ["spinach", "lentils", "tofu", "pumpkin seeds", "quinoa"],
    "calcium": ["kale", "almonds", "sardines", "chia seeds", "white beans"],
    "vitamin-c": ["bell peppers", "kiwi", "strawberries", "broccoli", "citrus"],
}


def _load_nutrient_rotation_index() -> int:
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            return json.loads(state_path.read_text()).get("superfood_next_index", 0)
        except Exception:
            pass
    return 0


def _save_nutrient_rotation_index(idx: int) -> None:
    state_path = Path(ROTATION_STATE_FILE)
    try:
        data = json.loads(state_path.read_text()) if state_path.exists() else {}
    except Exception:
        data = {}
    data["superfood_next_index"] = idx
    state_path.write_text(json.dumps(data))


def _fetch_top_ingredients(nutrient: str, n: int = 5) -> list[str]:
    if not USDA_FDC_API_KEY:
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach", "kale", "quinoa"])[:n]

    nutrient_id = NUTRIENT_IDS.get(nutrient)
    if not nutrient_id:
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]

    try:
        url = "https://api.nal.usda.gov/fdc/v1/foods/search"
        params = {
            "api_key": USDA_FDC_API_KEY,
            "query": nutrient,
            "dataType": "Foundation,SR Legacy",
            "pageSize": n * 2,
            "sortBy": "dataType.keyword",
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        foods = resp.json().get("foods", [])
        names = [f["description"].split(",")[0].lower() for f in foods[:n] if f.get("description")]
        return names if names else FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]
    except Exception as e:
        print(f"  [superfood] USDA FDC request failed: {e}")
        return FALLBACK_INGREDIENTS.get(nutrient, ["spinach"])[:n]


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [superfood] Dedup check failed: {e}")
        return set()


class SuperfoodStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw: list[dict] = []
        self._nutrient: str = ""

    def scrape(self) -> list[dict]:
        idx = _load_nutrient_rotation_index()
        self._nutrient = SUPERFOOD_NUTRIENT_ROTATION[idx % len(SUPERFOOD_NUTRIENT_ROTATION)]
        _save_nutrient_rotation_index(idx + 1)

        ingredients = _fetch_top_ingredients(self._nutrient, n=3)
        existing_urls = _get_existing_urls()

        all_links: list[str] = []
        for ingredient in ingredients:
            for url_template in CATEGORY_LISTING_URLS["superfood"]:
                listing_url = url_template.format(ingredient=ingredient.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

        self._raw = scrape_urls(all_links, existing_urls, limit=RECIPES_PER_STRATEGY["superfood"])
        return self._raw

    def compose(self, raw: list[dict]) -> dict | None:
        if not raw:
            return None
        prompt = build_composite_prompt(
            raw,
            category=f"superfood ({self._nutrient}-rich)",
            extra_instruction=(
                f"Emphasise the nutritional benefit of high-{self._nutrient} ingredients. "
                'Add "superfood" to dietary_tags.'
            ),
        )
        recipe = call_ollama(prompt)
        if recipe and "superfood" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("superfood")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
