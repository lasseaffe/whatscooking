import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
OLLAMA_TIMEOUT = 600  # seconds — llama3.1:8b can be slow on CPU

CATEGORIES_PER_RUN = 4
RECIPES_PER_CATEGORY = 2  # scraped sources; LLM composites 1 per category

CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad",
    "breakfast", "dessert", "vegetarian", "vegan",
    "asian", "mediterranean", "mexican", "comfort-food",
]

# Per-category search URLs — Bon Appétit search (no Cloudflare, reliable ld+json)
CATEGORY_URLS = {
    "main-course": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=main+course+dinner&content=recipe",
    },
    "pasta": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=pasta&content=recipe",
    },
    "soup": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=soup&content=recipe",
    },
    "salad": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=salad&content=recipe",
    },
    "breakfast": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=breakfast&content=recipe",
    },
    "dessert": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=dessert&content=recipe",
    },
    "vegetarian": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=vegetarian&content=recipe",
    },
    "vegan": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=vegan&content=recipe",
    },
    "asian": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=asian&content=recipe",
    },
    "mediterranean": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=mediterranean&content=recipe",
    },
    "mexican": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=mexican&content=recipe",
    },
    "comfort-food": {
        "Bon Appétit": "https://www.bonappetit.com/search?q=comfort+food&content=recipe",
    },
}

OUTPUT_DIR = "pipeline/output"
ROTATION_STATE_FILE = "pipeline/rotation_state.json"

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
