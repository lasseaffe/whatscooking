#!/usr/bin/env python3
"""
Bulk dataset ingestion for What's Cooking.
Sources: Food.com (Kaggle) + RecipeNLG (Kaggle)
Target:  10,000 recipes in Supabase

Run:
  pip install supabase pandas tqdm
  python scripts/ingest-datasets.py

Requires .env.local with:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY   (or SUPABASE_SERVICE_KEY)
"""

import csv
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from supabase import create_client
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATASETS_DIR  = Path(__file__).parent.parent / "datasets"
FOODCOM_CSV   = DATASETS_DIR / "foodcom" / "RAW_recipes.csv"
RECIPENLG_CSV = DATASETS_DIR / "recipenlg" / "RecipeNLG_dataset.csv"

FOODCOM_QUOTA   = 7_000
RECIPENLG_QUOTA = 3_000
BATCH_SIZE      = 100

KNOWN_DIETARY_TAGS = {
    "vegan", "vegetarian", "gluten-free", "dairy-free",
    "nut-free", "low-carb", "high-protein", "keto", "paleo", "halal", "kosher",
}

DIETARY_TAG_MAP = {
    "gluten free": "gluten-free",
    "dairy free":  "dairy-free",
    "nut free":    "nut-free",
    "low carb":    "low-carb",
    "high protein": "high-protein",
}

# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

def load_env():
    env_path = Path(__file__).parent.parent / ".env.local"
    env = {}
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    env.update(os.environ)
    return env

