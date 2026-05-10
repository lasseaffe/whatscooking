import time
from datetime import date
from pipeline.config import HARVEST_CALENDAR, CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY, SUPABASE_URL, SUPABASE_KEY
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy


def _get_existing_urls() -> set[str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [seasonal] Dedup check failed: {e}")
        return set()


class SeasonalStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._batches: list[tuple[str, list[dict]]] = []

    def scrape(self) -> list[dict]:
        month = date.today().month
        ingredients = HARVEST_CALENDAR.get(month, ["seasonal vegetables"])[:RECIPES_PER_STRATEGY["seasonal"]]
        existing_urls = _get_existing_urls()
        self._batches = []

        for ingredient in ingredients:
            all_links: list[str] = []
            for url_template in CATEGORY_LISTING_URLS["seasonal"]:
                listing_url = url_template.format(ingredient=ingredient.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._batches.append((ingredient, raw))

        return [{"_batch": True}] * len(self._batches)

    def compose(self, raw: list[dict]) -> dict | None:
        if not self._batches:
            return None
        ingredient, batch = self._batches.pop(0)
        prompt = build_composite_prompt(
            batch,
            category=f"seasonal {ingredient}",
            extra_instruction=f'The hero ingredient is {ingredient}, currently in peak season. Add "seasonal" to the dietary_tags list.',
        )
        recipe = call_ollama(prompt)
        if recipe and "seasonal" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("seasonal")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
