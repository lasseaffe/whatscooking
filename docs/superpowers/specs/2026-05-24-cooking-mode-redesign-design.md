# Cooking Mode Redesign + Kitchen Oracle Voice
**Date:** 2026-05-24  
**Status:** Approved for implementation

---

## Context

The cooking mode (`cooking-mode-screen.tsx`) is the most hands-on part of What's Cooking. Users have wet hands, poor lighting, and are often a metre from the screen. The current design has good bones — glossary, timers, step enrichment — but the step reading experience needs work: text is too small for mobile, the illustration system is underused, and there is no voice interface.

This spec covers two things:
1. **Step card visual redesign** — illustration-as-background, fixed layout anchors, typography upgrade
2. **Kitchen Oracle Voice** — voice mode wired into the existing Kitchen Oracle AI, not a new system

---

## Part 1 — Step Card Visual Redesign

### Layout anchors

The step card has two fixed-position anchors that never move regardless of step content:

- **Top-left** — `STEP X OF X` label, always pinned in the top bar (not inside the card)
- **Heading** — sits at a consistent vertical position (~40% from top of the step area), achieved via `padding-top` on a flex anchor div. For steps with long body text, the heading slides down naturally — the anchor absorbs the difference rather than fighting it.

The top bar structure (left → right):
```
[STEP X OF X]          [recipe name (muted)]     [🎙 mic icon]  [✕ exit]
```

Progress bar sits immediately below the top bar as a 2px gradient strip.

Bottom bar: `[← Back]` · `[Next →]` only. No mic button in the bottom bar.

### Illustration system

Each step card has a single SVG illustration centred in the card background:

- **Dark mode**: 35% opacity
- **Light mode**: 50% opacity
- Always centred, never repositioned per step
- A gradient scrim (`linear-gradient(to top, background 50%, rgba(bg, 0.65) 82%, transparent)`) rises from the bottom, keeping text crisp while the illustration shows through in the upper half

Illustrations are **keyword-matched** to the step action. The existing `step-visualization.tsx` pattern is extended. New illustrations to add (beyond the 7 already in `step-visualization.tsx`):

| Keyword triggers | Illustration |
|---|---|
| `bloom`, `toast the spice`, `add spice` | Spice bowl with floating particles |
| `simmer`, `reduce`, `low heat` | Covered pot with steam |
| `plate`, `serve`, `garnish` | Plated dish with sauce swipe + herb dots |
| `dice`, `chop`, `mince` + onion | Halved onion with grid cut lines |
| `sauté`, `soften`, `sweat` | Open pan with translucent veg + flame |
| `crack`, `egg`, `nestle` | Pan with eggs in sauce wells |
| `knead`, `dough` | Hands pressing dough with motion arrows |
| `roll out`, `rolling pin` | Rolling pin over dough *(already exists)* |

For steps with no keyword match, no illustration renders — the scrim still applies over the plain background.

### Typography (Option C)

Using WC's existing font stack — no new dependencies.

| Element | Font | Size | Weight | Colour |
|---|---|---|---|---|
| Step counter | Plus Jakarta Sans | 10px / 0.2em tracking | 600 | `#B07D56` |
| Duration | Geist Mono | 12px | 400 | `#F4A261` @ 80% opacity |
| Heading | Fraunces | 28px mobile / 24px desktop | 700 | `#EFE3CE` dark / `#1a0f08` light |
| Body | Plus Jakarta Sans | 17px mobile / 15px desktop | 400 | `#b0a090` dark / `#4a3224` light |
| Pro-tip | Plus Jakarta Sans | 13px | 500 | `#d4aa80` dark / `#6b5444` light |

Pro-tip box: `rgba(244,162,97,0.08)` fill + `1px rgba(244,162,97,0.18)` border + `✦` prefix icon.

Counter and duration are on separate lines (not inline):
```
STEP 3 OF 5
~ 1 min

Bloom the spices
```

### Light mode

Same structure, different tokens:
- Card background: `#FDFAF6`
- Scrim: `linear-gradient(to top, #FDFAF6 55%, rgba(253,250,246,0.7) 85%, transparent)`
- Illustration: 50% opacity (slightly more visible than dark)
- Pro-tip: `rgba(176,125,86,0.1)` fill

---

## Part 2 — Kitchen Oracle Voice Mode

### Philosophy

Voice is not a new system. It is a new **interface layer on top of the existing Kitchen Oracle**. The same AI, the same `/api/sos-tips` endpoint, the same context awareness — voice adds ears (STT) and a mouth (TTS).

### Entry flow

1. User enters cooking mode
2. A bottom sheet appears: **"Cook hands-free?"** with subtext "The Kitchen Oracle will read steps aloud and listen for your commands."
3. Three options:
   - **"🎙 Yes, enable voice"** (primary CTA, saffron)
   - **"Not right now"** (secondary, muted)
   - **"Don't ask me again"** (text link, small) — sets a `localStorage` flag `wc_voice_prompt_dismissed`
4. If dismissed before, sheet never shows again — user can still activate via the top-right mic icon

### Mic icon (top-right in top bar)

Three visual states:

| State | Icon | Style |
|---|---|---|
| Off | 🎙 | `rgba(176,125,86,0.10)` bg, muted colour, 60% opacity |
| Listening (STT active) | 🎙 | `rgba(244,162,97,0.18)` bg, saffron colour, pulsing box-shadow |
| Speaking (TTS active) | 🔊 | `rgba(176,125,86,0.18)` bg, warm colour, same pulse animation |

