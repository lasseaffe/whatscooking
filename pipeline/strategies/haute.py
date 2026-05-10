from pipeline.config import CATEGORY_LISTING_URLS, RECIPES_PER_STRATEGY
from pipeline.lib.scrape import get_links_from_listing, scrape_urls
from pipeline.lib.compose import build_composite_prompt, call_ollama
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy
from pipeline.lib.dedup import get_existing_urls


class HauteStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw: list[dict] = []

    def scrape(self) -> list[dict]:
        existing_urls = get_existing_urls()
        all_links: list[str] = []
        for listing_url in CATEGORY_LISTING_URLS["haute"]:
            all_links += get_links_from_listing(listing_url, limit=10)

        self._raw = scrape_urls(all_links, existing_urls, limit=RECIPES_PER_STRATEGY["haute"])
        return self._raw

    def compose(self, raw: list[dict]) -> dict | None:
        if not raw:
            return None
        prompt = build_composite_prompt(
            raw,
            category="fine dining",
            extra_instruction=(
                "This is a haute cuisine recipe. Preserve technique precision — "
                "describe cooking temperatures, resting times, and plating. "
                'Add "fine-dining" to dish_types.'
            ),
        )
        recipe = call_ollama(prompt)
        if recipe and "fine-dining" not in recipe.get("dish_types", []):
            recipe.setdefault("dish_types", []).append("fine-dining")
        return recipe

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
