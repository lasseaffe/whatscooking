from pipeline.config import SUPABASE_URL, SUPABASE_KEY


def get_existing_urls() -> set[str]:
    """Fetch all curated source_urls already in Supabase to skip duplicates."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = client.table("recipes").select("source_url").eq("source", "curated").execute()
        return {row["source_url"] for row in result.data if row.get("source_url")}
    except Exception as e:
        print(f"  [dedup] Supabase check failed: {e}")
        return set()
