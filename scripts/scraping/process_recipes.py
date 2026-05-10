"""
process_recipes.py

Reads recipes.json, rewrites each description via Llama 3.2:3B through
Ollama (local, free), and saves results to processed_recipes/

Ollama is used instead of loading the model directly — no GPU memory needed,
no transformers/torch install required.

Usage:
    python scripts/scraping/process_recipes.py
    python scripts/scraping/process_recipes.py --input my_recipes.json

Requires Ollama running at localhost:11434 with llama3.2:3b pulled.
"""

import argparse
import json
import os
import urllib.request
import urllib.error
from datetime import datetime

# llama.cpp server — start with: llama-server -m <model.gguf> -c 2048 --port 8080
LLAMA_URL   = "http://localhost:8080/v1/chat/completions"
AI_MODEL    = "llama-3.2-3b"   # label only; llama.cpp uses whatever GGUF is loaded
DESC_MAX_CHARS = 400            # keep prompt within -c 2048 context window
OUTPUT_DIR  = "processed_recipes"
DATE_FORMAT = "%Y-%m-%d_%H-%M-%S"


def rewrite_description(description: str) -> str:
    snippet = description[:DESC_MAX_CHARS]
    prompt = (
        "Rewrite in 2 sentences, cookbook tone, no first person, no hashtags.\n"
        f"Description: {snippet}"
    )
    payload = json.dumps({
        "model": AI_MODEL,
        "stream": False,
        "max_tokens": 120,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()

    req = urllib.request.Request(
        LLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:  # no timeout — let llama.cpp finish
            data = json.loads(resp.read())
        return (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
    except urllib.error.URLError as e:
        print(f"  ⚠️  llama.cpp request failed: {e}")
        return description


def save_to_markdown(recipes: list, timestamp: str) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = os.path.join(OUTPUT_DIR, f"recipes_{timestamp}.md")
    with open(filename, "w", encoding="utf-8") as f:
        f.write("# Processed Recipes\n\n")
        for recipe in recipes:
            f.write(f"## {recipe['title']}\n\n")
            f.write(f"**Description:**\n{recipe['description']}\n\n")
            f.write(f"**Processed Description:**\n{recipe['processed_description']}\n\n")
    print(f"Saved processed recipes to {filename}")


def main():
    parser = argparse.ArgumentParser(description="Rewrite recipe descriptions via Ollama")
    parser.add_argument("--input", default="recipes.json")
    args = parser.parse_args()

    try:
        with open(args.input, "r", encoding="utf-8") as f:
            recipes = json.load(f)
    except Exception as e:
        print(f"❌ Error loading recipe data: {e}")
        return

    # Check llama.cpp server is up before doing any work
    try:
        urllib.request.urlopen("http://localhost:8080/health", timeout=5)
    except urllib.error.URLError:
        print("⚠️  llama.cpp server not running at localhost:8080.")
        print("    Start with: llama-server -m <model.gguf> -c 2048 --host 0.0.0.0 --port 8080")
        return

    print(f"🤖 llama.cpp @ :8080 — processing {len(recipes)} recipes (input capped at {DESC_MAX_CHARS} chars)\n")

    processed = []
    for i, recipe in enumerate(recipes):
        title = recipe.get("title", "Unknown")
        print(f"[{i + 1}/{len(recipes)}] {title}")
        try:
            processed_desc = rewrite_description(recipe.get("description", ""))
            recipe["processed_description"] = processed_desc
            processed.append(recipe)
        except Exception as e:
            print(f"  ⚠️  Error: {e}")

    timestamp = datetime.now().strftime(DATE_FORMAT)
    save_to_markdown(processed, timestamp)


if __name__ == "__main__":
    main()
