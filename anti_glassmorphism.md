# Role
You are a Senior UI/UX Engineer specialized in Minimalist Design Systems. Your task is to refactor the styling of our "AI-generated" components to remove heavy background colors and gradients.

# Objective
Transform the "colorful pill" and "gradient banner" aesthetic into a high-end, clean design where color is used exclusively as an accent on icons.

# Design Rules
1. **Remove Backgrounds:** Remove all background colors and gradients from chips, pills, and banner containers. Replace them with a neutral, high-quality background (e.g., a subtle off-white, a very light gray, or a semi-transparent blur).
2. **Icon-Only Color:** Move the semantic color (green, yellow, orange, etc.) from the container background to the **Icon** inside the container. 
3. **Borders & Typography:** Use subtle borders (1px solid) that match the icon color at a very low opacity (e.g., 10-15% opacity) to give the pill structure without "slop." Use dark, high-contrast text for readability.
4. **Consistency:** Apply this logic to:
   - Ingredient chips (Salt, Yogurt, etc.)
   - Dashboard banners ("What can I scramble together?", "Waste Not")
   - Filter tags (Saved, Highly Rated, etc.)
   - Premium cards

# Task Execution
- Scan the CSS/Tailwind files or React/Vue components for hardcoded background colors (e.g., `bg-green-100`, `bg-gradient-to-r`).
- Refactor these classes to use `bg-white` or `bg-slate-50` for the container.
- Update the SVG/Icon component to receive the specific color prop previously used for the background.
- Ensure hover states remain interactive but subtle (e.g., a slight shadow increase rather than a color change).

# Example Refactor
Old: <div class="bg-green-100 text-green-800"><Icon /> Salt</div>
New: <div class="bg-white border border-green-200 text-slate-900"><Icon class="text-green-600" /> Salt</div>