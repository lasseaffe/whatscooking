"use client";

export function readCssVar(name: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || null;
}

export function toRgb(color: string): string | null {
  if (typeof window === "undefined") return null;
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = color;
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return computed || null;
}

export function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!m) return null;
  const [, r, g, b] = m;
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function resolveToHex(cssVar: string): string | null {
  const raw = readCssVar(cssVar);
  if (!raw) return null;
  const rgb = toRgb(raw);
  if (!rgb) return null;
  return rgbToHex(rgb);
}
