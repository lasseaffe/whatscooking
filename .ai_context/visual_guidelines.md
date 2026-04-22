# Visual & Motion Guidelines

This document maps physical assets to their functional implementation in the "What's Cooking" ecosystem.

## Phase I & II: Discovery & Prep
| Asset Name | Reference | UX Intent |
| :--- | :--- | :--- |
| `hot_right_now.png` | | Horizontal scroll; [cite_start]Cards must have 16px corner radius and 8px hover lift[cite: 59]. |
| [cite_start]`pantry_sync.gif` | [cite: 72] | Shows Toast notification when User A toggles an ingredient. |
| [cite_start]`budget_ticker.png` | [cite: 21] | Header display of "Cost per Serving" using Walnut (#5D4037). |

## Phase III: Execution (The Subway Map)
- **Subway Roadmap**:
    - [cite_start]**Visual**: Vertical timeline of nodes[cite: 83].
    - [cite_start]**Active State**: Current step pulses in Sage Green (#828E6F)[cite: 83].
    - [cite_start]**Connections**: Use dashed Walnut (#5D4037) lines[cite: 83].
- [cite_start]**SOS Panic Dial**:
    - [cite_start]**Visual**: Circular dial using Toffee (#B07A52) for warning elements[cite: 11].
    - [cite_start]**Motion**: Long-press activation to prevent accidental triggers[cite: 12].
- [cite_start]**UGC Ticker**[cite: 84]:
    - [cite_start]**Animation**: 8-second interval rotation[cite: 84].
    - [cite_start]**Transition**: Slide-and-fade from the bottom[cite: 84].

## Phase IV & V: Serve & Restore
- [cite_start]**Napkin Folding**[cite: 95]: 
    - **Asset**: `napkin_guide.gif`
    - [cite_start]**Logic**: 3-step SVG path animation[cite: 95].
- [cite_start]**Cleanup Checklist**[cite: 28]:
    - [cite_start]**Visual**: Bento-card layout on #FAF9F6 background[cite: 28].
    - [cite_start]**Icons**: Distinguish 'Dishwasher Safe' vs. 'Manual Care'[cite: 29].
- [cite_start]**Kitchen Reset**[cite: 107]:
    - **Asset**: `reset_celebration.gif`
    - **Feedback**: Trigger Confetti/Badge micro-interaction upon completion.