import json
import re
import requests
from typing import Any

from pipeline.config import OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
from pipeline.lib.validate import validate_recipe

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


def check_ollama_reachable() -> bool:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def call_ollama(prompt: str) -> dict[str, Any] | None:
    """Send prompt to Ollama, parse JSON response, return validated recipe dict or None."""
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 1800},
            },
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
    except Exception as e:
        print(f"  [compose] Ollama request failed: {e}")
        return None

    raw_text = response.json().get("response", "")
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()

    text = re.sub(r'\b(\d+)/(\d+)\b', lambda m: str(int(m.group(1)) / int(m.group(2))), text)

    try:
        recipe = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  [compose] JSON parse failed: {e}")
        print(f"  [compose] Raw: {raw_text[:500]}")
        return None

    errors = validate_recipe(recipe)
    if errors:
        print(f"  [compose] Validation failed for '{recipe.get('title', '?')}': {errors}")
        return None

    return recipe


def build_composite_prompt(raw_recipes: list[dict], category: str, extra_instruction: str = "") -> str:
    sources_text = ""
    for i, r in enumerate(raw_recipes, 1):
        sources_text += f"\n--- Source {i}: {r.get('source_name', 'Unknown')} ---\n"
        sources_text += f"Title: {r['title']}\n"
        sources_text += f"Ingredients: {', '.join(r.get('ingredients', []))}\n"
        instructions = r.get('instructions', [])
        sources_text += f"Instructions: {' '.join(instructions[:5])}\n"
        sources_text += f"URL: {r.get('source_url', '')}\n"

    extra = f"\nAdditional instruction: {extra_instruction}" if extra_instruction else ""

    return f"""You are a professional recipe developer creating composite recipes for a meal planning app.

I have scraped {len(raw_recipes)} real {category} recipes from cooking websites. Your task is to create ONE new composite recipe inspired by the best techniques and ingredients from these sources. Do NOT copy any single recipe — combine the best ideas into something new.
{sources_text}{extra}

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
