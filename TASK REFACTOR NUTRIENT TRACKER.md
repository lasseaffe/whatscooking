### TASK: REFACTOR NUTRIENT TRACKER INTO COMPACT DASHBOARD
Convert the vertical Nutrient Tracker into a high-density, multi-column dashboard.

1. **Layout Restructuring**:
   - Create a Grid Layout: Column 1 (Main Data), Column 2 (Quick Insights).
   - **Column 1**: Place 'Today's Nutrition' (The Rings) at the top. Integrate the 'Add Meal' input directly below the rings.
   - **Column 2**: Stack a 'Weight Sparkline' (compact chart) and the 'Macro Tips' card.
   - **Nutrition Goals**: Move this section into a 'Settings' modal or a collapsible 'Edit Goals' accordion at the very top to save 400px of vertical space.

2. **Styling & Elevation**:
   - Use Level 1 (#2C2724) for card backgrounds.
   - Use Level 2 (#3A3430) for input fields and ring inner-circles.
   - Apply the 'Paper-tone' Light Mode logic (#F0EDE9) when the theme is toggled.

3. **Interactive Features**:
   - Implement an 'Auto-Suggest' dropdown for the meal input that pulls from 'Recently Cooked' and 'Saved Recipes'.
   - Add a 'Quick Add' button for 1-click logging of items from the user's current 'Meal Plan'.
   - Animation: Use 'framer-motion' for a smooth pop-in effect when a meal is logged.

4. **Visual Density**:
   - Reduce padding on the Macro Rings.
   - Ensure the 'Remaning of 2000 kcal' bar is slim (max 8px height) and sits directly above the rings.
