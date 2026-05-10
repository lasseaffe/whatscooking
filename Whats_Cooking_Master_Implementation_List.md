# "What's Cooking" Master Implementation List (V1.0)

This is a comprehensive, consolidated list of all requested features, design rules, and technical specifications gathered from across all project documents (Implementation Plans, PDFs, and Refactor Guides).

---

## 1. Global Design System (The "Premium Elevation" System)
The primary goal is to replace flat dark mode with high-end, high-contrast depth using specific hex values.

### **Color Palette & Depth**
* **Level 0 (Base Background):** `#1F1B19` (Warm Charcoal) - Replaces `#120F0D`.
* **Level 1 (Cards, Sidebar, Surfaces):** `#2C2724` (Deep Cocoa) - Replaces `#1E1A17`.
* **Level 2 (Active States, Inline Tips):** `#3A3430` (Muted Umber) - Replaces `#2A2521`.
* **Search Bar:** `#3A3430` (Must be the lightest surface element to draw the eye).
* **Primary Actions (CTAs):** High-chroma Saffron Yellow, Vibrant Persimmon, or Leafy Green.
* **Light Mode:** Use a **Camel/Beige** tone instead of off-white (reduces glare, maintains organic feel).
* **Nutrient Tracker:** Differentiated by warmer earthy tones (Orange/Beige/Camel) to stand out from recipes.

### **Typography & Spacing**
* **Scale:** 1.250 Major Third typographic scale.
* **Vertical Rhythm:** Body text line-height minimum 1.5x.
* **Grid:** Standard 8px base for all spacing and margins.
* **Nested Radii Rule:** Corner radii must follow the formula: $R_{outer} = R_{inner} + Padding$.
* **Interactive Elements:** Hover effect with color change, 1.02x zoom, and deepened shadows.

---

## 2. Navigation & Sidebar Structure
Grouped by **User Intent** (Discovering vs. Managing vs. Configuring).

### **Main Navigation (Action-Oriented)**
* **Recipes (The Hub):** Primary discovery area.
* **Meal Plans:** Primary execution area (includes **Dinner Party** as a specialized sub-type).
* **My Kitchen:** Grouping for **My Pantry** and **Shopping List**.
* **Health:** Grouping for **Nutrient Tracker**.
* **Personal Space:** Profile & Settings (anchored to the bottom).

### **UI Interaction**
* **Sidebar Animation:** Must push/move the site content rather than sliding over it independently.
* **Subcategories:** Should extend directly to the right of the parent category.
* **Top Bar Refinement:** Move "Dietary Filters" and "Meal Swipe" into a Filter Drawer on the Recipes page to declutter the header.

---

## 3. The 5-Phase Recipe Experience
Recipes are structured into logical workflow phases to manage cognitive load.

### **Phase I: Discovery (Cards)**
* **Image Scrim:** Add a subtle dark gradient at the bottom for text readability.
* **Metadata:** Display Prep Time, Difficulty, and a 0/5 "Chef Hat" rating.
* **Recipe Description:** Ensure the "A 30-minute dinner..." text shows on or below cards in body text settings.

### **Phase II: Mise en Place (Ingredients)**
* **Auto-Folding Logic:** Section should fold to the left when all items are checked to give space to instructions.
* **Unit Toggle:** Global Metric/Imperial slider.
* **Smart Scaling:** "X People" serving option that doubles/halves ingredient quantities.
* **Shopping Integration:** Button to estimate prices or add missing ingredients to the list.

### **Phase III: Execution (Instructions)**
* **Focus Flow:** Auto-scroll so the active step is centered with a `#3A3430` background tint.
* **SOS Helper:** Appears at the bottom of steps (e.g., "What if I added too much salt?").
* **Interactive Timeline:** Clickable segments (Prep, Boil, Bake) jump scroll position to that phase.
* **Inline Tips:** "Chef Tips" nested as italicized sub-text within steps rather than separate windows.

### **Phase IV: Table Setting & Serving**
* **Occasion Tabs:** Specific visualizations for "Casual," "Intimate," and "Festive."
* **Visual Guides:** Instructions for napkin folds (Bishop's Hat, Triple Pocket) and plating layouts (e.g., "Generous heap in center").
* **Garnish/Pairing:** Suggested drink pairings (Wine/Beer/Water) and manual garnishing tips.

### **Phase V: Restore & Cleanup**
* **Storage Stats:** Large "Hero Stats" for food care (e.g., "1-3 Days").
* **Cleanup Concierge:** Toggle between "Dishwasher Safe" and "Hand Wash Only" lists.

---

## 4. Specialized Features & Gamification
* **World Cup 2026 Event:** Collect flags for every country by finishing meals (Requires min. 3 recipes per country).
* **Passport System:** Completed recipes appear as stamps on a stylized SVG World Map.
* **Cuisine Atlas Refactor:**
    * Sticky Hero Section with smooth 0.5s cross-fade background images.
    * Horizontal Snap-Scroll (2.5 cards visible on desktop).
    * Themed scrollbars (#3A3430).
* **Chef Leveling:** Avatar size increases and titles (e.g., "Level 4: Sauce Master") are added based on completion.
* **The Flavor Profile:** Radar/Spider chart showing cooking styles (Spicy, Savory, Healthy, etc.).

---

## 5. Technical Requirements
* **Scraping Engine:** Python-based; target `application/ld+json` for clean extraction. Use the `recipe-scrapers` library.
* **Database (Supabase):** `recipes` table must include `id (uuid)`, `title`, `ingredients (jsonb)`, `instructions`, `source_url (unique)`, and `category`.
* **Cooking Mode:** Triggers "Keep Screen Awake" API and high-contrast large fonts.
* **Bug Fixes:** Solve hydration errors by removing `Date.now()` from SSR; fix duplicate thumbnails by prioritizing JSON-LD metadata images.
