"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat, UtensilsCrossed, ShoppingBasket, Calendar, PartyPopper,
  Target, User, LogOut, Heart, BookOpen, Shuffle, Globe,
  Leaf, X, Plus, ShieldAlert, ChevronRight, Settings, ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useDietaryMode } from "@/lib/dietary-mode-context";
import { DIETARY_LABELS, DIETARY_COLORS, type DietaryRestriction } from "@/lib/dietary-substitutions";
import { useState, useRef, useEffect, useCallback } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaletteSwitcher } from "@/components/palette-switcher";
import { DietaryFiltersPanel } from "@/components/dietary-filters-panel";

const RESTRICTIONS: DietaryRestriction[] = ["vegan", "vegetarian", "gluten-free", "dairy-free", "nut-free", "egg-free", "halal", "kosher"];

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  desc: string;
  children?: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; desc: string }>;
};

type NavGroup = { group: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Discovery",
    items: [
      {
        href: "/discover",
        label: "Recipes",
        icon: UtensilsCrossed,
        desc: "Browse all recipes",
        children: [
          { href: "/discover",   label: "Find Recipes",   icon: UtensilsCrossed, desc: "Browse all recipes" },
          { href: "/my-recipes", label: "My Recipes",     icon: BookOpen,        desc: "Recipes you created" },
          { href: "/saved",      label: "Saved Recipes",  icon: Heart,           desc: "Your favourites" },
          { href: "/swipe",      label: "Meal Swipe",     icon: Shuffle,         desc: "Swipe to discover" },
          { href: "/cuisines",   label: "World Cuisines", icon: Globe,           desc: "Browse by origin" },
        ],
      },
    ],
  },
  {
    group: "Planning",
    items: [
      {
        href: "/plans",
        label: "Meal Plans",
        icon: Calendar,
        desc: "Plan your week with balanced meal schedules.",
      },
      {
        href: "/dinner-parties",
        label: "Dinner Party",
        icon: PartyPopper,
        desc: "Plan menus for groups.",
      },
      {
        href: "/events",
        label: "Event Planner",
        icon: PartyPopper,
        desc: "AI itinerary for any occasion.",
      },
    ],
  },
  {
    group: "Kitchen",
    items: [
      {
        href: "/pantry",
        label: "Kitchen Management",
        icon: ShoppingBasket,
        desc: "Track what's in your kitchen.",
        children: [
          { href: "/pantry",         label: "Kitchen Management", icon: ShoppingBasket, desc: "Track what's in your kitchen." },
          { href: "/shopping-list",  label: "My Shopping List",   icon: ShoppingCart,   desc: "Ingredients to buy" },
        ],
      },
      {
        href: "/calorie-tracker",
        label: "Nutrient Tracker",
        icon: Target,
        desc: "Log meals and track macros.",
      },
    ],
  },
];

// Flat list used for flyout lookups
const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

