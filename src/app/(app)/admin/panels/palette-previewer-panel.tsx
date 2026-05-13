"use client";

const PALETTES = [
  { id: "cast-iron",          name: "Cast Iron & Thyme",     swatches: ["#1A1208","#5F3E2D","#828E6F","#B07D56","#F3F1ED"] },
  { id: "copper-clove",       name: "Copper & Clove",        swatches: ["#160E08","#7A4A20","#A89060","#C8782A","#FDF5E8"] },
  { id: "heirloom-orchard",   name: "Heirloom Orchard",      swatches: ["#1A1210","#6B4A38","#A6B08E","#B07D56","#F3F1ED"] },
  { id: "sage-stone",         name: "Sage & Stone",          swatches: ["#121810","#4A6040","#7A9A6A","#A6B08E","#F0F4EC"] },
  { id: "midnight-pantry",    name: "Midnight Pantry",       swatches: ["#0A0E14","#2A3A50","#5A8AB0","#8AA0B8","#EEF2F8"] },
  { id: "burgundy-wine",      name: "Burgundy & Wine",       swatches: ["#1A0808","#6B1825","#9A4060","#C83050","#FEF0F2"] },
  { id: "sage-herbaceous",    name: "Sage & Herbaceous",     swatches: ["#101408","#2D4A3E","#5A8060","#7AC870","#EFF8ED"] },
  { id: "charcoal-terracotta",name: "Charcoal + Terracotta", swatches: ["#14110F","#282018","#7A5040","#C86040","#F5EDE8"] },
  { id: "teal-saffron",       name: "Teal & Saffron",        swatches: ["#0A1A1A","#1A4747","#306868","#E8A820","#FDF8E8"] },
  { id: "copper-skillet",     name: "The Copper Skillet",    swatches: ["#0E1828","#1E3048","#7A5840","#C87840","#F8F0E8"] },
  { id: "nordic-kitchen",     name: "Nordic Kitchen",        swatches: ["#141820","#2A3848","#6080A0","#88B8D8","#F0F4FC"] },
  { id: "umami-midnight",     name: "Umami Midnight",        swatches: ["#0E0C08","#2A2418","#6A6030","#C8A840","#F4F0E0"] },
  { id: "matcha-milk",        name: "Matcha & Milk",         swatches: ["#0C1008","#2A3820","#6A8860","#A8C890","#F2F8EE"] },
  { id: "smoked-paprika",     name: "Smoked Paprika",        swatches: ["#180808","#4A1010","#884030","#E06040","#FBF0EB"] },
  { id: "lavender-honey",     name: "Lavender Honey",        swatches: ["#180818","#3A2848","#8870A8","#D0A840","#FBF4FF"] },
];

export function PalettePreviewerPanel() {
  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--wc-pal-accent, #B07D56)" }}>
        🎨 Palette Previewer
      </h2>
      <p className="text-sm mb-5" style={{ color: "rgba(176,125,86,0.6)" }}>
        All 15 palettes — visual reference for color design decisions.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {PALETTES.map((p) => (
          <div
            key={p.id}
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(58,36,22,0.4)" }}
          >
            {/* Color bar */}
            <div className="flex h-10">
              {p.swatches.map((color, i) => (
                <div key={i} style={{ flex: 1, background: color }} />
              ))}
            </div>
            {/* Mock recipe card */}
            <div className="p-3" style={{ background: p.swatches[1] }}>
              <div
                className="text-xs font-bold mb-1 truncate"
                style={{ color: p.swatches[4], fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Sample Recipe Title
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 rounded-full" style={{ flex: 2, background: p.swatches[2], opacity: 0.6 }} />
                <div className="h-1.5 rounded-full" style={{ flex: 3, background: p.swatches[2], opacity: 0.35 }} />
              </div>
              <div className="flex gap-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: p.swatches[3], color: p.swatches[0] }}
                >
                  {p.name.split(" ")[0]}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: p.swatches[2] + "40", color: p.swatches[4], opacity: 0.8 }}
                >
                  30 min
                </span>
              </div>
            </div>
            {/* Name */}
            <div
              className="px-3 py-2 text-xs font-semibold"
              style={{ background: p.swatches[0], color: p.swatches[3] }}
            >
              {p.name}
              <span className="ml-2 font-mono" style={{ opacity: 0.5, fontSize: "0.65rem" }}>{p.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
