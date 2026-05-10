# Scheduled via Windows Task Scheduler: weekly Monday 07:00
# Setup: see docs/superpowers/plans/2026-05-10-weekly-recipe-pipeline.md Task 7
import json
import sys
import logging
from datetime import date
from pathlib import Path

from pipeline.config import (
    CATEGORIES_ROTATION, CATEGORIES_PER_RUN,
    OUTPUT_DIR, ROTATION_STATE_FILE
)
from pipeline.compose import check_ollama_reachable, compose_recipe
from pipeline.scrape import scrape_category, get_existing_urls
from pipeline.emit_sql import write_sql_file


def setup_logging(output_dir: str) -> logging.Logger:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    log_path = Path(output_dir) / f"{date.today().isoformat()}.log"

    logger = logging.getLogger("pipeline")
    logger.setLevel(logging.INFO)

    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")

    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    return logger


def load_rotation_state() -> int:
    """Return the index of the next category to start from."""
    state_path = Path(ROTATION_STATE_FILE)
    if state_path.exists():
        try:
            return json.loads(state_path.read_text())["next_index"]
        except Exception:
            pass
    return 0


def save_rotation_state(next_index: int) -> None:
    Path(ROTATION_STATE_FILE).write_text(json.dumps({"next_index": next_index}))


def pick_categories(start_index: int) -> tuple[list[str], int]:
    """Pick CATEGORIES_PER_RUN categories round-robin, return (categories, new_next_index)."""
    total = len(CATEGORIES_ROTATION)
    indices = [(start_index + i) % total for i in range(CATEGORIES_PER_RUN)]
    categories = [CATEGORIES_ROTATION[i] for i in indices]
    next_index = (start_index + CATEGORIES_PER_RUN) % total
    return categories, next_index


def main() -> None:
    logger = setup_logging(OUTPUT_DIR)
    logger.info("=== Weekly Recipe Pipeline starting ===")

    # Check Ollama
    if not check_ollama_reachable():
        logger.error("Ollama is not reachable at http://localhost:11434. Start Ollama and retry.")
        sys.exit(1)
    logger.info("Ollama reachable ✓")

    # Pick this week's categories
    start_index = load_rotation_state()
    categories, next_index = pick_categories(start_index)
    logger.info(f"Categories this run: {categories}")

    # Fetch existing URLs for dedup
    existing_urls = get_existing_urls()
    logger.info(f"Existing curated URLs in DB: {len(existing_urls)}")

    composed_recipes = []
    validation_failures = []

    for category in categories:
        logger.info(f"--- Category: {category} ---")

        # Stage 1: Scrape
        raw_recipes = scrape_category(category, existing_urls)
        logger.info(f"  Scraped {len(raw_recipes)} raw recipes for '{category}'")

        if len(raw_recipes) < 1:
            logger.warning(f"  Not enough scraped recipes for '{category}', skipping composition")
            continue

        # Stage 2: Compose
        recipe = compose_recipe(raw_recipes, category)
        if recipe is None:
            msg = f"Composition failed for category '{category}'"
            logger.warning(f"  {msg}")
            validation_failures.append(msg)
            continue

        composed_recipes.append(recipe)
        logger.info(f"  Composed: '{recipe['title']}'")

    # Stage 3: Emit SQL
    if composed_recipes:
        sql_path = write_sql_file(composed_recipes, OUTPUT_DIR)
        logger.info(f"SQL written to: {sql_path}")
    else:
        logger.warning("No recipes composed this run — no SQL file written")
        sql_path = None

    # Save rotation state
    save_rotation_state(next_index)

    # Summary
    logger.info("=== Run complete ===")
    logger.info(f"  Categories targeted: {categories}")
    logger.info(f"  Recipes composed: {len(composed_recipes)}")
    logger.info(f"  Validation failures: {len(validation_failures)}")
    if validation_failures:
        for f in validation_failures:
            logger.info(f"    - {f}")
    if sql_path:
        logger.info(f"  Output: {sql_path}")
        logger.info("  Next step: review SQL file and apply via Supabase SQL editor")


if __name__ == "__main__":
    main()
