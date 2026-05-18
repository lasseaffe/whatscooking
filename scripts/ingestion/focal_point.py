"""Focal point detection for recipe images.

Providers:
  - "saliency" (default) - OpenCV Spectral Residual saliency. Free, local, ~1s/image.
  - "claude"             - Anthropic Claude Haiku Vision. Cloud, costs ~$0.001/image.
  - "ollama"             - Local Qwen2.5-VL via Ollama. Free but 7B model hedges to 50/50.

Select via WC_FOCAL_PROVIDER env var or the `provider` keyword arg.
"""

import base64
import json
import os
from typing import Callable

import httpx

_PROMPT = (
    "Look at this food photo. Find the center of the most prominent food item "
    "(the dish, plate, or main subject - ignore background, hands, utensils, "
    "garnishes around the edges). "
    "Return ONLY this JSON, with no other text: "
    '{"x": <int 0-100>, "y": <int 0-100>}\n\n'
    "Rules:\n"
    "- x = horizontal position from LEFT (0) to RIGHT (100)\n"
    "- y = vertical position from TOP (0) to BOTTOM (100)\n"
    "- Be specific. If the food is in the upper-left, return values like x=30, y=30.\n"
    "- Only use exactly 50, 50 if the food truly fills the frame perfectly centered.\n"
    "- Most food photos have the dish slightly above center (y around 55-70)."
)

# Sentinel returned on any error — callers can detect this to count failures.
_FALLBACK = (50, 60)


# -- Shared helpers ------------------------------------------------

def _download_image(url: str) -> tuple[bytes, str]:
    """Download image; return (bytes, media_type). Raises on HTTP error."""
    resp = httpx.get(url, timeout=10, follow_redirects=True)
    resp.raise_for_status()
    media_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
    if media_type not in {"image/jpeg", "image/png", "image/gif", "image/webp"}:
        media_type = "image/jpeg"
    return resp.content, media_type


def _parse_xy(text: str) -> tuple[int, int]:
    """Parse {x, y} JSON (tolerating markdown fences and trailing prose)."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1].lstrip("json").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    data = json.loads(text)
    x = max(0, min(100, int(data["x"])))
    y = max(0, min(100, int(data["y"])))
    return x, y


# -- Provider: OpenCV saliency (free, local, no LLM) ---------------

def _detect_saliency(image_url: str) -> tuple[int, int]:
    """Compute saliency map, return centroid of high-saliency region as (x%, y%)."""
    import cv2
    import numpy as np

    img_bytes, _ = _download_image(image_url)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError("could not decode image")

    h, w = img.shape[:2]

    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, smap = saliency.computeSaliency(img)
    if not success:
        raise RuntimeError("saliency computation failed")

    smap = (smap * 255).astype(np.uint8)
    threshold = np.percentile(smap, 75)
    mask = (smap >= threshold).astype(np.float32)
    weighted = smap.astype(np.float32) * mask

    total = weighted.sum()
    if total < 1e-6:
        return 50, 50

    ys, xs = np.indices(weighted.shape)
    cx = (xs * weighted).sum() / total
    cy = (ys * weighted).sum() / total

    x_pct = int(round(cx / w * 100))
    y_pct = int(round(cy / h * 100))
    return max(0, min(100, x_pct)), max(0, min(100, y_pct))


# -- Provider: Claude Haiku Vision --------------------------------

def _detect_claude(image_url: str) -> tuple[int, int]:
    from anthropic import Anthropic

    client = Anthropic()
    img_bytes, media_type = _download_image(image_url)
    b64 = base64.standard_b64encode(img_bytes).decode()

    result = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=64,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": media_type, "data": b64},
                },
                {"type": "text", "text": _PROMPT},
            ],
        }],
    )
    return _parse_xy(result.content[0].text)


# -- Provider: Ollama (local Qwen2.5-VL) --------------------------

_OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434/v1/chat/completions")
_OLLAMA_MODEL = os.environ.get("WC_FOCAL_OLLAMA_MODEL", "qwen2.5vl:7b")
_OLLAMA_TIMEOUT = float(os.environ.get("WC_FOCAL_OLLAMA_TIMEOUT", "600"))


def _detect_ollama(image_url: str) -> tuple[int, int]:
    img_bytes, media_type = _download_image(image_url)
    b64 = base64.standard_b64encode(img_bytes).decode()
    data_url = f"data:{media_type};base64,{b64}"

    payload = {
        "model": _OLLAMA_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": _PROMPT},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }],
        "max_tokens": 64,
        "temperature": 0.0,
    }
    resp = httpx.post(_OLLAMA_URL, json=payload, timeout=_OLLAMA_TIMEOUT)
    resp.raise_for_status()
    body = resp.json()
    text = body["choices"][0]["message"]["content"]
    return _parse_xy(text)


def warm_up_ollama() -> bool:
    """Preload the vision model so the first inference doesn't time out."""
    print(f"[focal_point] warming up {_OLLAMA_MODEL} (first load can take ~60s)...")
    try:
        payload = {
            "model": _OLLAMA_MODEL,
            "messages": [{"role": "user", "content": "ok"}],
            "max_tokens": 1,
        }
        resp = httpx.post(_OLLAMA_URL, json=payload, timeout=_OLLAMA_TIMEOUT)
        resp.raise_for_status()
        print("[focal_point] warm-up done")
        return True
    except Exception as e:
        print(f"[focal_point] warm-up failed: {e}")
        return False


# -- Public entry point -------------------------------------------

_PROVIDERS: dict[str, Callable[[str], tuple[int, int]]] = {
    "saliency": _detect_saliency,
    "claude": _detect_claude,
    "ollama": _detect_ollama,
}


def detect_focal_point(image_url: str, provider: str | None = None) -> tuple[int, int]:
    """Returns (focal_x, focal_y) as 0-100 percentages. Falls back to (50, 60) on error.

    Provider precedence: explicit arg -> WC_FOCAL_PROVIDER env -> "saliency".
    """
    name = (provider or os.environ.get("WC_FOCAL_PROVIDER") or "saliency").lower()
    fn = _PROVIDERS.get(name)
    if fn is None:
        print(f"[focal_point] unknown provider '{name}', falling back to default")
        return _FALLBACK
    try:
        return fn(image_url)
    except Exception as e:
        print(f"[focal_point] {name} failed for {image_url}: {e}")
        return _FALLBACK
