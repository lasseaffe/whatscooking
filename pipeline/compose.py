import json
import re
import requests
from typing import Any
from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT

REQUIRED_FIELDS = [
    "title", "description", "ingredients", "instructions",
    "calories", "servings", "prep_time_minutes", "cook_time_minutes",
    "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg",
]

SCHEMA_DESCRIPTION = """
{
  "title": "string",
  "description": "string — 2-3 engaging sentences in present tense food-writing style",
  "cuisine_type": "string",
  "dish_types": ["string"],
  "dietary_tags": ["string — e.g. vegetarian, vegan, gluten-free, dairy-free"],
  "ingredients": [{"name": "string", "amount": number, "unit": "string"}],
  "instructions": ["string — each step as a complete sentence"],
  "prep_time_minutes": number,
  "cook_time_minutes": number,
  "servings": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "source_name": "string — comma-joined source site names",
  "source_url": "string — URL of the primary source recipe"
}
"""


def build_prompt(raw_recipes: list[dict], category: str) -> str:
    sources_text = ""
    for i, r in enumerate(raw_recipes, 1):
        sources_text += f"\n--- Source {i}: {r.get('source_name', 'Unknown')} ---\n"
        sources_text += f"Title: {r['title']}\n"
        sources_text += f"Ingredients: {', '.join(r.get('ingredients', []))}\n"
        instructions = r.get('instructions', [])
        sources_text += f"Instructions: {' '.join(instructions[:5])}\n"
        sources_text += f"URL: {r.get('source_url', '')}\n"

    return f"""You are a professional recipe developer creating composite recipes for a meal planning app.

I have scraped {len(raw_recipes)} real {category} recipes from cooking websites. Your task is to create ONE new composite recipe inspired by the best techniques and ingredients from these sources. Do NOT copy any single recipe — combine the best ideas into something new.

{sources_text}

Create a composite {category} recipe. Return ONLY a valid JSON object with this exact schema:
{SCHEMA_DESCRIPTION}

Rules:
- title must be original (not copied from any source)
- description must be 2-3 sentences, engaging, present tense
- ingredients must use numeric amounts (no fractions as strings)
- instructions must be step-by-step, each a complete sentence
- calories must be > 0, servings must be > 0
- source_name: comma-join the names of sources you drew from
- source_url: use the URL of the source that contributed most
- Return ONLY the JSON object, no markdown, no explanation
"""


def validate_recipe(recipe: dict[str, Any]) -> list[str]:
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in recipe:
            errors.append(f"Missing required field: {field}")

    if recipe.get("title") is not None and not str(recipe["title"]).strip():
        errors.append("title must not be empty")

    if recipe.get("description") is not None and not str(recipe.get("description", "")).strip():
        errors.append("description must not be empty")

    if recipe.get("calories") is not None and recipe["calories"] <= 0:
        errors.append("calories must be > 0")

    if recipe.get("servings") is not None and recipe["servings"] <= 0:
        errors.append("servings must be > 0")

    ingredients = recipe.get("ingredients", [])
    if not ingredients:
        errors.append("ingredients must not be empty")
    else:
        for i, ing in enumerate(ingredients):
            if not isinstance(ing, dict):
                errors.append(f"ingredient[{i}] must be a dict")
                continue
            if "name" not in ing or not ing["name"]:
                errors.append(f"ingredient[{i}] missing name")
            if "amount" not in ing:
                errors.append(f"ingredient[{i}] missing amount")
            if "unit" not in ing:
                errors.append(f"ingredient[{i}] missing unit")

    if not recipe.get("instructions"):
        errors.append("instructions must not be empty")

    return errors


def check_ollama_reachable() -> bool:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def compose_recipe(raw_recipes: list[dict], category: str) -> dict[str, Any] | None:
    prompt = build_prompt(raw_recipes, category)

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 1800,  # cap tokens — generous enough for a full recipe JSON
                },
            },
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"  [compose] Ollama request failed: {e}")
        return None

    raw_text = response.json().get("response", "")

    # Strip markdown fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    # Replace fraction literals (e.g. 1/2 → 0.5) that LLMs emit but JSON rejects
    text = re.sub(r'\b(\d+)/(\d+)\b', lambda m: str(int(m.group(1)) / int(m.group(2))), text)

    try:
        recipe = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  [compose] JSON parse failed: {e}")
        print(f"  [compose] Raw response: {raw_text[:500]}")
        return None

    errors = validate_recipe(recipe)
    if errors:
        print(f"  [compose] Validation failed for '{recipe.get('title', '?')}': {errors}")
        return None

    return recipe
