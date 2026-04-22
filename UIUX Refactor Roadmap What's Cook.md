# UI/UX Refactor Roadmap: What's Cooking

This document outlines a multi-phase refactor to transform the application into a premium, intuitive, and high-performance culinary tool.

## Phase 1: Global Architecture & Sidebar Navigation
[cite_start]**Goal:** Reduce cognitive load and establish a functional hierarchy[cite: 1, 2].

### 1.1 Sidebar Restructuring
* [cite_start]**Remove Sub-text:** Delete all descriptions (e.g., "Search, browse and save...") under sidebar items to reduce visual noise by 50%[cite: 31, 33, 45, 169, 170].
* [cite_start]**Functional Grouping:** Organize navigation into three distinct sections[cite: 4, 11, 46]:
    * [cite_start]**Discovery:** Recipes[cite: 5, 14].
    * [cite_start]**Planning:** Meal Plans, Dinner Parties[cite: 8, 9, 15].
    * [cite_start]**Kitchen:** My Pantry (renamed "Kitchen Management"), Nutrient Tracker[cite: 7, 10, 16].
* [cite_start]**Active States:** Update the active page indicator to use a 3px Saffron/Persimmon vertical accent bar and 100% text opacity, while inactive items stay at 60%[cite: 29, 30, 42, 48, 171].

### 1.2 Global Elevation & Layout
* [cite_start]**Background Hierarchy:** Set Sidebar to Level 0 (#1F1B19) and Main Content to Level 1 (#2C2724) to create a "Sheet" effect[cite: 40, 41, 47].
* [cite_start]**Category Migration:** Move "Dietary Filters" into a drawer on the Recipes page[cite: 21, 22].
* [cite_start]**Function Relocation:** Move "Scramble Together" logic into the "My Pantry" page as a "What can I make now?" action[cite: 23, 24].

---

## Phase 2: Premium "Soft Light" Mode
[cite_start]**Goal:** Create a warm, paper-like light theme that avoids "flash-grenade" brightness[cite: 133].

* **Soft Light Palette:**
    * [cite_start]**Background (Level 0):** #F9F7F4 (Warm Eggshell)[cite: 138, 139, 147].
    * [cite_start]**Surface (Level 1):** #F0EDE9 (Subtle Beige)[cite: 140, 147, 202].
    * [cite_start]**Elevation (Level 2):** #E4E0DB (Light Grey-Brown)[cite: 141, 147].
    * [cite_start]**Text:** #2D2926 (Soft Charcoal)[cite: 142, 147].
* [cite_start]**Depth & Borders:** Replace heavy shadows with subtle 1px borders (#000000/5) to define cards in light mode[cite: 150].
* [cite_start]**Transitions:** Implement a 0.3s CSS transition for background-color and color for smooth theme switching[cite: 148, 149].

---

## Phase 3: Dashboard & View Refactoring
[cite_start]**Goal:** Replace dense vertical scrolling with compact, dynamic layouts[cite: 50, 175, 193].

### 3.1 Cuisine Atlas (Discovery)
* [cite_start]**Continent Hero:** Implement a sticky hero container that cross-fades background images based on the active continent using `framer-motion`[cite: 52, 54, 74, 75, 76].
* [cite_start]**Atlas Navigator:** Add a sticky Jump-to Navigation bar with Glassmorphism (#3A3430 at 80% opacity, 10px blur) and Scroll-Spy logic[cite: 96, 97, 98, 103, 105, 107].
* [cite_start]**Horizontal Snap-Scroll:** Show 2.5 country cards at once using `scroll-snap-type: x mandatory`[cite: 63, 65, 67, 78, 79, 80].

### 3.2 Nutrient Tracker (Health)
* **Command Center Layout:** Convert to a 2-column grid. Column 1 (60%) for Macro Rings; [cite_start]Column 2 (40%) for Weight Sparklines and Macro Tips[cite: 177, 181, 193, 195].
* [cite_start]**Collapsible Goals:** Move the "Nutrition Goals" form into a collapsible accordion or modal to save 400px of vertical space[cite: 182, 198, 216].
* [cite_start]**Persistent Log Bar:** Make the "What did you eat?" input a persistent bar at the top of the nutrition section[cite: 184].

### 3.3 Dinner Parties (Social)
* [cite_start]**Social Event Cards:** Move from a table-based calendar to "Cover Cards" featuring the menu, guest avatars, and a collaborative prep progress bar[cite: 153, 155, 156, 157, 163, 164].
* [cite_start]**Visual Focus:** Scale event images to 1/3 screen width to emphasize the "vibe" over the grid[cite: 160].

---

## Phase 4: Personalization & Pro Features
[cite_start]**Goal:** Build a "Pro Chef" identity through progress visualization[cite: 222].

### 4.1 Chef Profile Hub
* **Passport UI:** Replace the progress bar with a stylized SVG map. [cite_start]Cooked countries should glow in Saffron (#F4A261)[cite: 233, 234, 235, 236].
* [cite_start]**Flavor Profile:** Add a Radar Chart showing cooking styles (Spicy, Savory, Healthy, etc.)[cite: 244, 245].
* [cite_start]**Rank System:** Increase avatar size and add a "Chef Rank" (e.g., "Level 4: Sauce Master")[cite: 238, 239].

### 4.2 Kitchen Utility
* [cite_start]**Leftover Storage:** Add a function to the recipe "Finish" phase to add the dish directly to digital pantry storage[cite: 218, 219, 220].
* [cite_start]**AI Macro Estimator:** Allow natural language input (e.g., "Log a large bowl of creamy pasta") for AI-generated macro estimates[cite: 213].