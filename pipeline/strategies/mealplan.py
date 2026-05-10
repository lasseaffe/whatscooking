import json
import re
import requests
from typing import Any
from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT, RECIPES_PER_STRATEGY
from pipeline.lib.validate import validate_recipe
from pipeline.strategies.base import BaseStrategy

MEALPLAN_SCHEMA = """
[
  {
    "title": "string",
    "description": "string — 2-3 engaging sentences",
    "cuisine_type": "string",
    "dish_types": ["string — must include one of: breakfast, lunch, dinner"],
    "dietary_tags": ["meal-plan-ready"],
    "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
    "instructions": ["string"],
    "prep_time_minutes": number,
    "cook_time_minutes": number,
    "servings": 2,
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "source_name": "AI Generated",
    "source_url": "string — unique slug like ai-mealplan-<dish-slug>-<YYYYMMDD>"
  }
]
"""

MEALPLAN_PROMPT = """You are a professional nutritionist and recipe developer creating a weekly meal plan for a family of 2.

Generate exactly 7 recipes in this composition:
- 2 breakfast recipes
- 2 lunch recipes
- 3 dinner recipes

Macro targets across the full day (3 meals):
- ~2000 kcal/day total
- ~30% protein (~150g/day)
- ~40% carbohydrates (~200g/day)
- ~30% fat (~65g/day)

Each recipe must serve 2 people. Vary cuisines and ingredients — no two recipes should share a primary protein or starch.

Return ONLY a valid JSON array of exactly 7 recipe objects. Each object must match this schema:
{schema}

Rules:
- Every recipe must have "meal-plan-ready" in dietary_tags
- dish_types must include "breakfast", "lunch", or "dinner" as appropriate
- source_url must be unique — use format: ai-mealplan-<kebab-case-title>-{date}
- calories, protein_g, carbs_g, fat_g must be realistic and consistent with each other
- Return ONLY the JSON array, no markdown, no explanation
""".format(schema=MEALPLAN_SCHEMA, date="{date}")


class MealplanStrategy(BaseStrategy):
    def __init__(self) -> None:
        self._recipes: list[dict] = []

    def scrape(self) -> list[dict]:
        # No scraping — pure generation. Return 7 sentinels so the orchestrator calls compose() 7 times.
        from pipeline.config import RECIPES_PER_STRATEGY
        return [{"_generate": True}] * RECIPES_PER_STRATEGY["mealplan"]

    def compose(self, raw: list[dict]) -> dict | None:
        # Generate all 7 at once; cache remaining in self._recipes
        if self._recipes:
            return self._recipes.pop(0)

        from datetime import date
        prompt = MEALPLAN_PROMPT.replace("{date}", date.today().strftime("%Y%m%d"))

        try:
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 6000},
                },
                timeout=OLLAMA_TIMEOUT,
            )
            response.raise_for_status()
        except Exception as e:
            print(f"  [mealplan] Ollama request failed: {e}")
            return None

        raw_text = response.json().get("response", "")
        text = raw_text.strip()
        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
        if text.endswith("```"):
            text = text[:-3].strip()
        text = re.sub(r'(?<![/\w])(\d+)/(\d+)(?![/\w])', lambda m: str(int(m.group(1)) / int(m.group(2))), text)

        try:
            recipes: list[dict[str, Any]] = json.loads(text)
        except json.JSONDecodeError as e:
            print(f"  [mealplan] JSON parse failed: {e}\nRaw: {raw_text[:500]}")
            return None

        if not isinstance(recipes, list) or not recipes:
            print("  [mealplan] Expected a JSON array, got something else")
            return None

        self._recipes = recipes[1:]  # cache remaining
        return recipes[0]

    def validate(self, recipe: dict) -> bool:
        if recipe is None:
            return False
        return len(validate_recipe(recipe)) == 0
