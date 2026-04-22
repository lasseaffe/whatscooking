 **CLAUDE.md — Project "What's Cooking" Guidelines**

## **1\. Global Design System (Lightened Dark Mode)**

The goal is to move away from "too dark to see" into a "Premium Elevation" system. **Constraint:** Use these hex codes strictly to ensure visibility.

| Level | Role | Hex Code | Note |
| :---- | :---- | :---- | :---- |
| **Level 0** | Base Background | \#1F1B19 | Replaces \#120F0D |
| **Level 1** | Surface (Cards/Sidebar) | \#2C2724 | Replaces \#1E1A17 |
| **Level 2** | Elevation (Active/Tips) | \#3A3430 | Replaces \#2A2521 |
| **Search** | Primary Tool | \#3A3430 | Should be the lightest surface element |
| **Accents** | Primary Actions (CTAs) | Saffron / Persimmon | High-chroma for "You are here" signals |

### **Spatial & Typography Rules**

* **Typography:** Use **1.250 Major Third** scale. Line-height **1.5x**.  
* **Grid:** 8px base spacing.  
* **Nested Radii:** Follow the formula $R\_{outer} \= R\_{inner} \+ Padding$.  
* **Buttons:** Mobile-first, minimum **44x44px** touch targets.

---

## **2\. Feature-Specific Requirements**

### **Nutrients Tracker**

* **Visuals:** Use warmer, earthy tones (Orange/Beige/Camel) for the tracker cards to differentiate them from the recipe feed.  
* **Logic:** The "What did you eat?" search box must prioritize a dropdown of:  
  1. Recently cooked meals.  
  2. Meals currently in the active Meal Plan.  
  3. User's Saved/Favorite meals.

### **Recipe Cards (Feed)**

* **Rating:** Implement a 0/5 "Chef Hat" icon system under the title.  
* **Static Info:** *Always* visible (not just on hover): **Prep Time**, **Difficulty (Icons)**, and a **"Meal Plan Match"** badge if active.  
* **Hero Card Fix:** \* Truncate Instagram-style captions to a 2-line summary.  
  * Remove center play buttons; move to top-right icon.  
  * Increase Title font-size to 2rem (Serif).

### **Recipe Detail Page (Master-Detail Layout)**

* **Hero:** Image covers top **40vh**; object-cover.  
* **Unit Toggle:** Global Metric/Imperial switch (near title) using a Context Provider to update ingredients and text-based instructions.  
* **Ingredients (Phase II):** \* Foldable Accordion (auto-folds when 100% checked).  
  * "Add all to shopping list" functionality.  
* **Instructions:**  
  * **F-Pattern:** Sticky Sidebar for Ingredients (Left) \+ Scrollable Instructions (Right).  
  * **Focus Mode:** Highlight active step with a left-border accent and \#3A3430 tint.  
  * **Interactive Timeline:** Clicking a phase bar (Prep/Boil/Bake) jumps to that instruction step.

---

## **3\. Data Integrity & Ingestion**

* **Thumbnail Audit:** Verify that thumbnails match the recipe title (e.g., Spanikopita vs. Pho). Use scraped JSON-LD data.  
* **Schema:** Recipes table must include source\_url (unique), ingredients (jsonb), and category.  
* **Scraper Logic:** Use recipe-scrapers library; target application/ld+json for clean data.

---

## **4\. Claude Code Implementation Prompts**

### **UI Refinement (Run for General Style)**

"Claude, audit the entire app's color palette. Update all background/surface levels to the new elevation system: Level 0 (\#1F1B19), Level 1 (\#2C2724), and Level 2 (\#3A3430). Ensure the search bar is the lightest (\#3A3430) and that all cards use the 8px grid and nested radius rules."

### **Recipe Page Refactor**

"Claude, redesign the RecipeDetail view.

1. Implement a Master-Detail structure (Sticky Sidebar for Ingredients).  
2. Add a global Metric/Imperial unit toggle.  
3. Implement the auto-folding logic for Phase II (Ingredients) once all items are checked.  
4. Move 'Chef Tips' into the instructions as inline tinted boxes (\#3A3430) instead of a separate window."

### **Feed Logic & Image Audit**

"Claude, update the Recipe Card component. Always display Prep Time and Difficulty icons. Add a 0/5 'Chef Hat' rating system. Also, scan the recipe database for duplicate thumbnails (e.g., Spanakopita/Pho) and prioritize the most accurate scraped image from the JSON-LD metadata."

---

## **5\. QoL & Interaction**

* **Spring Animations:** Scale cards **1.02** on hover with deepening shadows.  
* **Cooking Mode:** Toggle enlarges fonts, triggers "Keep Screen Awake" API, and centers the active instruction step using an **Intersection Observer**.

