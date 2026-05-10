"""
qwen_scraper.py — Generate recipes locally via Ollama + Qwen and optionally upsert to Supabase.

Usage:
    python qwen_scraper.py "Korean Tacos" --model qwen2.5:7b --upsert
    python qwen_scraper.py "Korean Tacos" "Okonomiyaki" --model qwen2.5:7b
"""

import argparse
import json
import os
import re
import sys

import ollama

from scrape import normalize_recipe_scraper

PROMPT_TEMPLATE = """\
You are a recipe database assistant. Return ONLY a JSON object (no markdown) with:
{{
  "title": "string",
  "ingredients": ["string"],
  "instructions": ["string"],
  "cook_time_minutes": int or null,
  "servings": int or null,
  "cuisine_type": "string"
}}

Generate a recipe for: {dish_name}"""


def strip_fences(text: str) -> str:
    return re.sub(r'^```json?\s*|\s*```$', '', text, flags=re.MULTILINE).strip()


def generate_recipe(dish_name: str, model: str) -> dict | None:
    prompt = PROMPT_TEMPLATE.format(dish_name=dish_name)
    try:
        response = ollama.chat(model=model, messages=[{"role": "user", "content": prompt}])
        raw = response["message"]["content"]
    except Exception as e:
        print(f"[ERROR] Ollama call failed for '{dish_name}': {e}")
        return None

    clean = strip_fences(raw)
    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse failed for '{dish_name}': {e}")
        print(f"  Raw response: {raw[:300]}")
        return None

    recipe = normalize_recipe_scraper(
        title=data.get("title", dish_name),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions", []),
        image=None,
        total_time=data.get("cook_time_minutes"),
        yields=str(data.get("servings")) if data.get("servings") is not None else None,
        cuisine=data.get("cuisine_type"),
        source_url=None,
        category="ai-generated",
        cuisine_type=data.get("cuisine_type"),
    )
    recipe["source"] = "ai-generated"
    recipe["source_url"] = None
    return recipe


def upsert_recipe(recipe: dict, supabase_client) -> None:
    supabase_client.table("recipes").upsert(recipe, on_conflict="title").execute()


def main():
    parser = argparse.ArgumentParser(description="Generate recipes with Ollama + Qwen")
    parser.add_argument("dishes", nargs="+", help="Dish name(s) to generate")
    parser.add_argument("--model", default="qwen2.5:7b", help="Ollama model to use")
    parser.add_argument("--upsert", action="store_true", help="Upsert recipes to Supabase")
    args = parser.parse_args()

    supabase_client = None
    if args.upsert:
        try:
            from dotenv import load_dotenv
            env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
            load_dotenv(env_path)
            from supabase import create_client
            url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
            key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
            supabase_client = create_client(url, key)
        except Exception as e:
            print(f"[ERROR] Failed to initialise Supabase client: {e}")
            sys.exit(1)

    for dish in args.dishes:
        print(f"\n[INFO] Generating recipe for: {dish}")
        recipe = generate_recipe(dish, args.model)
        if recipe is None:
            continue

        print(f"[OK]   Generated: {recipe['title']}")

        if args.upsert and supabase_client:
            try:
                upsert_recipe(recipe, supabase_client)
                print(f"[OK]   Upserted to Supabase: {recipe['title']}")
            except Exception as e:
                print(f"[ERROR] Supabase upsert failed for '{dish}': {e}")
        else:
            print(json.dumps(recipe, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