Tapping the icon always toggles voice entirely (both STT + TTS). There is no way to have one without the other.

### STT — Speech Recognition

Uses `window.SpeechRecognition || window.webkitSpeechRecognition` (Web Speech API). Continuous mode while voice is on. Falls back gracefully — if the API is unavailable, voice mode is hidden entirely rather than shown broken.

**Command routing — two tiers:**

**Tier 1 — Local (no API call, instant response):**
| Command examples | Action |
|---|---|
| "next", "next step" | Advance to next step |
| "go back", "previous" | Go to previous step |
| "repeat that", "read again" | Re-read current step via TTS |
| "read the step" | TTS reads full step text |
| "start timer" | Starts the first inactive timer on the step |
| "stop listening" / "stop" | Deactivates voice mode |
| "how much [ingredient]" | Looks up scaled ingredient amount from current recipe data |

**Tier 2 — Kitchen Oracle (AI call, async):**
| Command examples | Routing |
|---|---|
| "I added too much [X]" | Oracle: recovery/balance advice |
| "what does [term] mean" | Oracle: glossary lookup (or inline if term exists) |
| "can I substitute [X]" | Oracle: substitution advice |
| "what if I don't have [X]" | Oracle: substitution advice |
| Any other open-ended question | Oracle: general cooking help |

Oracle context sent with every Tier 2 call:
- Current recipe name + step index
- Current step text
- Scaled ingredient list
- The spoken query

### TTS — Text-to-Speech

Uses `window.speechSynthesis`. Fires automatically on:
- Voice mode activation → reads current step aloud
- Step advance (next/back) → reads new step aloud
- Oracle response → reads the answer aloud

TTS is cancelled immediately if:
- User taps mic icon (to start speaking)
- STT detects speech beginning
- User taps Next/Back manually

### Voice response card

When Oracle responds (or a Tier 1 answer is ready), a response card appears in the step content area in place of the pro-tip:

- **Listening state**: animated waveform bars + "Listening…" label, saffron border
- **Oracle response**: `✦` icon + answer text, warm amber, `rgba(176,125,86,0.12)` bg
- **Recovery response** (too much / wrong ingredient): `⚑` icon, warm-warning colour `rgba(232,93,32,0.08)` bg
- Card fades out after 8 seconds of inactivity, restoring the original pro-tip if present

### Voice mode persistence

- Voice on/off state lives in React context (alongside existing `CookingModeContext`)
- Does **not** persist across sessions — each cooking session starts fresh (respecting the entry prompt)
- `wc_voice_prompt_dismissed` localStorage flag persists indefinitely; user can reset in settings

### Browser compatibility

| Browser | STT | TTS |
|---|---|---|
| Chrome Android | ✅ | ✅ |
| Safari iOS 17+ | ✅ (webkit) | ✅ |
| Firefox | ❌ (no STT) | ✅ |
| Desktop Chrome | ✅ | ✅ |

On Firefox and any browser without STT support: voice mode is hidden (mic icon not shown, entry prompt not shown).

---

## Files to create / modify

| File | Change |
|---|---|
| `src/app/(app)/recipes/[id]/cooking-mode-screen.tsx` | Layout anchors, typography, scrim, top-bar mic icon, bottom-bar cleanup, voice response card |
| `src/components/step-visualization.tsx` | Add 6 new illustration keyword groups |
| `src/lib/cooking-mode-context.tsx` | Add voice state: `voiceEnabled`, `voiceState` (`idle`/`listening`/`speaking`), `toggleVoice()` |
| `src/hooks/useKitchenOracleVoice.ts` | New hook: STT loop, command routing (Tier 1 local / Tier 2 Oracle), TTS integration |
| `src/components/voice-prompt-sheet.tsx` | New: entry bottom sheet with don't-ask-again logic |
| `src/app/api/sos-tips/route.ts` | Extend to accept `voiceQuery` + `stepContext` for Tier 2 voice commands (or create `/api/voice-oracle`) |

---

## Verification

1. **Step layout** — open any recipe in cooking mode on a mobile viewport (375px). Confirm `STEP X OF X` is always visible in the top bar, heading is consistently positioned, body text is readable without zooming.
2. **Illustrations** — navigate through a recipe with steps that include "bloom", "sauté", "simmer", "plate". Confirm correct illustration appears ghosted behind text, centred, at correct opacity for the active palette.
3. **Light mode** — switch palette to "Tactile Elegance". Confirm illustration opacity is visibly stronger (~50%) and scrim colours match the light background.
4. **Voice prompt** — enter cooking mode. Confirm bottom sheet appears. Tap "Don't ask me again". Re-enter cooking mode. Confirm sheet does not appear again.
5. **Voice on/off** — tap mic icon in top bar. Confirm state changes (icon style, waveform card). Tap again, confirm it deactivates.
6. **Tier 1 commands** — with voice on, say "next". Confirm step advances. Say "go back". Confirm step retreats. Say "how much [ingredient in the recipe]". Confirm scaled quantity is read aloud.
7. **Tier 2 commands** — say "I added too much salt". Confirm Oracle is called, response card shows recovery advice, TTS reads it.
8. **TTS cancelled on manual nav** — while TTS is speaking, tap Next. Confirm TTS stops immediately.
9. **Firefox fallback** — open in Firefox. Confirm mic icon is not shown, no entry prompt, cooking mode works normally.
