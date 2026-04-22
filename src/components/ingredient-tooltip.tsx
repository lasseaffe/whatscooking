"use client";

import { useState, useRef } from "react";

const INGREDIENT_INFO: Record<string, { desc: string; where: string }> = {
  "kimchi": { desc: "Fermented Korean cabbage — spicy, tangy, probiotic-rich", where: "Asian markets or health food stores" },
  "miso": { desc: "Japanese fermented soybean paste — adds deep umami", where: "Asian markets, supermarket international aisle" },
  "tahini": { desc: "Ground sesame seed paste — nutty and creamy", where: "Middle Eastern shops, most supermarkets" },
  "fish sauce": { desc: "Fermented fish liquid — salty, savoury depth builder", where: "Asian markets or supermarket Asian aisle" },
  "mirin": { desc: "Sweet Japanese rice wine used in cooking", where: "Asian markets or supermarket international aisle" },
  "sake": { desc: "Japanese rice wine — dry and slightly sweet", where: "Asian markets or liquor stores" },
  "dashi": { desc: "Japanese stock from kombu seaweed and bonito flakes", where: "Asian markets (as instant powder or dried)" },
  "kombu": { desc: "Dried seaweed used for making Japanese dashi stock", where: "Asian markets or health food stores" },
  "bonito flakes": { desc: "Dried, fermented tuna shavings with smoky flavour", where: "Asian markets or online" },
  "panko": { desc: "Japanese coarse breadcrumbs — lighter and crispier than regular", where: "Asian markets or supermarket breadcrumb aisle" },
  "gochujang": { desc: "Korean fermented red chilli paste — spicy, sweet, savoury", where: "Asian markets or supermarket international aisle" },
  "gochugaru": { desc: "Korean red pepper flakes — fruity heat, less sharp than cayenne", where: "Asian markets or online" },
  "sriracha": { desc: "Thai-American hot sauce — garlicky and tangy", where: "Most supermarkets, Asian markets" },
  "sambal oelek": { desc: "Indonesian fresh chilli paste — pure heat without added flavour", where: "Asian markets or supermarket Asian aisle" },
  "hoisin sauce": { desc: "Thick, sweet and savoury Chinese barbecue sauce", where: "All supermarkets" },
  "oyster sauce": { desc: "Thick savoury sauce made from oyster extracts", where: "All supermarkets" },
  "shaoxing wine": { desc: "Chinese cooking rice wine — adds depth to stir-fries", where: "Asian markets or online" },
  "five-spice": { desc: "Chinese spice blend: star anise, cloves, cinnamon, Sichuan pepper, fennel", where: "All supermarkets, Asian markets" },
  "za'atar": { desc: "Middle Eastern herb blend of thyme, sumac, and sesame", where: "Middle Eastern shops, specialty stores" },
  "sumac": { desc: "Tangy, lemony Middle Eastern spice from dried berries", where: "Middle Eastern shops, specialty stores" },
  "harissa": { desc: "North African chilli paste with cumin and coriander", where: "Middle Eastern shops, most supermarkets" },
  "ras el hanout": { desc: "Moroccan spice blend — complex, aromatic, slightly sweet", where: "Specialty stores or online" },
  "preserved lemon": { desc: "Salt-cured lemons with intense tangy flavour — rinse before use", where: "Middle Eastern shops, specialty stores" },
  "tamarind": { desc: "Sour, fruity paste from tamarind pods — used across Asian and Latin cuisines", where: "Asian or Indian markets, online" },
  "amchur": { desc: "Dried green mango powder — adds sour, fruity notes", where: "Indian grocery stores" },
  "curry leaves": { desc: "Aromatic Indian leaves — distinct flavour, not related to curry powder", where: "Indian grocery stores" },
  "asafoetida": { desc: "Pungent resin spice — sharp raw, mellows beautifully when cooked", where: "Indian grocery stores" },
  "ghee": { desc: "Clarified butter from Indian cooking — high smoke point, rich flavour", where: "Indian grocery stores or health food stores" },
  "paneer": { desc: "Fresh Indian cheese that stays firm when cooked", where: "Indian grocery stores or some supermarkets" },
  "fenugreek": { desc: "Bitter, maple-flavoured seeds or dried leaves", where: "Indian grocery stores" },
  "nutritional yeast": { desc: "Deactivated yeast with cheesy, nutty flavour — popular in vegan cooking", where: "Health food stores or online" },
  "aquafaba": { desc: "Liquid from canned chickpeas — works as an egg white substitute", where: "The liquid in any can of chickpeas" },
  "arrowroot": { desc: "Starch thickener — lighter than cornstarch, clear when cooked", where: "Health food stores or baking aisles" },
  "polenta": { desc: "Coarsely ground cornmeal — Italian comfort food staple", where: "Italian delis, most supermarkets" },
  "farro": { desc: "Ancient Italian wheat grain — nutty flavour with chewy texture", where: "Italian delis, health food stores" },
  "tempeh": { desc: "Fermented soybean cake — nutty flavour, firm texture, high protein", where: "Health food stores or supermarkets" },
  "jackfruit": { desc: "Tropical fruit — when unripe, shreds like pulled meat", where: "Asian markets, health food stores" },
  "lemongrass": { desc: "Citrusy, fragrant Southeast Asian grass — use pale inner stalks only", where: "Asian markets or supermarket produce aisle" },
  "galangal": { desc: "Root similar to ginger but more piney and peppery — used in Thai cooking", where: "Asian markets" },
  "kaffir lime leaves": { desc: "Fragrant lime leaves essential in Thai and Indonesian cooking", where: "Asian markets, sometimes frozen" },
  "shrimp paste": { desc: "Fermented shrimp condiment — very pungent, adds deep umami base", where: "Asian markets" },
  "black garlic": { desc: "Slow-fermented garlic — sweet, molasses-like flavour, very mild", where: "Specialty grocers or online" },
  "creme fraiche": { desc: "French cultured cream — thick, tangy, stable when heated", where: "Most supermarkets" },
  "calabrian chili": { desc: "Italian dried chilli from Calabria — fruity heat, great in pasta", where: "Italian delis or online" },
  "nduja": { desc: "Spreadable spicy Calabrian pork salami — melts into sauces", where: "Italian delis or specialty stores" },
  "guanciale": { desc: "Italian cured pork cheek — fattier and richer than pancetta", where: "Italian delis" },
  "pancetta": { desc: "Italian cured pork belly — like bacon but unsmoked", where: "Italian delis, most supermarkets" },
  "pecorino": { desc: "Sharp Italian sheep's milk cheese — saltier than Parmesan", where: "Italian delis, most supermarkets" },
  "burrata": { desc: "Fresh Italian cheese — mozzarella shell filled with creamy curd", where: "Italian delis, specialty grocers" },
  "labneh": { desc: "Strained yogurt cheese — thick, creamy, tangy", where: "Middle Eastern shops or make at home" },
  "freekeh": { desc: "Roasted green wheat grain — smoky, nutty flavour", where: "Middle Eastern shops or health food stores" },
  "pomegranate molasses": { desc: "Thick, tangy-sweet syrup from reduced pomegranate juice", where: "Middle Eastern shops, specialty stores" },
  "rose water": { desc: "Fragrant distilled rose extract used in Middle Eastern and South Asian sweets", where: "Supermarkets, Middle Eastern shops, pharmacies" },
  "orange blossom water": { desc: "Fragrant orange flower distillate — used in pastries and drinks", where: "Middle Eastern shops, specialty stores" },
  "teff": { desc: "Tiny Ethiopian grain — nutty flavour, high in iron and calcium", where: "Health food stores or online" },
  "maca powder": { desc: "Peruvian root powder with earthy, butterscotch notes", where: "Health food stores or online" },
  "matcha": { desc: "Finely ground Japanese green tea powder — earthy and slightly bitter", where: "Asian markets, specialty stores, most supermarkets" },
  "yuzu": { desc: "Japanese citrus fruit — fragrant mix of lemon, lime and grapefruit", where: "Asian markets; juice available bottled" },
  "dashi powder": { desc: "Instant Japanese stock powder — quick umami base", where: "Asian markets or supermarket international aisle" },
  "togarashi": { desc: "Japanese seven-spice blend — citrusy heat", where: "Asian markets or supermarket Asian aisle" },
  "furikake": { desc: "Japanese seasoning blend for rice — sesame, nori, and more", where: "Asian markets" },
};

