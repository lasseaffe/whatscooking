## 2026-05-13 - Cookbook voice + headnote prose hero

### Changed
- New canonical recipe description UI: EnhancedDescriptionCard now leads with a Libre Baskerville body paragraph (the "headnote") above the structured icon row. Plain description italic is gone; the headnote IS the description.
- Voice rule update (see CLAUDE.md "Recipe Content System"): a shared Cookbook Voice Contract names target exemplars (Hazan, Henry, Lopez-Alt, Ottolenghi) and anti-models (SEO blogs, BA-bro, restaurant menu copy). Banned-adjective and banned-chatter lists are now validator-enforced server-side.
- New step header guard: instruction-card headers must start with an action verb and abstract the body, never copy its prefix.
- Cook mode no longer fakes a heading from the first sentence - real step.header when enhanced, nothing when not.

### Ideas / next steps
- Consider promoting the Cookbook Voice Contract to its own moodboard config entry as a named voice mode.
- Headnote rendering on listing cards: do we surface 	agline there since the full headnote is too long?
- The "scattered over different pages" complaint in RecipeColumnsClient.splitIntoPhaseTabs still needs investigation - the phase-tab splitter may be misfiring for enhanced recipes.
- Audit existing curated recipes for backfill - the new description headnote spec is much richer than what's stored today.
## 2026-05-13 - Chef-mentor instruction card

### Changed
- New canonical recipe step UI: `EnhancedStepCard`. Replaces flat numbered list for recipes that have been Autoenhanced.
- Pattern: editorial card with bold action header (Libre Baskerville), body paragraph, two collapsible skill tabs (`Training Wheels` green / `Pro Move` saffron), jargon chips with hover/tap definitions, italic visual-strategy caption.
- Voice rule update (see CLAUDE.md): chef-mentor persona. No slop phrases. Direct address. Contractions. Rhythmic variance.
- Component palette: `#86EFAC` for beginner tab accent, `#F4A261` for pro/jargon accent, `#15110F` for inset surface inside modal, `#1F1A17` for modal chrome.

### Ideas / next steps
- Decide whether `chef-mentor` becomes a named voice mode in `moodboard.config.ts` or remains a recipe-only pattern.
- Mobile rendering: the enhanced card stacks well on small screens but the diff modal collapses to one column. Verify on real device.
- Consider letting the moodboard preview pull a sample EnhancedStep from a seed recipe so the spec lives in the moodboard, not just CLAUDE.md.
- Audit existing curated recipes: backfill `instructions_enhanced` with the same prompt run server-side via a one-time migration script.
# What's Cooking Moodboard Log

> Newest entries on top. Every design change (tokens, fonts, components, modes, voice, motion, icons) must be logged here in the same task, with both `### Changed` and `### Ideas / next steps`.

## 2026-05-11 — Bootstrap: in-app living moodboard system

### Changed
- Created `/moodboard` route under `src/app/(app)/moodboard` with 11 sections: Identity, Color, Typography, Spacing & Radii, Components, Patterns & Modes, Voice & Tone, Do/Don't, Iconography, Motion, Change Log.
- Added `moodboard.config.ts` — single source for editorial content (philosophy, voice rules, named palettes, do/don't pairs, motion intent).
- Added `lib/readCssVar.ts` — runtime resolver to hex; swatches drive directly from globals.css.
- Added `lib/parseMoodboardLog.ts` — Change Log section parses this file (newest 5).
- Added Design Moodboard card to `/settings` page (above existing `SettingsClient`).
- Added `scripts/check-moodboard-drift.mjs` + `moodboard:check` npm script. Drift check ignores low-level glow/gradient/shadow tokens by design — the moodboard surfaces semantic + WC-namespace tokens, not button-shadow primitives.
- PatternsAndModes section embeds `<PaletteSwitcher compact />` and a theme toggle; the Color section observes `data-palette` / `data-theme` changes and repaints in place.

### Ideas / next steps
- WC has *a lot* of palette personalities (5) and they each override `--wc-pal-*`. The Color section should split into "current palette" vs "all palettes side-by-side" so the moodboard can show the contrast between palettes at a glance.
- Recipe Card sample in Components is a shell — wire it to a real `RecipeCard` import once the moodboard import path is stable.
- The light-mode block in globals.css redefines tokens but isn't fully audited; add a "light-mode preview" pane in PatternsAndModes that forces `data-theme="light"` inside an iframe.
- Iconography section hardcodes a curated set of 11; long-term, scan the codebase for actual `lucide-react` imports and auto-list them.
- Many WC tokens shadow shadcn defaults (e.g. `--primary`, `--accent`). The moodboard intentionally surfaces the `--bg-*` / `--fg-*` versions because they reflect WC's actual design intent — but document this rationale in the Identity section.
