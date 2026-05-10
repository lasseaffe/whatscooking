import json
import os
from datetime import datetime
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Configuration
MODEL_NAME = "Qwen/Qwen3-8B"  # Replace with your model path or Hugging Face ID
INPUT_FILE = "recipes.json"    # File containing raw recipe data
OUTPUT_DIR = "processed_recipes"  # Directory to save markdown files
DATE_FORMAT = "%Y-%m-%d_%H-%M-%S"

def load_model():
    """Load the Qwen3:8B model and tokenizer."""
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16)
    model.eval()
    return tokenizer, model

def process_description(tokenizer, model, description):
    """Process a recipe description using the model."""
    inputs = tokenizer(description, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=100, num_return_sequences=1)
    processed_description = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return processed_description

def save_to_markdown(recipes, timestamp):
    """Save processed recipes to markdown files."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = f"{OUTPUT_DIR}/recipes_{timestamp}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write("# Processed Recipes\n\n")
        for recipe in recipes:
            f.write(f"## {recipe['title']}\n\n")
            f.write(f"**Description:**\n{recipe['description']}\n\n")
            f.write(f"**Processed Description:**\n{recipe['processed_description']}\n\n")
    print(f"Saved processed recipes to {filename}")

def main():
    # Load recipe data
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            recipes = json.load(f)
    except Exception as e:
        print(f"❌ Error loading recipe data: {e}")
        return

    # Load model
    try:
        tokenizer, model = load_model()
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return

    # Process each recipe
    processed_recipes = []
    for recipe in recipes:
        try:
            processed_desc = process_description(tokenizer, model, recipe["description"])
            recipe["processed_description"] = processed_desc
            processed_recipes.append(recipe)
        except Exception as e:
            print(f"⚠️ Error processing recipe '{recipe.get('title', 'Unknown')}': {e}")

    # Save to markdown
    timestamp = datetime.now().strftime(DATE_FORMAT)
    save_to_markdown(processed_recipes, timestamp)

if __name__ == "__main__":
    main()