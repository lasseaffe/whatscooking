"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CUISINES } from "@/lib/cuisines";

interface Props {
  intervalMs?: number;
  onCuisineSelect?: (slug: string) => void;
}

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "";
  const base = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)));
}

export function CuisineRotator({ intervalMs = 6000, onCuisineSelect }: Props) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % CUISINES.length);
    }, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, intervalMs]);

  const featured = CUISINES[featuredIndex];

  function handleChipClick(slug: string, index: number) {
    setFeaturedIndex(index);
    if (onCuisineSelect) {
      onCuisineSelect(slug);
    } else {
      router.push(`/cuisines/${slug}`);
    }
  }

  return (
    <div
      className="px-4 py-5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2
          className="font-bold"
          style={{
            color: "#EFE3CE",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 16,
          }}
        >
          🌍 World Cuisines
        </h2>
        <Link
          href="/cuisines"
          className="text-xs font-semibold"
          style={{ color: "#F4A261" }}
        >
          See all →
        </Link>
      </div>

      {/* Featured hero card — rotates every 6s, gradient background */}
      <Link
        href={`/cuisines/${featured.slug}`}
        className="relative rounded-xl overflow-hidden mb-3 flex items-center block transition-opacity hover:opacity-90"
        style={{
          height: 90,
          background: `linear-gradient(135deg, ${featured.color}33 0%, ${featured.color}11 100%)`,
          border: `1px solid ${featured.color}44`,
        }}
      >
        {/* Large flag emoji — left, 50% opacity */}
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ fontSize: 40, opacity: 0.5, lineHeight: 1 }}
          aria-hidden="true"
        >
          {flagEmoji(featured.flag)}
        </span>

        {/* Right: label + name + tagline */}
        <div className="absolute inset-0 flex flex-col justify-center pl-20 pr-4">
          <p
            style={{
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "rgba(244,162,97,0.75)",
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            Featured cuisine
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#EFE3CE",
              lineHeight: 1.1,
              marginBottom: 3,
            }}
          >
            {featured.name}
          </p>
          <p
            style={{
              fontSize: 10,
              fontStyle: "italic",
              color: "rgba(239,227,206,0.6)",
              lineHeight: 1.3,
            }}
          >
            &ldquo;{featured.tagline}&rdquo;
          </p>
        </div>
      </Link>

      {/* Scrollable flag chip strip */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {CUISINES.map((cuisine, i) => (
          <button
            key={cuisine.slug}
            type="button"
            onClick={() => handleChipClick(cuisine.slug, i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 transition-all"
            style={{
              background:
                i === featuredIndex
                  ? `${cuisine.color}22`
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                i === featuredIndex
                  ? cuisine.color + "55"
                  : "rgba(255,255,255,0.08)"
              }`,
            }}
          >
            <span style={{ fontSize: 14 }}>{flagEmoji(cuisine.flag)}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: "nowrap",
                color:
                  i === featuredIndex ? "#EFE3CE" : "rgba(239,227,206,0.5)",
              }}
            >
              {cuisine.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
