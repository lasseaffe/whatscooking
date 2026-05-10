"""
hero_shot.py — Extract the most visually appealing frame from an Instagram Reel.

Usage:
    python hero_shot.py <instagram_url> [--out thumbnail.jpg]

Dependencies: yt-dlp, opencv-python, numpy
"""

import argparse
import math
import os
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

try:
    import yt_dlp
except ImportError:
    sys.exit("Missing dependency: pip install yt-dlp")


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def laplacian_sharpness(frame: np.ndarray) -> float:
    """Variance of the Laplacian — higher means sharper edges."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def hasler_colorfulness(frame: np.ndarray) -> float:
    """
    Hasler & Süsstrunk (2003) colorfulness metric.
    Returns a score where >100 is vibrant, <30 is dull.
    """
    b, g, r = cv2.split(frame.astype(np.float32))
    rg = r - g
    yb = 0.5 * (r + g) - b
    sigma_rgyb = math.sqrt(rg.std() ** 2 + yb.std() ** 2)
    mu_rgyb = math.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    return sigma_rgyb + 0.3 * mu_rgyb


def luminance_score(frame: np.ndarray) -> float:
    """
    Returns a score that peaks at mid-brightness and falls off toward
    pure black (fade-in) or pure white (washed out). Range [0, 1].
    """
    mean_brightness = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).mean() / 255.0
    # Gaussian centred at 0.45 (slightly below mid-tone — food photography)
    return math.exp(-((mean_brightness - 0.45) ** 2) / (2 * 0.25 ** 2))


def edge_density(frame: np.ndarray) -> float:
    """Fraction of pixels that are strong edges (Canny). More edges = more detail."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    return edges.mean()


def beauty_score(frame: np.ndarray) -> float:
    """Composite score. Weights tuned empirically for food photography."""
    sharpness = laplacian_sharpness(frame)
    color = hasler_colorfulness(frame)
    lum = luminance_score(frame)
    edges = edge_density(frame)

    # Normalise sharpness & color to roughly [0, 1] with soft ceilings
    sharpness_n = min(sharpness / 500.0, 1.0)
    color_n = min(color / 80.0, 1.0)
    edges_n = min(edges / 20.0, 1.0)

    return 0.40 * sharpness_n + 0.35 * color_n + 0.15 * lum + 0.10 * edges_n


# ---------------------------------------------------------------------------
# Smart crop
# ---------------------------------------------------------------------------

def center_square_crop(frame: np.ndarray, target_size: int = 1080) -> np.ndarray:
    """
    Crop a 9:16 vertical frame to a 1:1 square using a simple saliency heuristic:
    find the vertical band with the highest Laplacian energy and centre the crop there.
    """
    h, w = frame.shape[:2]

    if w >= h:
        # Already landscape / square — just resize
        side = min(h, w)
        x0 = (w - side) // 2
        cropped = frame[:, x0:x0 + side]
    else:
        # Vertical frame (typical Reel)
        side = w  # square side = full width
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        lap = np.abs(cv2.Laplacian(gray.astype(np.float32), cv2.CV_32F))

        # Score each possible top-y for the square window
        best_y, best_energy = 0, -1.0
        for y in range(0, h - side + 1, max(1, side // 20)):
            energy = float(lap[y:y + side, :].mean())
            if energy > best_energy:
                best_energy = energy
                best_y = y

        cropped = frame[best_y:best_y + side, :]

    return cv2.resize(cropped, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)


# ---------------------------------------------------------------------------
# Core extraction
# ---------------------------------------------------------------------------

def extract_hero_frame(
    video_path: str,
    sample_every: int = 5,
    output_path: str | None = None,
    target_size: int = 1080,
    jpeg_quality: int = 75,
) -> tuple[float, str]:
    """
    Scan `video_path`, score every `sample_every`-th frame, and save the best
    as a JPEG.

    Returns (timestamp_seconds, output_path).
    Raises RuntimeError on failure.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    best_score = -1.0
    best_frame: np.ndarray | None = None
    best_frame_idx = total_frames // 2  # fallback: middle frame

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_every == 0:
            score = beauty_score(frame)
            if score > best_score:
                best_score = score
                best_frame = frame.copy()
                best_frame_idx = frame_idx
        frame_idx += 1

    cap.release()

    if best_frame is None:
        raise RuntimeError("No frames could be read from video.")

    timestamp = best_frame_idx / fps
    cropped = center_square_crop(best_frame, target_size=target_size)

    if output_path is None:
        output_path = str(Path(video_path).with_suffix(".jpg"))

    encode_params = [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality]
    cv2.imwrite(output_path, cropped, encode_params)

    return timestamp, output_path


# ---------------------------------------------------------------------------
# Download helper
# ---------------------------------------------------------------------------

def download_reel(url: str, download_dir: str, cookies_from_browser: str | None = None, cookies_file: str | None = None) -> str:
    """
    Download an Instagram Reel using yt-dlp. Returns local file path.

    Instagram requires authentication. Pass cookies_from_browser="chrome" (or "firefox",
    "edge") to borrow your logged-in session automatically.
    """
    ydl_opts = {
        "outtmpl": os.path.join(download_dir, "%(id)s.%(ext)s"),
        "format": "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "quiet": True,
        "no_warnings": False,
    }
    if cookies_from_browser:
        ydl_opts["cookiesfrombrowser"] = (cookies_from_browser,)
    if cookies_file:
        ydl_opts["cookiefile"] = cookies_file

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        if info is None:
            raise RuntimeError(
                "yt-dlp returned no info.\n"
                "Instagram requires a logged-in session. Re-run with:\n"
                "  python hero_shot.py <url> --cookies-from-browser chrome\n"
                "(Use 'firefox' or 'edge' if that's your browser.)"
            )
        filename = ydl.prepare_filename(info)

    if not os.path.exists(filename):
        candidates = list(Path(download_dir).glob(f"{info['id']}.*"))
        if not candidates:
            raise RuntimeError(f"Downloaded file not found in {download_dir}")
        filename = str(candidates[0])

    return filename


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract a hero thumbnail from an Instagram Reel."
    )
    parser.add_argument("url", help="Instagram Reel URL")
    parser.add_argument("--out", default="thumbnail.jpg", help="Output JPEG path")
    parser.add_argument("--size", type=int, default=1080, help="Output square size in px")
    parser.add_argument("--quality", type=int, default=75, help="JPEG quality (1-100)")
    parser.add_argument("--sample-every", type=int, default=5, help="Sample every N frames")
    parser.add_argument(
        "--cookies-from-browser",
        default=None,
        metavar="BROWSER",
        help="Borrow Instagram cookies from your browser (chrome, firefox, edge). Requires browser to be closed.",
    )
    parser.add_argument(
        "--cookies",
        default=None,
        metavar="FILE",
        help="Path to a Netscape-format cookies.txt file exported from your browser.",
    )
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmpdir:
        print(f"Downloading: {args.url}")
        try:
            video_path = download_reel(
                args.url, tmpdir,
                cookies_from_browser=args.cookies_from_browser,
                cookies_file=args.cookies,
            )
        except Exception as exc:
            sys.exit(f"Download failed: {exc}")

        print("Scoring frames…")
        try:
            ts, out = extract_hero_frame(
                video_path,
                sample_every=args.sample_every,
                output_path=args.out,
                target_size=args.size,
                jpeg_quality=args.quality,
            )
        except Exception as exc:
            sys.exit(f"Frame extraction failed: {exc}")

    print(f"Done — best frame at {ts:.2f}s → {out}")


if __name__ == "__main__":
    main()