type FlyoutItem = { href: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; desc: string };
type FlyoutState = { key: string; top: number; items: readonly FlyoutItem[] } | null;

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { restrictions, customAvoid, toggleRestriction, clearRestrictions, addCustomAvoid, removeCustomAvoid, active } = useDietaryMode();
  const [customInput, setCustomInput] = useState("");
  const [showDietaryPicker, setShowDietaryPicker] = useState(false);
  const [showDietaryPanel, setShowDietaryPanel] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Flyout state — key + fixed Y coordinate
  const [flyout, setFlyout] = useState<FlyoutState>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const NAV_COLLAPSED_W = 70; // px — must match CSS

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);

  const schedulClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setFlyout(null), 380);
  }, [cancelClose]);

  useEffect(() => { setFlyout(null); }, [pathname]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  function openFlyout(key: string, el: HTMLElement, items: readonly FlyoutItem[]) {
    cancelClose();
    const rect = el.getBoundingClientRect();
    // Centre the flyout on the item, clamped to viewport
    const idealTop = rect.top;
    setFlyout({ key, top: idealTop, items: items! });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <style>{`
        .wc-nav {
          width: ${NAV_COLLAPSED_W}px;
          transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          flex-shrink: 0;
        }
        .wc-nav:hover,
        .wc-nav.wc-nav--flyout-open { width: 320px; }
        /* Delay collapse so cursor can move to flyout panel */
        .wc-nav:not(:hover):not(.wc-nav--flyout-open) {
          transition-delay: 0.15s;
        }

        /* Labels */
        .wc-lbl {
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.18s ease 0.04s, transform 0.18s ease 0.04s;
          white-space: nowrap;
          overflow: visible;
          flex: 1;
          min-width: 0;
        }
        .wc-nav:hover .wc-lbl,
        .wc-nav.wc-nav--flyout-open .wc-lbl { opacity: 1; transform: translateX(0); }

        /* Nav item description line — permanently hidden */
        .wc-item-desc {
          display: none;
        }

        /* Chevron */
        .wc-chev {
          opacity: 0;
          transition: opacity 0.18s ease;
          flex-shrink: 0;
          margin-left: auto;
        }
        .wc-nav:hover .wc-chev,
        .wc-nav.wc-nav--flyout-open .wc-chev { opacity: 0.7; }

        /* Nav item — inactive items at 50% opacity, active at 100% */
        .wc-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.7rem 0.9rem;
          border-radius: 12px;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--wc-text-4, #7A5A40);
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          height: auto;
          min-height: 0;
          text-align: left;
          transition: background 0.13s ease, color 0.13s ease, opacity 0.13s ease;
          overflow: visible;
          white-space: nowrap;
          opacity: 0.6;
        }
        /* Icon — slightly larger than label for optical balance */
        .wc-item-icon {
          margin-top: 1px;
          flex-shrink: 0;
          width: 24px !important;
          height: 24px !important;
        }
        .wc-item:hover, .wc-item.wc-hov {
          background: var(--wc-bg-hover, rgba(42,24,8,0.65));
          color: var(--wc-text-2, #D4A87A);
          opacity: 1;
        }
        .wc-item.wc-active {
          background: var(--wc-bg-active, rgba(42,24,8,0.8));
          color: var(--wc-accent-saffron, #F4A261);
          opacity: 1;
        }
        .wc-item.wc-active::before {
          content: '';
          position: absolute;
          left: 0; top: 18%; height: 64%;
          width: 3px;
          background: var(--wc-accent-saffron, #F4A261);
          border-radius: 0 2px 2px 0;
        }

        /* Bottom helpers */
        .wc-blbl {
          opacity: 0; max-width: 0; overflow: hidden;
          transition: opacity 0.18s ease, max-width 0.2s ease;
          white-space: nowrap;
        }
        .wc-nav:hover .wc-blbl { opacity: 1; max-width: 180px; }

        .wc-dietary-expanded { display: none; }
        .wc-nav:hover .wc-dietary-expanded,
        .wc-nav.wc-nav--flyout-open .wc-dietary-expanded { display: block; }
        .wc-dietary-collapsed { display: flex; }
        .wc-nav:hover .wc-dietary-collapsed,
        .wc-nav.wc-nav--flyout-open .wc-dietary-collapsed { display: none; }
        .wc-bottom-tools { display: none; gap: 8px; }
        .wc-nav:hover .wc-bottom-tools,
        .wc-nav.wc-nav--flyout-open .wc-bottom-tools { display: flex; }

        /* Flyout panel */
        .wc-flyout-panel {
          position: fixed;
          z-index: 9999;
          min-width: 230px;
          max-width: 260px;
          border-radius: 14px;
          border: 1px solid var(--wc-border-default, rgba(90,50,20,0.5));
          background: var(--wc-bg-base, rgba(14, 9, 5, 0.97));
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 28px 80px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4);
          padding: 6px;
          animation: wc-fo-in 0.2s cubic-bezier(0.22,1,0.36,1) both;
          transform-origin: left top;
        }
        @keyframes wc-fo-in {
          from { opacity: 0; transform: scale(0.93) translateX(-6px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
        /* Invisible bridge: fills the gap between nav edge and panel */
        .wc-flyout-bridge {
          position: fixed;
          z-index: 9998;
          /* width covers the gap + some overlap */
          width: 28px;
          background: transparent;
        }
        .wc-fo-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.75rem;
          border-radius: 9px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--wc-text-3, #9A7A58);
          text-decoration: none;
          transition: background 0.11s ease, color 0.11s ease;
        }
        .wc-fo-item:hover { background: var(--wc-bg-hover); color: var(--wc-text, #EFE3CE); }
        .wc-fo-item.wc-active { background: var(--wc-bg-active); color: var(--wc-accent-saffron, #F4A261); }
        .wc-fo-desc { font-size: 0.68rem; color: var(--wc-text-4, #5A3A28); margin-top: 1px; line-height: 1.2; }
        .wc-fo-head {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--wc-border-strong, #4A3020);
          padding: 6px 10px 4px;
        }

        /* Logo */
        @keyframes wc-wobble {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-10deg); }
          50%  { transform: rotate(7deg); }
          75%  { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
        .wc-logo:hover { animation: wc-wobble 0.4s ease; }
      `}</style>

      {/* ── Dietary Filters Panel (modal) ── */}
      {showDietaryPanel && (
        <DietaryFiltersPanel onClose={() => setShowDietaryPanel(false)} />
      )}

      {/* ── Flyout panel + bridge (rendered outside nav to avoid overflow clipping) ── */}
      {flyout && (
        <>
          {/* Invisible bridge fills gap between nav right-edge and panel left-edge */}
          <div
            className="wc-flyout-bridge"
            style={{
              left: NAV_COLLAPSED_W,
              top: flyout.top - 12,
              height: flyout.items.length * 54 + 48 + 24,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={schedulClose}
          />
          <div
            className="wc-flyout-panel"
            style={{ left: NAV_COLLAPSED_W + 12, top: flyout.top }}
            onMouseEnter={cancelClose}
            onMouseLeave={schedulClose}
          >
            <div className="wc-fo-head">{NAV_ITEMS.find(i => i.href === flyout.key)?.label}</div>
            {flyout.items.map((child) => {
              const ChildIcon = child.icon;
              const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`wc-fo-item${isActive ? " wc-active" : ""}`}
                  onClick={() => setFlyout(null)}
                >
                  <ChildIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <div>
                    <div>{child.label}</div>
                    <div className="wc-fo-desc">{child.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav
        ref={navRef}
        className={`wc-nav flex flex-col border-r h-screen sticky top-0 z-40${flyout ? " wc-nav--flyout-open" : ""}`}
        style={{ borderColor: "var(--wc-border-subtle)", background: "var(--wc-floor, #1F1B19)", overflow: "visible" }}
      >
        {/* ── Logo ── */}
        <div className="px-3 py-4 border-b shrink-0" style={{ borderColor: "var(--wc-border-subtle)", overflow: "hidden" }}>
          <Link href="/discover" className="flex items-center gap-2.5 min-w-0">
            <div
              className="wc-logo shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 42, height: 42, background: "linear-gradient(135deg, var(--wc-pal-accent, #B07D56), var(--wc-pal-mid, #5F3E2D))", flexShrink: 0 }}
            >
              <ChefHat style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <span className="wc-lbl font-bold" style={{ color: "var(--fg-primary)", fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "0.88rem" }}>
              What&apos;s Cooking
            </span>
          </Link>
        </div>

        {/* ── Nav items ── */}
        <div className="flex-1 px-1.5 py-3 flex flex-col gap-3" style={{ overflowY: "auto", overflowX: "visible", overflowAnchor: "none" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.group}>
              {/* Group label — visible only when sidebar is expanded */}
              <div className="wc-lbl px-2 mb-1" style={{ overflow: "hidden" }}>
                <span style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                  color: "var(--wc-accent-saffron, #F4A261)",
                  opacity: 0.65,
                }}>
                  {group.group}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const children = item.children;
                  const isActive = !children
                    ? (pathname === item.href || pathname.startsWith(item.href + "/"))
                    : children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
                  const isFlyoutOpen = flyout?.key === item.href;

                  return (
                    <div
                      key={item.href}
                      onMouseEnter={(e) => {
                        if (children) {
                          openFlyout(item.href, e.currentTarget as HTMLElement, children as readonly FlyoutItem[]);
                        } else {
                          schedulClose();
                        }
                      }}
                      onMouseLeave={() => {
                        if (children) schedulClose();
                      }}
                    >
                      <Link
                        href={item.href}
                        className={`wc-item${isActive ? " wc-active" : ""}${isFlyoutOpen ? " wc-hov" : ""}`}
                        title={item.label}
                        style={{ alignItems: "center", height: "auto", minHeight: 0 }}
                      >
                        <Icon className="wc-item-icon" style={{ width: 22, height: 22, flexShrink: 0 }} />
                        <div className="wc-lbl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 0, flex: 1, overflow: "visible", whiteSpace: "nowrap" }}>
                          <span>{item.label}</span>
                          {children && <ChevronRight style={{ width: 13, height: 13 }} className="wc-chev" />}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Profile & Settings — pinned below groups */}
          <div className="flex flex-col gap-0.5 mt-auto pt-2" style={{ borderTop: "1px solid var(--wc-border-subtle, rgba(90,50,20,0.25))" }}>
            {[
              { href: "/profile",  label: "Profile",  icon: User     },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href}
                  className={`wc-item${isActive ? " wc-active" : ""}`}
                  title={label}
                  style={{ alignItems: "center" }}>
                  <Icon className="wc-item-icon" style={{ width: 22, height: 22, flexShrink: 0 }} />
                  <span className="wc-lbl">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom section ── */}
        <div className="px-1.5 pb-3 flex flex-col gap-2 shrink-0" style={{ overflow: "visible" }}>

          {/* Dietary Filters — collapsed: icon-only button with badge */}
          <div className="wc-dietary-collapsed justify-center px-2 py-1">
            <button
              onClick={() => setShowDietaryPanel(true)}
              className="relative flex items-center justify-center rounded-xl transition-all hover:opacity-80"
              style={{
                width: 36,
                height: 36,
                background: active ? "color-mix(in srgb, var(--wc-pal-accent,#C08F68) 20%, var(--wc-bg-base,#2A1E10))" : "rgba(26,16,8,0.4)",
              }}
              title="Dietary Filters"
            >
              <Leaf style={{ width: 16, height: 16, color: active ? "var(--wc-pal-accent, #C08F68)" : "#5A3A28" }} />
              {/* Active count badge */}
              {active && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold rounded-full"
                  style={{
                    width: 16, height: 16, fontSize: "9px",
                    background: "var(--wc-pal-accent, #C08F68)",
                    border: "1.5px solid var(--wc-bg-base, #2A1E10)",
                  }}
                >
                  {restrictions.length + (customAvoid?.length ?? 0)}
                </span>
              )}
            </button>
          </div>

          {/* Dietary Filters — expanded: full button row with label + badge */}
          <div className="wc-dietary-expanded">
            <button
              onClick={() => setShowDietaryPanel(true)}
              className="wc-item w-full"
              style={{ alignItems: "center" }}
            >
              <div className="relative wc-item-icon">
                <Leaf style={{ width: 18, height: 18, color: active ? "var(--wc-pal-accent, #C08F68)" : "var(--wc-text-4, #7A5A40)" }} />
                {active && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white font-bold rounded-full"
                    style={{
                      width: 15, height: 15, fontSize: "8px",
                      background: "var(--wc-pal-accent, #C08F68)",
                      border: "1.5px solid var(--wc-bg-base, #2A1E10)",
                    }}
                  >
                    {restrictions.length + (customAvoid?.length ?? 0)}
                  </span>
                )}
              </div>
              <div className="wc-lbl flex items-center gap-2" style={{ overflow: "visible" }}>
                <span style={{ color: active ? "var(--wc-pal-accent, #C08F68)" : "var(--wc-text-4, #7A5A40)", fontSize: "0.8rem" }}>
                  Dietary Filters
                </span>
                {active && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: "color-mix(in srgb, var(--wc-pal-accent,#C08F68) 18%, transparent)",
                      color: "var(--wc-pal-accent, #C08F68)",
                      fontSize: "10px",
                    }}
                  >
                    {restrictions.length + (customAvoid?.length ?? 0)} active
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Palette quick-pick */}
          <div className="wc-dietary-expanded">
            <div className="px-1 pb-1">
              <PaletteSwitcher compact />
            </div>
          </div>

          {/* Theme toggle */}
          <div className="wc-bottom-tools px-1 items-center">
            <ThemeToggle variant="pill" />
          </div>

          {/* Sign out */}
          <button onClick={handleSignOut} className="wc-item" title="Sign out">
            <LogOut className="wc-item-icon" style={{ width: 22, height: 22 }} />
            <span className="wc-lbl">Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
