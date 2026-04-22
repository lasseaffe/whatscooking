# UX Optimization & Strategy: "The Intuitive Chef"

This document outlines the high-level UX principles and micro-interactions that elevate the "What's Cooking" experience from a tool to a companion.

## 1. Discovery & Mental Load Reduction
* **The "Ghost" Ingredient**: In Pantry-First Search, display missing ingredients as semi-transparent icons. [cite_start]This visually validates what the user has while clearly highlighting the gap. [cite: 49, 50]
* **Match Percentage Color Coding**: 
    * **Green**: 80%+ match.
    * **Amber**: 50-79% match.
    * **Red**: Low match/High grocery effort.
* [cite_start]**Trend Score Pulse**: Use Sage Green (#828E6F) pulse animations on 'Hot Right Now' cards to indicate real-time social activity. [cite: 58]

## 2. Preparation & Financial Ease
* [cite_start]**The Budget Ticker**: When costs approach the weekly limit, transition text from Walnut (#5D4037) to Toffee (#B07A52) as a gentle warning. [cite: 20, 21]
* [cite_start]**OCR Confidence Highlighting**: Any text parsed with low confidence (below 85%) should be highlighted in Red or Toffee for immediate user verification. [cite: 37, 71]

## 3. The Cooking Flow (Subway Map)
* [cite_start]**Haptic Panic Feedback**: The 'Panic Dial' requires a long-press. [cite: 12] [cite_start]**Optimization**: Implement increasing haptic vibration during the hold to signal the "SOS" is about to trigger. [cite: 10]
* [cite_start]**Adaptive Contrast**: Implement a "Kitchen Mode" with high-contrast text and larger nodes for the Subway Map, ensuring readability from 3-5 feet away on a counter. [cite: 77, 83]
* [cite_start]**Tactile Strikethrough**: The SVG strikethrough on ingredients should use a "wobbly line" animation to simulate a physical pen. [cite: 112] **Optimization**: Speed-sensitive drawing—faster swipes produce straighter lines, slower swipes produce more "hand-drawn" wobbles.

## 4. Cleaning & Restoration
* [cite_start]**"Clean-As-You-Go" Nudges**: During long "idle" nodes in the Subway Map (e.g., "Simmer for 20 mins"), the UI should proactively suggest cleaning items from the 'Hand-Wash Only' list. [cite: 26, 27, 43]
* [cite_start]**The Reset Ritual**: The 'Kitchen Reset' button must trigger a satisfying micro-interaction (Confetti/Badge) to provide positive reinforcement for finishing the "unfun" part of cooking. 
* [cite_start]**Bento-Box Cleanup**: Use a #FAF9F6 background for the Cleanup Checklist to create a visual "clean slate" feel. [cite: 28]

## 5. Accessibility & Hands-Free
* [cite_start]**Voice-Triggers**: Since hands are often messy, enable "Next Step" or "Show Fix" voice commands during the Roadmap phase. [cite: 7, 77]
* [cite_start]**The "Clock Rule" Overlay**: In the Table Stylist, use a simple SVG circle overlay on the camera view to help users place proteins at 6 o'clock and veggies at 10 and 2. [cite: 88, 89]