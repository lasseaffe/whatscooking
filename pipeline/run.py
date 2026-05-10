# Scheduled via Windows Task Scheduler:
#   Daily 07:00:   python pipeline/run.py --schedule=daily
#   Weekly Mon:    python pipeline/run.py --schedule=weekly
import sys
import os
# Ensure project root is on sys.path when run as `python pipeline/run.py`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

from pipeline.config import SCHEDULE_DAILY, SCHEDULE_WEEKLY, LOGS_DIR
from pipeline.lib.compose import check_ollama_reachable
from pipeline.lib.apply import upsert_recipes


STRATEGY_MAP = {
    "trending":  lambda: __import__("pipeline.strategies.trending",  fromlist=["TrendingStrategy"]).TrendingStrategy(),
    "seasonal":  lambda: __import__("pipeline.strategies.seasonal",  fromlist=["SeasonalStrategy"]).SeasonalStrategy(),
    "haute":     lambda: __import__("pipeline.strategies.haute",     fromlist=["HauteStrategy"]).HauteStrategy(),
    "superfood": lambda: __import__("pipeline.strategies.superfood", fromlist=["SuperfoodStrategy"]).SuperfoodStrategy(),
    "mealplan":  lambda: __import__("pipeline.strategies.mealplan",  fromlist=["MealplanStrategy"]).MealplanStrategy(),
    "standard":  lambda: __import__("pipeline.strategies.standard",  fromlist=["StandardStrategy"]).StandardStrategy(),
}


def setup_logging() -> logging.Logger:
    Path(LOGS_DIR).mkdir(parents=True, exist_ok=True)
    log_path = Path(LOGS_DIR) / f"{datetime.now().strftime('%Y-%m-%d-%H')}.log"

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


def run_strategy(name: str, logger: logging.Logger) -> tuple[int, int, int]:
    """Run one strategy. Returns (attempted, inserted, failed)."""
    logger.info(f"--- Strategy: {name} ---")
    strategy = STRATEGY_MAP[name]()

    raw_batches = strategy.scrape()
    logger.info(f"  Scraped {len(raw_batches)} batches")

    composed = []
    failed = 0

    for raw in raw_batches:
        recipe = strategy.compose([raw])
        if recipe is None:
            logger.warning(f"  compose() returned None for batch in {name}")
            failed += 1
            continue
        if not strategy.validate(recipe):
            logger.warning(f"  validate() failed for '{recipe.get('title', '?')}' in {name}")
            failed += 1
            continue
        composed.append(recipe)

    attempted = len(raw_batches)
    if not composed:
        logger.warning(f"  No valid recipes produced by {name}")
        return attempted, 0, failed

    result = upsert_recipes(composed)
    logger.info(f"  Upserted: inserted={result.inserted} skipped={result.skipped} errors={len(result.errors)}")
    for err in result.errors:
        logger.error(f"    {err}")

    return attempted, result.inserted, failed + len(result.errors)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--schedule", choices=["daily", "weekly"], required=True)
    args = parser.parse_args()

    logger = setup_logging()
    logger.info(f"=== Pipeline starting — schedule={args.schedule} ===")

    if not check_ollama_reachable():
        logger.error("Ollama is not reachable at http://localhost:11434. Start Ollama and retry.")
        sys.exit(1)
    logger.info("Ollama reachable ✓")

    strategies = SCHEDULE_DAILY if args.schedule == "daily" else SCHEDULE_WEEKLY
    totals = {"attempted": 0, "inserted": 0, "failed": 0}

    for name in strategies:
        attempted, inserted, failed = run_strategy(name, logger)
        totals["attempted"] += attempted
        totals["inserted"] += inserted
        totals["failed"] += failed

    logger.info("=== Run complete ===")
    logger.info(f"  Strategies run: {strategies}")
    logger.info(f"  Recipes attempted: {totals['attempted']}")
    logger.info(f"  Recipes inserted:  {totals['inserted']}")
    logger.info(f"  Failures:          {totals['failed']}")


if __name__ == "__main__":
    main()
