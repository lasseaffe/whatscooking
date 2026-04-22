"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES } from "@/lib/language-context";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all hover:border-orange-300"
        style={{ borderColor: "#E8D4C0", color: "#6B5B52", background: "#FFF8F3" }}
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3" style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border shadow-lg overflow-hidden z-50"
          style={{ borderColor: "#E8D4C0", background: "#fff" }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-orange-50 transition-colors"
              style={{
                color: lang === l.code ? "#C85A2F" : "#3D2817",
                fontWeight: lang === l.code ? 600 : 400,
                background: lang === l.code ? "#FFF0E6" : "transparent",
              }}
            >
              <span className="text-sm">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
