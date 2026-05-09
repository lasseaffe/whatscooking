"""
enrich.py — AI enrichment for scraped recipes using Ollama (local, free).

Adds description, dish_types, and dietary_tags to a recipe dict.
Uses llama3.2:1b — fast and sufficient for this short structured output task.
"""

import json
import re
import time
import urllib.request
import urllib.error

LLAMA_CPP_URL = "http://localhost:8080/v1/chat/completions"
# label only; llama.cpp uses whatever model is loaded at server start
AI_MODEL = "llama-3.2-1b"

DISH_TYPE_OPTIONS = [
    "breakfast", "lunch", "dinner", "snack", "dessert",
    "appetizer", "salad", "soup", "side", "drink",
]
DIETARY_TAG_OPTIONS = [
    "vegan", "vegetarian", "gluten-free", "dairy-free",
    "nut-free", "low-carb", "high-protein", "keto", "paleo",
]

PROMPT_TEMPLATE = """\
You are a recipe editor. Given a dish name and ingredients, return a JSON object with:
- "description": 2-3 sentences (40-55 words). Lead with flavour and texture. No hashtags, \
no social media language, no first person (I/we/my). Tone: editorial cookbook.
- "dish_types": array of zero or more from {dish_types}
- "dietary_tags": array of zero or more from {dietary_tags}

Dish: {title}
Ingredients: {ingredients}

Return ONLY valid JSON — no markdown, no code fences."""


def _call_llm(prompt: str) -> str:
    payload = json.dumps({
        "model": AI_MODEL,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
    }).encode()

    req = urllib.request.Request(
        LLAMA_CPP_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:  # no timeout — let it run to completion
        data = json.loads(resp.read())
    return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()


def _is_llm_available() -> bool:
    try:
        urllib.request.urlopen("http://localhost:8080/health", timeout=3)
        return True
    except urllib.error.URLError:
        return False


def enrich_recipe(recipe: dict) -> dict:
    """
    Return a copy of `recipe` with description, dish_types, and dietary_tags
    filled in via Ollama. On any failure returns recipe unchanged.
    """
    if not _is_llm_available():
        return recipe

    title = recipe.get("title", "")
    if not title:
        return recipe

    ingredients_raw = recipe.get("ingredients", [])
    ingredient_names = [
        (i.get("name") or i) if isinstance(i, dict) else str(i)
        for i in ingredients_raw[:12]
    ]
    ingredients_str = ", ".join(ingredient_names) if ingredient_names else "unknown"

    prompt = PROMPT_TEMPLATE.format(
        title=title,
        ingredients=ingredients_str,
        dish_types=", ".join(DISH_TYPE_OPTIONS),
        dietary_tags=", ".join(DIETARY_TAG_OPTIONS),
    )

    for attempt in range(3):
        try:
            raw = _call_llm(prompt)
            raw = re.sub(r"```[a-z]*\n?", "", raw).strip().strip("`").strip()
            data = json.loads(raw)

            enriched = dict(recipe)
            if data.get("description") and len(str(data["description"]).strip()) > 20:
                enriched["description"] = str(data["description"]).strip()
            if isinstance(data.get("dish_types"), list):
                enriched["dish_types"] = [
                    t for t in data["dish_types"] if t in DISH_TYPE_OPTIONS
                ]
            if isinstance(data.get("dietary_tags"), list):
                enriched["dietary_tags"] = [
                    t for t in data["dietary_tags"] if t in DIETARY_TAG_OPTIONS
                ]
            return enriched

        except json.JSONDecodeError:
            time.sleep(1)
        except Exception as exc:
            print(f"[enrich] {title!r} attempt {attempt + 1} failed: {exc}")
            time.sleep(2)

    print(f"[enrich] All attempts failed for {title!r} — skipping enrichment")
    return recipe
