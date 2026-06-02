"use client";

import { useState } from "react";
import { Search, FlaskConical } from "lucide-react";

export function FlavorPairingsTab() {
  const [ingredient, setIngredient] = useState("");

  const flavorDbUrl = ingredient
    ? `https://cosylab.iiitd.edu.in/flavordb?query=${encodeURIComponent(ingredient)}`
    : "https://cosylab.iiitd.edu.in/flavordb";

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A69180" }} />
          <input
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            placeholder="e.g. strawberry, coffee, lamb…"
            className="w-full pl-9 pr-4 py-2.5 rounded-full border text-sm outline-none"
            style={{ background: "#FBF6EE", borderColor: "#E0D0BC", color: "#3D2817" }}
          />
        </div>
      </div>

      <div className="rounded-2xl p-8 text-center" style={{ background: "#F5EEF8", border: "1px solid #7C3AED30" }}>
        <FlaskConical className="w-8 h-8 mx-auto mb-3 opacity-50" style={{ color: "#7C3AED" }} />
        <p className="text-sm font-semibold mb-1" style={{ color: "#7C3AED" }}>FlavorDB Pairing Explorer</p>
        <p className="text-xs mb-4" style={{ color: "#6B5B52" }}>
          FlavorDB maps ingredient flavor compounds to predict culinary compatibility.
          Their public API requires registration — click below to explore on their site.
        </p>
        <a
          href={flavorDbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold px-4 py-2 rounded-full"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          {ingredient ? `Search "${ingredient}" on FlavorDB ↗` : "Open FlavorDB ↗"}
        </a>
      </div>
    </div>
  );
}
