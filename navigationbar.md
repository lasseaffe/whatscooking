### TASK: IMPLEMENT JUMP-TO NAVIGATION & SCROLL-SPY
Add a persistent navigation bar for continent-jumping and link it to the scroll state.

1. **The Navigation Bar**:
   - Create a component `<CuisineNav />` that is `position: sticky; top: 0; z-index: 50`.
   - Styling: Use background #3A3430 with 80% opacity and a 10px blur. 
   - Add a subtle 1px border-bottom in white/10.
   - Items: Europe, Americas, Asia, Africa, Oceania.

2. **Scroll-Spy Logic**:
   - Use 'Intersection Observer' to detect which continent `<section>` is currently 50% visible in the viewport.
   - Update the Nav Bar state to highlight the active continent.
   - Add a smooth-scroll behavior: `window.scrollTo({ behavior: 'smooth' })` when a nav item is clicked.

3. **Refined Hero Layout**:
   - Ensure the Continent Hero section is the target for each anchor link.
   - Padding-top: Add `scroll-margin-top: 5rem` to each continent section so the sticky nav doesn't overlap the title when jumping.

4. **Visual Polish**:
   - Active state: Use a Saffron-colored #F4A261 underline (2px) that animates between items using 'framer-motion' layoutId.
   - Font: Small caps, bold, 0.75rem, with 0.1em letter-spacing.