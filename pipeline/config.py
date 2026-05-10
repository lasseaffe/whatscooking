import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

# Ollama
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"
OLLAMA_TIMEOUT = 600

# Schedule → strategy name lists
SCHEDULE_DAILY = ["trending", "seasonal"]
SCHEDULE_WEEKLY = ["standard", "haute", "superfood", "mealplan"]

# How many composed recipes each strategy produces per run
RECIPES_PER_STRATEGY = {
    "trending": 5,
    "seasonal": 4,
    "haute": 4,
    "superfood": 4,
    "mealplan": 7,
    "standard": 4,
}

# Listing page URLs per strategy (Playwright navigates these to collect recipe links)
CATEGORY_LISTING_URLS = {
    "standard": {
        "main-course":   {"Bon Appétit": "https://www.bonappetit.com/search?q=main+course+dinner&content=recipe"},
        "pasta":         {"Bon Appétit": "https://www.bonappetit.com/search?q=pasta&content=recipe"},
        "soup":          {"Bon Appétit": "https://www.bonappetit.com/search?q=soup&content=recipe"},
        "salad":         {"Bon Appétit": "https://www.bonappetit.com/search?q=salad&content=recipe"},
        "breakfast":     {"Bon Appétit": "https://www.bonappetit.com/search?q=breakfast&content=recipe"},
        "dessert":       {"Bon Appétit": "https://www.bonappetit.com/search?q=dessert&content=recipe"},
        "vegetarian":    {"Bon Appétit": "https://www.bonappetit.com/search?q=vegetarian&content=recipe"},
        "vegan":         {"Bon Appétit": "https://www.bonappetit.com/search?q=vegan&content=recipe"},
        "asian":         {"Bon Appétit": "https://www.bonappetit.com/search?q=asian&content=recipe"},
        "mediterranean": {"Bon Appétit": "https://www.bonappetit.com/search?q=mediterranean&content=recipe"},
        "mexican":       {"Bon Appétit": "https://www.bonappetit.com/search?q=mexican&content=recipe"},
        "comfort-food":  {"Bon Appétit": "https://www.bonappetit.com/search?q=comfort+food&content=recipe"},
    },
    "haute": [
        "https://www.greatbritishchefs.com/collections/fine-dining-recipes",
        "https://www.seriouseats.com/techniques",
    ],
    "superfood": [
        "https://www.allrecipes.com/search?q={ingredient}",
        "https://www.seriouseats.com/search?q={ingredient}",
    ],
    "trending": [
        "https://www.allrecipes.com/search?q={term}",
        "https://www.seriouseats.com/search?q={term}",
    ],
    "seasonal": [
        "https://www.allrecipes.com/search?q={ingredient}",
        "https://cooking.nytimes.com/search?q={ingredient}",
    ],
}

# Standard strategy category rotation
STANDARD_CATEGORIES_ROTATION = [
    "main-course", "pasta", "soup", "salad", "breakfast", "dessert",
    "vegetarian", "vegan", "asian", "mediterranean", "mexican", "comfort-food",
]
CATEGORIES_PER_RUN = 4

# Superfood nutrient rotation
SUPERFOOD_NUTRIENT_ROTATION = [
    "fiber", "omega-3", "antioxidants", "iron", "calcium", "vitamin-c",
]

# US harvest calendar: month (1-12) → in-season produce
HARVEST_CALENDAR = {
    1:  ["citrus", "kale", "sweet potato", "winter squash"],
    2:  ["citrus", "kale", "leeks", "turnips"],
    3:  ["asparagus", "artichokes", "spinach", "leeks"],
    4:  ["asparagus", "peas", "radishes", "spring onions"],
    5:  ["strawberries", "peas", "asparagus", "lettuce"],
    6:  ["strawberries", "blueberries", "zucchini", "cucumber"],
    7:  ["tomatoes", "corn", "peaches", "blueberries"],
    8:  ["tomatoes", "eggplant", "peppers", "watermelon"],
    9:  ["apples", "pears", "butternut squash", "sweet corn"],
    10: ["pumpkin", "apples", "Brussels sprouts", "sweet potato"],
    11: ["cranberries", "kale", "parsnips", "turnips"],
    12: ["citrus", "pomegranate", "Brussels sprouts", "winter squash"],
}

# Rotation state file
ROTATION_STATE_FILE = "pipeline/rotation_state.json"

# Logs directory
LOGS_DIR = "pipeline/logs"

# Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

# USDA FDC (free API key — register at api.nal.usda.gov)
USDA_FDC_API_KEY = os.getenv("USDA_FDC_API_KEY", "")
