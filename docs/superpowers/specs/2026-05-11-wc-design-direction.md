# What's Cooking — Design Direction Spec
> Ritual date: 2026-05-11
> Phase: /huashu-design Phase 1–6 complete · Phase 7 (sweep execution) pending

---

## Design brief in one sentence

What's Cooking is the magazine you wish you had on the counter while you cook — not aspirational, not tutorial, just a craft companion for someone who already has a cast-iron pan and wants to use it more often.

---

## Locked direction: Apartamento × Kinfolk × Gentlewoman Hybrid

Three source directions distilled into one system:

| Element | Source | Decision |
|---|---|---|
| Ground color | Apartamento | Cream `#F5EFE4` — the warmest option |
| Hero typography | Apartamento | Playfair 900 Italic, copper, oversized, dramatic |
| Information architecture | Kinfolk | Three-column grid — pantry / recipes / plan as equal citizens |
| Recipe listing surface | Gentlewoman | Index table — name + time + serves + category + status, hairline rules, mono metadata |
| Copper use discipline | Gentlewoman | **Only** on interactive elements, pull-quote initials, featured tags. Zero decorative copper. |
| Nav structure | Gentlewoman | Centered logo block with mono links flanking left and right |
| Section dividers | Apartamento | 1px copper rules (not neutral hairlines — actual copper) |

---

## Color system

| Token | Value | Use |
|---|---|---|
| `--wc-cream` | `#F5EFE4` | Primary ground — all page surfaces |
| `--wc-linen` | `#E8DDD0` | Secondary surface — cards, inset blocks |
| `--wc-ink` | `#1A1209` | Primary text |
| `--wc-ink-muted` | `#5A4232` | Body copy, descriptions |
| `--wc-ink-subtle` | `#9A7A60` | Metadata, captions, labels |
| `--wc-copper` | `#C8782A` | Interactive only — links, CTAs, featured badges, drop-cap initials |
| `--wc-rule` | `rgba(200,120,42,0.25)` | Section divider rules |
| `--wc-hairline` | `rgba(26,18,9,0.15)` | Grid lines, index table rows |

---

## Typography system

| Role | Family | Weight | Style | Size | Notes |
|---|---|---|---|---|---|
| Hero / display title | Playfair Display | 900 | Italic | 52–88px optical | Letter-spacing −0.025em, line-height 1.0 |
| Section heading | Playfair Display | 700 | Italic | 28–40px | |
| Recipe card title | Playfair Display | 700 | Italic | 18–22px | |
| Body / intro | Playfair Display | 400 | Italic | 16–18px | Line-height 1.65 |
| Index table title | Playfair Display | 700 | Italic | 17–20px | |
| All metadata / labels / index cols | Geist Mono | 400–500 | Normal | 9–11px | Letter-spacing 0.12–0.20em, uppercase |
| Nav links | Geist Mono | 400 | Normal | 9–10px | Letter-spacing 0.14em, uppercase |

**Rule:** Playfair Display is the editorial voice. Geist Mono is the indexing system. They never swap roles.

---

## Layout principles

1. **Wide margins** — 48–60px horizontal padding on all primary surfaces. Content does not touch the edge.
2. **Three-column information parity** — pantry / recipe discovery / meal plan are coequal. No single column dominates.
3. **Index table as primary browse surface** — recipe lists are tables, not card grids. Each row: name (Playfair italic) + mono metadata columns + status/match indicator.
4. **Section dividers are copper rules** — `1px solid var(--wc-copper)` at low opacity (`rgba(200,120,42,0.25)`). Not neutral gray.
5. **Air around everything** — the user described their ideal kitchen as "sun-lit, no clutter." Page density follows: one strong element per zone, generous whitespace around it.

---

## Stop-slop constraints (must survive the sweep)

- No purple, violet, or blue anywhere in the UI
- No icon prefixed to every section heading
- No fabricated stats ("Trusted by 10k+ cooks")
- No gradient slop on card backgrounds — cream or linen only
- No emoji in interactive elements
- Copper is the **only** chromatic accent. It appears in 3 places maximum per screen.
- Card grid identity: recipe cards in the index table format are **not** identical card blocks. Each row earns differentiation via status/match count.

---

## The 120% signature detail

**Drop-cap copper initial on the hero intro text.** Every landing surface and recipe intro should open with a copper Playfair 900 Italic drop-cap. This is the single detail done to 120% — everything else is 80%.

---

## Success signal (from user interview)

> "They cook more often than before they used the app."

Not more ambitiously. Not more photogenically. Just more often. Every design decision should serve frequency, not aspiration.

---

## Source demos

- `_temp/design-demos/demo-apartamento.html` — Direction 1 (warmth reference)
- `_temp/design-demos/demo-kinfolk.html` — Direction 2 (layout reference)
- `_temp/design-demos/demo-gentlewoman.html` — Direction 3 (index table reference)

---

## Next step

Execute WC 7-phase moodboard sweep per `humble-chasing-hamster.md` plan, using this spec as the definitive direction reference. Palette switcher strip is **deferred** — revisit after HolyFlex and VenturePath rituals are complete and user has reviewed all three directions together.
