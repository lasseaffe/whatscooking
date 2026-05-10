# Goal
Build a Python script that downloads an Instagram Reel and uses Computer Vision to automatically select and save the single most "visually appealing" frame to use as a recipe thumbnail.

# Technical Requirements
1. **Extraction:** Use `yt-dlp` to download the video from a provided Instagram URL.
2. **Framing:** Use `cv2` (OpenCV) to sample the video at 5-frame intervals.
3. **The Scoring Algorithm:** For each sampled frame, calculate a "Beauty Score" based on:
    - **Sharpness (Laplacian Variance):** Eliminate motion blur. Higher variance = sharper focus.
    - **Colorfulness (Hasler-Suesstrunk metric):** Food thumbnails need to be vibrant. Prefer frames with high saturation.
    - **Luminance (Brightness):** Discard frames that are too dark (fade-ins) or washed out.
    - **Composition (Edge Density):** Prefer frames with defined shapes (the plate/food) over flat backgrounds.

# Output
- A standalone script `hero_shot.py`.
- Function `extract_hero_frame(video_path)` that returns the timestamp of the highest-scoring frame.
- A final `.jpg` output optimized for web use (e.g., 1080px width, 75% quality).

# Safety & Reliability
- Include a "fallback" to the middle frame if the scoring algorithm fails.
- Handle "private video" or "login required" errors gracefully with clear console messages.