def get_supabase():
    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") or env.get("SUPABASE_URL")
    key = (env.get("SUPABASE_SERVICE_ROLE_KEY")
           or env.get("SUPABASE_SERVICE_KEY")
           or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
    if not url or not key:
        raise RuntimeError(
            "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local"
        )
    return create_client(url, key)

# ---------------------------------------------------------------------------
# Safe list parsing (no eval — parses Python-style string lists via regex)
# ---------------------------------------------------------------------------

_LIST_ITEM_RE = re.compile(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"")

def parse_list_field(raw) -> list:
    """Parse Food.com's stringified Python lists without using eval."""
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    s = str(raw).strip()
    if not s or s in ("[]", "nan", ""):
        return []

    # Try JSON first (works for double-quoted lists)
    try:
        result = json.loads(s)
        if isinstance(result, list):
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    # Regex extraction for single-quoted Python lists
    matches = _LIST_ITEM_RE.findall(s)
    if matches:
        return [m[0] or m[1] for m in matches]

    # Last resort: strip brackets, split on comma
    s = s.strip("[]")
    return [x.strip().strip("'\"") for x in s.split(",") if x.strip()]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def deterministic_uuid(title: str, dataset_name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{title}::{dataset_name}"))

def ingredients_to_jsonb(raw_ingredients: list) -> list:
    return [{"name": ing.strip(), "amount": None, "unit": None}
            for ing in raw_ingredients if ing and ing.strip()]

def normalize_dietary_tags(tags: list) -> list:
    result = []
    for tag in tags:
        t = tag.lower().strip()
        t = DIETARY_TAG_MAP.get(t, t)
        if t in KNOWN_DIETARY_TAGS:
            result.append(t)
    return list(set(result))

def safe_int(val, default=None):
    try:
        v = int(float(str(val)))
        return v if v > 0 else default
    except Exception:
        return default

def safe_float(val, default=None):
    try:
        v = float(str(val))
        return round(v, 2) if v > 0 else default
    except Exception:
        return default

def nth(lst, i):
    try:
        return safe_float(lst[i])
    except Exception:
        return None

# ---------------------------------------------------------------------------
# Food.com normalization
# ---------------------------------------------------------------------------

def normalize_foodcom(row) -> dict | None:
    title = str(row.get("name", "")).strip()
    if not title or title == "nan":
        return None

    ingredients_raw = parse_list_field(row.get("ingredients", "[]"))
    if not ingredients_raw:
        return None

    instructions_raw = parse_list_field(row.get("steps", "[]"))
    tags_raw         = parse_list_field(row.get("tags", "[]"))
    dietary_tags     = normalize_dietary_tags(tags_raw)

    minutes   = safe_int(row.get("minutes"), 0)
    prep_time = round(minutes * 0.4) if minutes else None
    cook_time = round(minutes * 0.6) if minutes else None

    # Nutrition stored as "[calories, fat, sugar, sodium, protein, sat_fat, carbs]"
    nutrition = parse_list_field(row.get("nutrition", "[]"))

    desc = str(row.get("description", "")).strip()

    return {
        "id":                deterministic_uuid(title, "foodcom"),
        "source":            "dataset",
        "dataset_name":      "foodcom",
        "source_name":       "Food.com",
        "title":             title,
        "description":       desc if desc and desc != "nan" else None,
        "ingredients":       ingredients_to_jsonb(ingredients_raw),
        "instructions":      instructions_raw,
        "dietary_tags":      dietary_tags,
        "dish_types":        [],
        "prep_time_minutes": prep_time,
        "cook_time_minutes": cook_time,
        "servings":          safe_int(row.get("n_servings")),
        "calories":          safe_int(nth(nutrition, 0)),
        "fat_g":             nth(nutrition, 1),
        "sugar_g":           nth(nutrition, 2),
        "sodium_mg":         nth(nutrition, 3),
        "protein_g":         nth(nutrition, 4),
        "carbs_g":           nth(nutrition, 6),
    }

# ---------------------------------------------------------------------------
# RecipeNLG normalization
# ---------------------------------------------------------------------------

def normalize_recipenlg(row) -> dict | None:
    title = str(row.get("title", "")).strip()
    if not title or title == "nan":
        return None

    ingredients_raw = parse_list_field(row.get("ingredients", "[]"))
    if not ingredients_raw:
        return None

    instructions_raw = parse_list_field(row.get("directions", "[]"))
    source_name      = str(row.get("source", "")).strip() or None

    return {
        "id":           deterministic_uuid(title, "recipenlg"),
        "source":       "dataset",
        "dataset_name": "recipenlg",
        "source_name":  source_name or "RecipeNLG",
        "title":        title,
        "ingredients":  ingredients_to_jsonb(ingredients_raw),
        "instructions": instructions_raw,
        "dietary_tags": [],
        "dish_types":   [],
    }

# ---------------------------------------------------------------------------
# Upsert
# ---------------------------------------------------------------------------

def upsert_batch(supabase, batch: list, stats: dict):
    if not batch:
        return
    try:
        supabase.table("recipes").upsert(
            batch,
            on_conflict="id",
            ignore_duplicates=True
        ).execute()
        stats["inserted"] += len(batch)
    except Exception as e:
        stats["errors"] += len(batch)
        print(f"\n  [error] batch failed: {e}")

def ingest_source(supabase, records, quota: int, label: str, stats: dict) -> int:
    batch   = []
    ingested = 0

    with tqdm(total=quota, desc=f"  {label}", unit="recipes") as pbar:
        for rec in records:
            if ingested >= quota:
                break
            if rec is None:
                stats["skipped"] += 1
                continue
            batch.append(rec)
            if len(batch) >= BATCH_SIZE:
                upsert_batch(supabase, batch, stats)
                pbar.update(len(batch))
                ingested += len(batch)
                batch = []

        if batch and ingested < quota:
            upsert_batch(supabase, batch, stats)
            pbar.update(len(batch))
            ingested += len(batch)

    return ingested

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=== What's Cooking — Dataset Ingestion ===\n")

    supabase = get_supabase()
    stats = {"inserted": 0, "errors": 0, "skipped": 0}
    foodcom_titles: set[str] = set()
    manifest: dict = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "sources": {}
    }

    # --- Food.com ---
    if FOODCOM_CSV.exists():
        print(f"[1/2] Food.com — {FOODCOM_CSV}")
        df = pd.read_csv(FOODCOM_CSV, low_memory=False)
        print(f"      Loaded {len(df):,} rows. Sorting by n_steps desc...")

        if "n_steps" in df.columns:
            df = df.sort_values("n_steps", ascending=False)

        records = []
        for _, row in df.iterrows():
            rec = normalize_foodcom(row)
            if rec:
                foodcom_titles.add(rec["title"].lower())
                records.append(rec)

        ingested = ingest_source(supabase, iter(records), FOODCOM_QUOTA, "Food.com", stats)
        manifest["sources"]["foodcom"] = {
            "file": str(FOODCOM_CSV),
            "total_rows": len(df),
            "ingested": ingested,
        }
        print(f"      Done: {ingested:,} recipes ingested.\n")
    else:
        print(f"[1/2] Food.com CSV not found at {FOODCOM_CSV} — skipping.\n")

    # --- RecipeNLG ---
    recipenlg_path = RECIPENLG_CSV
    if not recipenlg_path.exists():
        candidates = (
            list((DATASETS_DIR / "recipenlg").glob("*.csv")) +
            list((DATASETS_DIR / "recipenlg").glob("*.jsonl")) +
            list((DATASETS_DIR / "recipenlg").glob("*.json"))
        )
        if candidates:
            recipenlg_path = sorted(candidates, key=lambda p: p.stat().st_size, reverse=True)[0]

    if recipenlg_path.exists():
        print(f"[2/2] RecipeNLG — {recipenlg_path}")
        if recipenlg_path.suffix in (".jsonl", ".json"):
            rows = []
            with open(recipenlg_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            rows.append(json.loads(line))
                        except (json.JSONDecodeError, ValueError):
                            pass
            df2 = pd.DataFrame(rows)
        else:
            df2 = pd.read_csv(recipenlg_path, low_memory=False)

        print(f"      Loaded {len(df2):,} rows. Deduplicating against Food.com titles...")

        records2 = []
        for _, row in df2.iterrows():
            rec = normalize_recipenlg(row)
            if rec and rec["title"].lower() not in foodcom_titles:
                records2.append(rec)

        print(f"      {len(records2):,} unique rows after dedup.")
        ingested2 = ingest_source(supabase, iter(records2), RECIPENLG_QUOTA, "RecipeNLG", stats)
        manifest["sources"]["recipenlg"] = {
            "file": str(recipenlg_path),
            "total_rows": len(df2),
            "ingested": ingested2,
        }
        print(f"      Done: {ingested2:,} recipes ingested.\n")
    else:
        print(f"[2/2] RecipeNLG not found at {recipenlg_path} — skipping.\n")

    # --- Summary ---
    total = stats["inserted"]
    manifest["stats"] = stats
    manifest["total_ingested"] = total

    manifest_path = DATASETS_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("=== Summary ===")
    print(f"  Inserted : {stats['inserted']:,}")
    print(f"  Skipped  : {stats['skipped']:,}")
    print(f"  Errors   : {stats['errors']:,}")
    print(f"  Manifest : {manifest_path}")
    print()
    if total >= 10_000:
        print(f"  10K target reached! ({total:,} recipes ingested)")
    else:
        print(f"  {total:,} / 10,000 ingested. Run again with higher quotas if needed.")


if __name__ == "__main__":
    main()
