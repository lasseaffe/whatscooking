### TASK: REFACTOR CUISINE ATLAS VIEW
Refactor the Cuisine Gallery to use a Dynamic Hero + Snap-Scroll pattern.

1. **Continent Hero Section**: 
   - Create a sticky hero container that changes its background image based on the active continent.
   - Use 'framer-motion' for a smooth 0.5s cross-fade transition between images.
   - Set the continent title in a large, elegant Serif font with an '8px base' spacing layout.

2. **Horizontal Snap-Scroll**:
   - Reorganize country cards into a horizontal flex-row: `overflow-x: auto` and `scroll-snap-type: x mandatory`.
   - Display exactly 2.5 cards on desktop to encourage scrolling.
   - Implement custom scrollbar styling: thin, themed to #3A3430.

3. **Unique Card Aesthetics**:
   - Add a dynamic 'accent-color' property to each country object.
   - Apply this color to a 2px top-border on the card and a soft 'box-shadow' on hover.
   - Refine the text: Title (2xl, Bold), Quote (Italic, Muted Opacity), and Pills (Level 2 surface: #3A3430).

4. **Colors & Contrast**:
   - Section Background: Level 0 (#1F1B19).
   - Country Cards: Level 1 (#2C2724).
   - Ensure 'Popular Dishes' pills use Level 2 (#3A3430) for clear elevation.