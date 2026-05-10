import os
from dataclasses import dataclass, field
from typing import Any
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")


@dataclass
class ApplyResult:
    inserted: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)


def upsert_recipes(recipes: list[dict[str, Any]]) -> ApplyResult:
    result = ApplyResult()
    if not recipes:
        return result

    if not SUPABASE_URL or not SUPABASE_KEY:
        result.errors.append("Missing Supabase credentials — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
        return result

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    for recipe in recipes:
        row = {**recipe, "source": recipe.get("source", "curated")}
        try:
            resp = client.table("recipes").upsert(
                row, on_conflict="source_url"
            ).execute()
            if resp.data:
                result.inserted += len(resp.data)
            else:
                result.skipped += 1
        except Exception as e:
            msg = f"Upsert failed for '{recipe.get('title', '?')}': {e}"
            print(f"  [apply] {msg}")
            result.errors.append(msg)

    return result
