import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2"
OLLAMA_TIMEOUT = 120  # seconds

CATEGORIES_PER_RUN = 4
RECIPES_PER_CATEGORY = 2  # scraped sources; LLM composites 1 per category

CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad",
    "breakfast", "dessert", "vegetarian", "vegan",
    "asian", "mediterranean", "mexican", "comfort-food",
]

# Per-category search URLs for each source site
CATEGORY_URLS = {
    "main-course": {
        "AllRecipes": "https://www.allrecipes.com/recipes/80/main-dish/",
        "Serious Eats": "https://www.seriouseats.com/mains-recipes-5117806",
    },
    "pasta": {
        "AllRecipes": "https://www.allrecipes.com/recipes/95/main-dish/pasta/",
        "Serious Eats": "https://www.seriouseats.com/pasta-recipes-5117824",
    },
    "soup": {
        "AllRecipes": "https://www.allrecipes.com/recipes/94/soups-stews-and-chili/",
        "Serious Eats": "https://www.seriouseats.com/soup-recipes-5117827",
    },
    "salad": {
        "AllRecipes": "https://www.allrecipes.com/recipes/96/salad/",
        "Serious Eats": "https://www.seriouseats.com/salad-recipes-5117825",
    },
    "breakfast": {
        "AllRecipes": "https://www.allrecipes.com/recipes/78/breakfast-and-brunch/",
        "Serious Eats": "https://www.seriouseats.com/breakfast-and-brunch-recipes-5117807",
    },
    "dessert": {
        "AllRecipes": "https://www.allrecipes.com/recipes/79/desserts/",
        "Serious Eats": "https://www.seriouseats.com/dessert-recipes-5117811",
    },
    "vegetarian": {
        "AllRecipes": "https://www.allrecipes.com/recipes/87/everyday-cooking/vegetarian/",
        "Serious Eats": "https://www.seriouseats.com/vegetarian-recipes-5117830",
    },
    "vegan": {
        "AllRecipes": "https://www.allrecipes.com/recipes/1116/everyday-cooking/vegan/",
        "Serious Eats": "https://www.seriouseats.com/vegan-recipes-5117829",
    },
    "asian": {
        "AllRecipes": "https://www.allrecipes.com/recipes/233/world-cuisine/asian/",
        "Serious Eats": "https://www.seriouseats.com/asian-recipes-5117804",
    },
    "mediterranean": {
        "AllRecipes": "https://www.allrecipes.com/recipes/723/world-cuisine/european/greek/",
        "Serious Eats": "https://www.seriouseats.com/mediterranean-recipes-5117820",
    },
    "mexican": {
        "AllRecipes": "https://www.allrecipes.com/recipes/728/world-cuisine/latin-american/mexican/",
        "Serious Eats": "https://www.seriouseats.com/mexican-recipes-5117821",
    },
    "comfort-food": {
        "AllRecipes": "https://www.allrecipes.com/recipes/1642/everyday-cooking/",
        "Serious Eats": "https://www.seriouseats.com/comfort-food-recipes-5117809",
    },
}

OUTPUT_DIR = "pipeline/output"
ROTATION_STATE_FILE = "pipeline/rotation_state.json"

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
