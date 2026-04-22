import os
import time
from dotenv import load_dotenv
from scripts.ingestion.sources import SOURCES
from scripts.ingestion.discover import discover_urls
from scripts.ingestion.scrape import scrape_url
from scripts.ingestion.ingest import get_supabase, fetch_existing_urls, filter_new_urls, upsert_recipes

load_dotenv()


def run():
    google_api_key = os.environ.get("GOOGLE_CSE_KEY")
    google_cse_id = os.environ.get("GOOGLE_CSE_ID")

    supabase = get_supabase()
    existing_urls = fetch_existing_urls(supabase)
    print(f"[main] {len(existing_urls)} recipes already in DB — will skip these URLs")

    total_inserted = 0
    total_skipped = 0

    for source in SOURCES:
        print(f"\n[main] Processing source: {source['name']}")

        raw_urls = discover_urls(source, google_api_key, google_cse_id)
        new_urls = filter_new_urls(raw_urls, existing_urls)
        print(f"[main] {len(raw_urls)} URLs discovered, {len(new_urls)} new")

        recipes = []
        for url in new_urls:
            recipe = scrape_url(url, source)
            if recipe:
                recipes.append(recipe)
            time.sleep(0.5)  # polite crawl delay

        inserted, skipped = upsert_recipes(recipes, supabase)
        total_inserted += inserted
        total_skipped += skipped
        print(f"[main] {source['name']}: {inserted} inserted, {skipped} skipped")

    print(f"\n[main] Done. Total: {total_inserted} inserted, {total_skipped} skipped/failed")


if __name__ == "__main__":
    run()