function findInfo(name: string): { desc: string; where: string } | null {
  const lower = name.toLowerCase();
  for (const [key, info] of Object.entries(INGREDIENT_INFO)) {
    if (lower.includes(key)) return info;
  }
  return null;
}

interface Props {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function IngredientTooltip({ name, className, style }: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const spanRef = useRef<HTMLSpanElement>(null);
  const info = findInfo(name);

  if (!info) {
    return (
      <span className={className} style={style}>
        {name}
      </span>
    );
  }

  function show() {
    if (!spanRef.current) return;
    const r = spanRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + window.scrollY + 6, left: Math.min(r.left + window.scrollX, window.innerWidth - 280) });
    setVisible(true);
  }

  return (
    <>
      <span
        ref={spanRef}
        className={className}
        style={{ ...style, borderBottom: "1px dashed rgba(200,82,42,0.55)", cursor: "help" }}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
      >
        {name}
      </span>
      {visible && (
        <div
          className="fixed z-[9999] w-64 rounded-xl shadow-2xl pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            background: "#1C1209",
            border: "1px solid rgba(200,82,42,0.35)",
            padding: "10px 13px",
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#EFE3CE" }}>{name}</p>
          <p className="text-xs leading-relaxed mb-1.5" style={{ color: "#A69180" }}>{info.desc}</p>
          <p className="text-xs font-medium" style={{ color: "#C8522A" }}>📍 {info.where}</p>
        </div>
      )}
    </>
  );
}
