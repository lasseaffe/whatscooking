import json
from pathlib import Path
from typing import Any

from pipeline.config import (
    STANDARD_CATEGORIES_ROTATION, CATEGORIES_PER_RUN,
    CATEGORY_LISTING_URLS, ROTATION_STATE_FILE, SUPABASE_URL, SUPABASE_KEY,
)
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
        print(f"  [standard] Dedup check failed: {e}")
        return set()


def _load_rotation_state() -> int:
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            data = json.loads(state_path.read_text())
            return data.get("standard_next_index", 0)
        except Exception:
            pass
    return 0


def _save_rotation_state(next_index: int) -> None:
    state_path = Path(ROTATION_STATE_FILE)
    try:
        data = json.loads(state_path.read_text()) if state_path.exists() else {}
    except Exception:
        data = {}
    data["standard_next_index"] = next_index
    state_path.write_text(json.dumps(data))


class StandardStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._raw_batches: list[tuple[str, list[dict]]] = []  # [(category, raw_recipes)]

    def scrape(self) -> list[dict]:
        start_index = _load_rotation_state()
        total = len(STANDARD_CATEGORIES_ROTATION)
        indices = [(start_index + i) % total for i in range(CATEGORIES_PER_RUN)]
        categories = [STANDARD_CATEGORIES_ROTATION[i] for i in indices]
        next_index = (start_index + CATEGORIES_PER_RUN) % total
        _save_rotation_state(next_index)

        existing_urls = _get_existing_urls()
        self._raw_batches = []

        for category in categories:
            sources = CATEGORY_LISTING_URLS["standard"].get(category, {})
            all_links: list[str] = []
            for listing_url in sources.values():
                all_links += get_links_from_listing(listing_url, limit=10)

            raw = scrape_urls(all_links, existing_urls, limit=2)
            if raw:
                self._raw_batches.append((category, raw))

        # Return a flat sentinel list — orchestrator calls compose() per batch
        return [{"_batch": True}] * len(self._raw_batches)

    def compose(self, raw: list[dict]) -> dict | None:
        # raw is unused — we use self._raw_batches directly (one compose per category batch)
        if not self._raw_batches:
            return None
        category, batch = self._raw_batches.pop(0)
        prompt = build_composite_prompt(batch, category)
        return call_ollama(prompt)

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
