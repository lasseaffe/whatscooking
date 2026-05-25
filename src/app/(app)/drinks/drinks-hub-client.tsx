"use client";

import { CULTURES } from "@/lib/drinks";
import { CultureCard } from "@/components/drinks/culture-card";

export function DrinksHubClient() {
  return (
    <div className="drinks-hub">
      <div className="drinks-hub__grain" aria-hidden />
      <div className="drinks-hub__hero">
        <p className="drinks-hub__eyebrow">What&apos;s Cooking — Drinks</p>
        <h1 className="drinks-hub__title">
          The Bar. The Café.<br />
          <em>The Cellar.</em> The Lab.
        </h1>
        <p className="drinks-hub__sub">
          Professional-grade drinks for every palate and discipline.
        </p>
      </div>
      <div className="drinks-hub__grid">
        {CULTURES.slice(0, 4).map((culture) => (
          <CultureCard key={culture.slug} culture={culture} />
        ))}
        <CultureCard culture={CULTURES[4]} wide />
      </div>
    </div>
  );
}
