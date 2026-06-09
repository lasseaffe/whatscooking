"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, UtensilsCrossed, Popcorn } from "lucide-react";

interface MenuItem {
  recipeId?: string;
  title: string;
  imageUrl?: string | null;
  cuisineHref?: string;
}

interface MatchdayMenu {
  home: { code: string; flag: string; name: string };
  away: { code: string; flag: string; name: string };
  snacks: MenuItem[];
  homeDishes: MenuItem[];
  awayDishes: MenuItem[];
}

const SAFFRON = "#F4A261";
const PARCHMENT = "#EFE3CE";

function MenuRow({ item, accent }: { item: MenuItem; accent: string }) {
  const href = item.recipeId ? `/recipes/${item.recipeId}` : item.cuisineHref;
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.title}
          width={36}
          height={36}
          style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${accent}1A`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.9rem",
          }}
        >
          🍽️
        </span>
      )}
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: PARCHMENT, lineHeight: 1.25 }}>
        {item.title}
      </span>
      {href && (
        <span style={{ marginLeft: "auto", fontSize: "0.62rem", fontWeight: 700, color: accent, letterSpacing: "0.04em" }}>
          COOK →
        </span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

function MenuColumn({
  label,
  icon,
  items,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  accent: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ color: accent, display: "flex" }}>{icon}</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
          {label}
        </span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: "0.72rem", color: "rgba(239,227,206,0.4)", fontStyle: "italic", padding: "4px 2px" }}>
          Signature dishes coming soon
        </p>
      ) : (
        items.map((item, i) => <MenuRow key={`${item.title}-${i}`} item={item} accent={accent} />)
      )}
    </div>
  );
}

export function WcMatchdayMenu({
  home,
  away,
  homeColor = SAFFRON,
  awayColor = SAFFRON,
}: {
  home: string;
  away: string;
  homeColor?: string;
  awayColor?: string;
}) {
  const [menu, setMenu] = useState<MatchdayMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetch(`/api/world-cup/menu?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.menu) setMenu(json.menu);
        else setError(true);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [home, away]);

  async function share() {
    if (!menu) return;
    const text = `Matchday menu for ${menu.home.name} ${menu.home.flag} vs ${menu.away.flag} ${menu.away.name} — snacks + signature dishes. Cooking the World Cup on What's Cooking 🍿⚽`;
    const url = `${window.location.origin}/world-cup-2026/menu/${menu.home.code}-${menu.away.code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Matchday Menu", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
    } catch {
      /* user cancelled — no-op */
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "14px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              animation: "wc-menu-shimmer 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
        <style>{`@keyframes wc-menu-shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <p style={{ padding: "12px 4px", fontSize: "0.78rem", color: "rgba(239,227,206,0.5)" }}>
        Couldn&apos;t load this matchday menu. Try again shortly.
      </p>
    );
  }

  return (
    <div style={{ padding: "12px 2px 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <MenuColumn label="Half-time snacks" icon={<Popcorn size={13} />} items={menu.snacks} accent={SAFFRON} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <MenuColumn
            label={`${menu.home.flag} ${menu.home.name}`}
            icon={<UtensilsCrossed size={13} />}
            items={menu.homeDishes}
            accent={homeColor}
          />
          <MenuColumn
            label={`${menu.away.flag} ${menu.away.name}`}
            icon={<UtensilsCrossed size={13} />}
            items={menu.awayDishes}
            accent={awayColor}
          />
        </div>
      </div>

      <button
        onClick={share}
        style={{
          marginTop: 14,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "9px 12px",
          borderRadius: 12,
          background: "rgba(244,162,97,0.12)",
          border: "1px solid rgba(244,162,97,0.28)",
          color: SAFFRON,
          fontSize: "0.74rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <Share2 size={14} /> Share this matchday menu
      </button>
    </div>
  );
}
