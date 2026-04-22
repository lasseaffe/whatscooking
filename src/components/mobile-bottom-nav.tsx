"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, UtensilsCrossed, Calendar, ShoppingBasket,
  ChefHat, Heart, BookOpen, Globe, Shuffle, Target,
  PartyPopper, User, Settings, X, LogOut, Leaf,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDietaryMode } from "@/lib/dietary-mode-context";

const PRIMARY_TABS = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/discover",  label: "Recipes", icon: UtensilsCrossed },
  { href: "/plans",     label: "Plans",   icon: Calendar },
  { href: "/pantry",    label: "Pantry",  icon: ShoppingBasket },
];

const MORE_ITEMS = [
  { href: "/saved",          label: "Saved Recipes",   icon: Heart },
  { href: "/my-recipes",     label: "My Recipes",      icon: BookOpen },
  { href: "/swipe",          label: "Meal Swipe",      icon: Shuffle },
  { href: "/cuisines",       label: "World Cuisines",  icon: Globe },
  { href: "/calorie-tracker",label: "Nutrient Tracker",icon: Target },
  { href: "/dinner-parties", label: "Dinner Party",    icon: PartyPopper },
  { href: "/profile",        label: "Profile",         icon: User },
  { href: "/settings",       label: "Settings",        icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { active, restrictions, customAvoid } = useDietaryMode();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const restrictionCount = restrictions.length + (customAvoid?.length ?? 0);

  return (
    <>
      {/* ── Bottom sheet backdrop ── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(13,9,5,0.72)", backdropFilter: "blur(6px)" }}
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── Bottom sheet ── */}
      <div
        className="fixed left-0 right-0 z-50 transition-all duration-300 ease-out"
        style={{
          bottom: sheetOpen ? 0 : "-100%",
          background: "#161009",
          borderTop: "1px solid #3A2416",
          borderRadius: "20px 20px 0 0",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 32, height: 32, background: "linear-gradient(135deg, #B07D56, #5F3E2D)" }}
            >
              <ChefHat style={{ width: 16, height: 16, color: "#fff" }} />
            </div>
            <span
              className="font-bold text-sm"
              style={{ color: "#EFE3CE", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              What&apos;s Cooking
            </span>
          </div>
          <button
            onClick={() => setSheetOpen(false)}
            className="flex items-center justify-center rounded-full"
            style={{ width: 30, height: 30, background: "#2A1808", color: "#8A6A4A" }}
            aria-label="Close menu"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Scrollable items */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "60vh", padding: "8px 12px" }}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
                  style={{
                    background: active ? "rgba(42,24,8,0.8)" : "transparent",
                    color: active ? "#F4A261" : "#9A7A58",
                    border: active ? "1px solid rgba(200,82,42,0.2)" : "1px solid transparent",
                  }}
                >
                  <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider + sign out */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #2A1A0C" }}>
            {active && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                style={{ background: "rgba(176,125,86,0.1)", border: "1px solid rgba(176,125,86,0.2)" }}
              >
                <Leaf style={{ width: 14, height: 14, color: "#B07D56" }} />
                <span className="text-xs font-medium" style={{ color: "#B07D56" }}>
                  {restrictionCount} dietary filter{restrictionCount !== 1 ? "s" : ""} active
                </span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-3 transition-colors"
              style={{ color: "#6B4E36" }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden"
        style={{
          background: "rgba(18,10,5,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid #2A1A0C",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Main navigation"
      >
        {/* Primary tabs */}
        {PRIMARY_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-opacity"
              style={{ color: active ? "#F4A261" : "#6B4E36" }}
              aria-current={active ? "page" : undefined}
            >
              <Icon style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.02em" }}>
                {label}
              </span>
              {/* Active dot */}
              {active && (
                <span
                  className="absolute"
                  style={{
                    bottom: "calc(env(safe-area-inset-bottom, 0px) + 2px)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#F4A261",
                  }}
                />
              )}
            </Link>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-opacity"
          style={{ color: sheetOpen ? "#F4A261" : "#6B4E36", background: "transparent", border: "none" }}
          aria-label="More navigation options"
          aria-expanded={sheetOpen}
        >
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", display: "block" }}
              />
            ))}
          </div>
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.02em" }}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}
