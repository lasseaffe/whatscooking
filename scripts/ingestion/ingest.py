import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def fetch_existing_urls(supabase: Client) -> set[str]:
    urls: set[str] = set()
    page_size = 1000
    offset = 0
    while True:
        result = (
            supabase.table("recipes")
            .select("source_url")
            .not_.is_("source_url", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = {row["source_url"] for row in result.data if row.get("source_url")}
        urls |= batch
        if len(result.data) < page_size:
            break
        offset += page_size
    return urls


def filter_new_urls(candidates: list[str], existing: set[str]) -> list[str]:
    return [url for url in candidates if url not in existing]


def build_upsert_payload(recipe: dict) -> dict:
    # Always include list fields even when empty; strip None scalar values
    list_fields = {"ingredients", "instructions", "dish_types", "dietary_tags"}
    return {k: v for k, v in recipe.items() if v is not None or k in list_fields}


def upsert_recipes(recipes: list[dict], supabase: Optional[Client] = None) -> tuple[int, int]:
    if supabase is None:
        supabase = get_supabase()

    inserted = 0
    skipped = 0

    for recipe in recipes:
        if not recipe.get("title") or not recipe.get("source_url"):
            skipped += 1
            continue
        payload = build_upsert_payload(recipe)
        try:
            supabase.table("recipes").upsert(
                payload,
                on_conflict="source_url",
                ignore_duplicates=True,
            ).execute()
            inserted += 1
        except Exception as e:
            print(f"[ingest] Failed to upsert {recipe.get('source_url')}: {e}")
            skipped += 1

    return inserted, skipped
