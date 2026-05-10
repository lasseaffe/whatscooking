import time
from pytrends.request import TrendReq
from pipeline.config import CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY, SUPABASE_URL, SUPABASE_KEY
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
        print(f"  [trending] Dedup check failed: {e}")
        return set()


def _fetch_trending_terms(n: int = 5) -> list[str]:
    """Return up to n rising food-related search terms via pytrends."""
    try:
        pt = TrendReq(hl="en-US", tz=360)
        # Category 71 = Food & Drink in Google Trends
        pt.build_payload(kw_list=["recipe"], cat=71, timeframe="now 1-d")
        related = pt.related_queries()
        rising = related.get("recipe", {}).get("rising")
        if rising is not None and not rising.empty:
            terms = rising["query"].tolist()[:n]
            if terms:
                return terms
    except Exception as e:
        print(f"  [trending] pytrends failed: {e}")

    # Fallback: static popular terms when pytrends is rate-limited
    return ["pasta recipe", "chicken dinner", "easy soup", "healthy salad", "quick breakfast"]


class TrendingStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._batches: list[tuple[str, list[dict]]] = []  # [(term, raw_recipes)]

    def scrape(self) -> list[dict]:
        terms = _fetch_trending_terms(RECIPES_PER_STRATEGY["trending"])
        existing_urls = _get_existing_urls()
        self._batches = []

        for term in terms:
            all_links: list[str] = []
            for url_template in CATEGORY_LISTING_URLS["trending"]:
                listing_url = url_template.format(term=term.replace(" ", "+"))
                all_links += get_links_from_listing(listing_url, limit=5)
                time.sleep(1)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._batches.append((term, raw))

        return [{"_batch": True}] * len(self._batches)

    def compose(self, raw: list[dict]) -> dict | None:
        if not self._batches:
            return None
        term, batch = self._batches.pop(0)
        prompt = build_composite_prompt(
            batch,
            category=term,
            extra_instruction='Add "trending" to the dietary_tags list.',
        )
        recipe = call_ollama(prompt)
        if recipe and "trending" not in recipe.get("dietary_tags", []):
            recipe.setdefault("dietary_tags", []).append("trending")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
