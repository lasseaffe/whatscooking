# WhatsCooking — Apple App Store Compliance Rules
# Apple Guidelines: 4.2 (Minimum Functionality), 4.3 (Spam), 4.1 (Copycats), 2.3.7

These rules exist because Apple actively rejects apps that look AI-generated or template-based.
Every code change you write must satisfy all checks below before being considered complete.

---

## RULE 1 — No Generic UI. Ever.

FORBIDDEN in any shipped code:
- "Lorem ipsum" in any string, placeholder, comment, or data fixture
- "Coming soon" as the only content on any rendered screen
- Button labels: "Click here", "Learn more" (standalone), "Submit", "Button"
- Section headers: "Features", "About Us", "Get Started" without qualifiers
- Culinary Parchment palette replaced by pure #000000 / #FFFFFF / #CCCCCC
- shadcn/ui or Tailwind components with zero className overrides matching brand tokens

REQUIRED instead:
- Every empty state has WhatsCooking-branded culinary copy, a kitchen-themed icon,
  and at least one actionable CTA specific to the feature
- Every loading state uses shimmer or skeleton matching the Culinary Parchment aesthetic
  (Linen #F2EFE8, Walnut #5D4037, Sage #828E6F, Coffee #2C1B18, Toffee #B07A52)

---

## RULE 2 — Every Screen Must Have Minimum Functionality

Before marking any route complete, verify all of the following:

- [ ] The screen has a clear, singular purpose describable in one sentence
- [ ] The screen has at least two interactive elements (not counting nav/back)
- [ ] Any empty data state has a purposeful empty state with a CTA (not a blank div)
- [ ] The screen is navigable to and from without dead ends
- [ ] No unhandled promise rejections or console errors on load
- [ ] AI output is always brand-formatted, never raw model text in a plain div

---

## RULE 3 — Differentiation Checkpoint (Run Before Every Feature Is Logged as Done)

In your log entry, answer these three questions concretely:

1. **UNIQUENESS**: What does this implementation do that a generic recipe app
   (AllRecipes, Yummly, Spoonacular) could not produce without knowing WhatsCooking's
   pantry-first, culinary-educator identity?
2. **BRAND FIDELITY**: Which WhatsCooking tokens (Culinary Parchment palette,
   3-part instruction format, pantry-match data) are visible in this implementation?
3. **FUNCTIONALITY DEPTH**: How many distinct user actions can a user take on
   this screen beyond "read content"?

If you cannot answer all three concretely, the feature is not complete.

---

## RULE 4 — AI Prompts Must Be Identity-Locked

Every prompt sent to OpenAI or Anthropic must:
- Open with: "You are a patient, encouraging culinary educator helping home cooks
  understand not just what to do, but why it works..."
- Produce output with metric AND imperial measurements
- Include sensory cues (color, sound, smell, texture) at every relevant step
- Describe technique mechanically (what your hands do), not just culinarily

AI output UI must use brand typography (Libre Baskerville headers, Inter body)
and Culinary Parchment colors — never plain unstyled text in a white box.

---

## RULE 5 — App Store Metadata Readiness

Any screen that becomes a primary navigation destination must have:
- A clear human-readable `<title>` or navigation bar label
- Content describable in ≤ 30 words (App Store screenshot caption test)
- At least one meaningful screen accessible pre-auth

---

## RULE 6 — Privacy Requirements

- Every data collection point must map to the privacy policy draft
- Location data → add comment: `// REQUIRES LOCATION USAGE DESCRIPTION IN APP STORE CONNECT`
- UGC visible to others → add comment: `// REQUIRES UGC POLICY LINK IN APP STORE METADATA`

---

## RULE 7 — Template-Pattern Detection

STOP and redesign if you catch yourself writing:
- A card grid where every card has identical structure (image + title + subtitle + button)
- A tabbed interface where all tabs share identical layout with different text only
- A recipe display that could belong to any recipe app (no pantry match %, no 3-part format indicator)
- Any screen whose layout could belong to a completely different app category

Flag existing instances with:
`// APPLE-RISK: Generic template pattern — needs differentiation before App Store submission`

---

## WHATSCOOKING-SPECIFIC RULES

### WC-1 — The 3-Part Instruction Format Is the Core Differentiator

(Also mandated in CLAUDE.md — this reinforces it from an Apple compliance angle.)

- No recipe may be displayed using a flat instruction string in any UI component
- The three panels (What / Why / How) must be visually distinct, not identical tabs with different text
- The "Why" (culinary_logic) panel is what no other recipe app shows — treat it as premium, not a tooltip
- Even in compact/preview card contexts, show core_instruction with a visual indicator
  that culinary_logic and pro_technique exist (e.g. a "3-Part Recipe" pill badge)
- Label the culinary_logic section "Expanded by WhatsCooking" to signal original value

### WC-2 — Pantry-First Is the Navigation Philosophy

WhatsCooking is NOT a recipe browser. It is "what can I cook right now":
- Primary CTA on the dashboard is always pantry-driven ("Cook with what you have")
- Search results must offer a "match to my pantry" toggle — never just global search alone
- Recipe cards in any feed show pantry match percentage when pantry data exists
- Do not build browsing flows that ignore pantry state — that is how AllRecipes works,
  not us. It makes the app indistinguishable from existing apps (Apple 4.3)

### WC-3 — World Cup 2026 Is an Active Differentiation Signal

The World Cup 2026 integration proves to Apple reviewers this app is actively maintained
and responds to real-world events (not a static template):
- /world-cup-2026 must surface content specific to the current match schedule
- Match-day meal suggestions must reference the specific teams playing
- Add `// WORLD-CUP-EXPIRY: needs post-tournament plan by 2026-07-20` in the page component
- After July 2026, transition gracefully to a "Cultural Cuisines" archive — no dead routes

### WC-4 — Spoonacular Data Must Be Enriched Before Display

Raw Spoonacular data = identical to 1000 other apps using the same API (4.3 rejection risk):
- Every Spoonacular recipe must have instructions expanded into the 3-part format before rendering
- Recipes with incomplete data (no image, < 3 steps, missing nutrition) must be enriched or excluded
- Replace Spoonacular's own summary field with an AI-generated culinary educator version
- Show "Expanded by WhatsCooking" attribution on culinary_logic panels

### WC-5 — Dinner Party Co-Hosting Is a Social Layer, Not an Afterthought

The dinner party feature must make the app feel collaborative, not a solo utility:
- A dinner party must have: host + guests + menu collaboration + shopping list split
  + dietary restriction aggregation
- Guests must have a distinct view from hosts (not the same screen with a banner)
- The collaborative shopping list must show "last updated by [name]" at minimum
  — a static shared list is a 4.2 thin functionality flag

### WC-6 — Minimum Functionality Per Route

```
/pantry              → Ingredient CRUD + category grouping + expiry tracking + "Cook now" trigger
/discover            → Pantry-matched results first + filter system + cuisine selector
/plans               → Calendar view + week planning + shopping list generation
/dinner-parties      → Party creation + guest management + menu collaboration
/world-cup-2026      → Match schedule integration + team-specific recipes
/my-recipes          → Saved recipes + personal notes + cook count tracking
/shopping-list       → Aggregated from plans + manual add + check-off + share
/swipe               → Tinder-style recipe discovery with save/skip/cook-now options
```

Any route missing its minimums gets:
`// APPLE-RISK: BELOW MINIMUM FUNCTIONALITY` at the top of its page file.
