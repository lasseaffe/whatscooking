# Goal
Create a Python script using Playwright to extract a high-quality "Hero Image" from any standard recipe website URL using element-based screenshotting logic.

# Technical Requirements
1. **Headless Browser:** Use **Playwright** to load the URL. Set a realistic User-Agent to avoid bot detection.
2. **Lazy-Load Handling:** Implement a "Scroll-to-View" function that slowly scrolls the page to trigger lazy-loading of high-res images before capturing.
3. **Hero Image Detection Logic:** Instead of scraping `<img>` tags, find the "Best Candidate" element to screenshot by:
    - **Visual Importance:** Identifying elements with a high width/height ratio (e.g., > 400px).
    - **Positioning:** Favoring elements in the top 60% of the page.
    - **Schema Metadata:** Check `ld+json` for the `image` property to find the specific element ID or class associated with the official recipe photo.
4. **Screenshotting:** Use the `.screenshot()` method on the specific DOM element rather than the whole page to ensure a clean, cropped image without text overlays.

# Output
- A script `site_screenshotter.py`.
- A function `capture_recipe_hero(url)` that:
    - Automatically detects the main photo.
    - Captures it as a high-quality `.png` or `.jpg`.
    - Handles "Cookie Banners" or "Newsletter Popups" by attempting to close them or screenshotting "under" them.

# Reliability
- If no single large image is detected, fall back to a "Top-Fold" viewport screenshot centered on the page title.