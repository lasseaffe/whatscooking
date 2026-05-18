## [14:30] WC Landing ReportButton Component

- Created `src/components/landing/ReportButton.tsx` in What's Cooking project
- Implemented form-based recipe issue reporting with issue type dropdown
- Supports 5 issue types: faulty_image, wrong_info, wrong_ingredients, wrong_instructions, other
- Features: click-to-open dropdown, optional detail textarea (200 char limit), API integration via POST /api/recipe-reports
- Unused prop warning suppressed with `void imageUrl;` for future API expansion
- Status states: idle → submitting → done (with 1500ms delay before closing)
- Files created: `C:\Users\lasse\Desktop\whatscooking\src\components\landing\ReportButton.tsx`
