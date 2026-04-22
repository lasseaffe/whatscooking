"""
Run once to add source_url and category columns to the recipes table.
Safe to re-run — uses IF NOT EXISTS.
"""

SQL = """
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url text UNIQUE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category text;
"""

print("Run the following SQL in the Supabase SQL Editor (https://supabase.com/dashboard):")
print()
print(SQL)
print()
print("Migration assumed complete.")
