### TASK: RECIPE INGESTION ENGINE FOR "WHAT'S COOKIN"

I need you to build a Python-based scraper that extracts recipes and pushes them to my Supabase 'recipes' table.

1. **Database Schema**: 
Ensure the Supabase 'recipes' table has these columns: 
- id (uuid), title (text), ingredients (jsonb), instructions (text), 
- source_url (text, unique), category (text), difficulty (text), 
- prep_time (int), image_url (text).

2. **Scraping Logic**:
- Target URLs: [INSERT LIST OF URLS HERE, e.g., https://www.greatbritishchefs.com/recipes, https://smittenkitchen.com/recipes/]
- Use the `recipe-scrapers` Python library or `BeautifulSoup` to find 'ld+json' metadata. 
- Map the JSON-LD fields (recipeIngredient, recipeInstructions, totalTime, etc.) to the database columns.

3. **Supabase Integration**:
- Use the Supabase Python client.
- Implement an 'upsert' logic using 'source_url' as the unique key to prevent duplicate entries.
- If a recipe is from Great British Chefs, tag it as 'Haute Cuisine'. If from Smitten Kitchen, tag as 'Classic'.

4. **Execution**:
- Create a script named `cookin_scraper.py`.
- Add basic error handling for 403 Forbidden errors (use a standard User-Agent header).
- Run the scraper for the first 5 recipes of each site to test, then output the success status.

Please initialize the database schema first if it doesn't exist, then write and run the code.