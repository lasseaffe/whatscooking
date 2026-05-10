# Recipe Description Guidelines

> Used by both the `extract` API route and the `fix-descriptions` admin route.
> When Claude writes or rewrites a recipe description, it MUST follow these rules exactly.

---

## The Goal

A description makes the reader hungry and tells them **why this dish is worth making**.
It is never a copy-paste from social media, a marketing caption, or a set of hashtags.

---

## Structure (always 2-3 sentences)

| Sentence | Purpose | What to include |
|---|---|---|
| **1 - The hook** | Describe the dish's identity | Key ingredients, texture, flavour profile |
| **2 - The technique or magic** | What makes it special | Cooking method, a key step, a unique ingredient |
| **3 - The payoff** (optional) | When / why to make it | Occasion, emotional reward, speed, crowd-pleaser quality |

---

## 10 Golden Rules

1. **Write from the title + ingredients — never from social captions.**
   If you have a raw Instagram caption with likes counts, hashtags, sponsor mentions, or creator handles — ignore it entirely. Derive the description only from the dish name and what you know about the recipe.

2. **No first person.** Never "I", "my", "we", "our".

3. **No social language.** No hashtags, no "make sure to follow", no @ mentions, no "recipe below", no "link in bio", no "swipe up", no emojis.

4. **No like/comment counts.** Never include "54K likes", "282 comments" or any engagement metrics.

5. **No brand mentions or sponsorships.** Never name a specific brand, appliance, or sponsor.

6. **No dietary tag repetition.** Don't start with "This vegan, gluten-free..." — dietary tags are shown separately in the UI.

7. **Lead with flavour and texture, not nutrition.** "Silky and caramel-sweet" beats "high in protein". Nutrition is shown separately.

8. **Use vivid but restrained food language.** Aim for editorial cookbook tone — think Ottolenghi or NYT Cooking blurb, not TikTok caption.
   - Good: *silky, golden, caramelised, melt-in-the-mouth, fragrant, deeply spiced, crispy-edged*
   - Avoid: *amazing, insane, addictive, obsessed, literally the best*

9. **Be specific, not generic.** Name the key ingredient that defines the dish.
   - Bad: "A delicious chicken dish with vegetables and rice."
   - Good: "Saffron-scented chicken thighs braised with preserved lemon and olives over fluffy couscous."

10. **End with context or reward.** The third sentence should give the reader a reason to cook this now — weekend project, weeknight winner, impressive for guests, comforting on a cold night, etc.

---

## Length

- Minimum: 30 words
- Maximum: 70 words
- Target: 40-55 words

---

## Reference Examples (copy the style, not the content)

```
Silky black cod marinated for 48 hours in sweet white miso and mirin, then broiled until
caramelised and flaking. The long marinade does all the heavy lifting, transforming the fish
into something almost buttery. Served with quick-cured cucumber and steamed rice for an
effortlessly elegant dinner.
```

```
Tender, chile-braised beef folded into corn tortillas, dipped in rich consomme and griddled
until crispy and caramelised. Served with a cup of the deeply spiced broth for dunking —
one of Mexico's most iconic street foods.
```

```
Eggs poached in a vibrant, harissa-spiked tomato and pepper sauce, crowned with crumbled
feta and fragrant za'atar. A one-pan wonder equally brilliant for brunch or a quick
weeknight dinner.
```

---

## What to do when you have a raw Instagram caption

Given a caption like:
> "54K likes, 282 comments - chloeevegan on August 23, 2023: Healthier Caramel Stuffed
> Chocolates. Sweetened with just banana and dates! To make the caramel super smooth and
> gooey, I recommend using the [brand] which blends it up in seconds."

**Step 1:** Extract only the dish name: **Caramel Stuffed Chocolates**
**Step 2:** Extract any real ingredients mentioned: banana, dates, dark chocolate, strawberry
**Step 3:** Write the description from scratch using those ingredients and the dish name
**Step 4:** Result:

> *Dark chocolate shells filled with a lusciously smooth caramel made from just banana and
> medjool dates — no refined sugar needed. The caramel sets into a rich, gooey centre that
> contrasts perfectly with the snappy chocolate shell. A genuinely indulgent treat that
> happens to be vegan.*

---

## Claude Prompt Template

When asking Claude to write a description, always include this block:

```
Write a recipe description following these rules:
- 2-3 sentences, 40-55 words total
- Lead with key ingredients, texture, and flavour
- Sentence 2: the technique or what makes it special
- Sentence 3 (optional): when/why to make it — occasion or reward
- NO hashtags, likes counts, @ mentions, brand names, or social language
- NO first person (I/we/my)
- Tone: editorial cookbook (Ottolenghi / NYT Cooking), not social media
- Write from the dish name and ingredients ONLY — ignore any social caption text

Dish: {title}
Key ingredients: {ingredient list}
```
