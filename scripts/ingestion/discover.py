import time
from functools import lru_cache
from typing import Optional
from duckduckgo_search import DDGS
from googleapiclient.discovery import build


@lru_cache(maxsize=None)
def _get_google_service(api_key: str):
    return build("customsearch", "v1", developerKey=api_key)


def _google_search(query: str, domain: str, api_key: str, cse_id: str, num: int = 10) -> list[str]:
    service = _get_google_service(api_key)
    result = service.cse().list(
        q=f"site:{domain} {query}",
        cx=cse_id,
        num=min(num, 10),
    ).execute()
    items = result.get("items", [])
    return [item["link"] for item in items]


def _ddg_search(query: str, domain: str, num: int = 10, retries: int = 3) -> list[str]:
    for attempt in range(retries):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(
                    f"site:{domain} {query}",
                    max_results=num,
                ))
            time.sleep(3)
            return [r["href"] for r in results if domain in r.get("href", "")]
        except Exception as e:
            wait = 10 * (attempt + 1)
            print(f"[discover] DDG error (attempt {attempt + 1}/{retries}): {e} — retrying in {wait}s")
            time.sleep(wait)
    print(f"[discover] DDG gave up for query: {query}")
    return []


def discover_urls(
    source: dict,
    google_api_key: Optional[str],
    google_cse_id: Optional[str],
    per_query_limit: int = 10,
) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    use_google = bool(google_api_key and google_cse_id)
    google_budget = source.get("google_budget", 0) if use_google else 0

    for i, query in enumerate(source["queries"]):
        if i < google_budget and use_google:
            try:
                found = _google_search(query, source["domain"], google_api_key, google_cse_id, per_query_limit)
            except Exception as e:
                print(f"[discover] Google failed for '{query}': {e}, falling back to DDG")
                found = _ddg_search(query, source["domain"], per_query_limit)
        else:
            found = _ddg_search(query, source["domain"], per_query_limit)

        for url in found:
            if url not in seen:
                seen.add(url)
                urls.append(url)

    return urls
