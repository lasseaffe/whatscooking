"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Clock, Flame, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { ScrambleResult } from "@/app/api/pantry/scramble/route";
import { RecipeImage } from "@/components/recipe-image";

export function DashboardScramble() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ScrambleResult[]>([]);
  const [pantryEmpty, setPantryEmpty] = useState(false);

  useEffect(() => {
    fetch("/api/pantry/scramble")
      .then((r) => r.json())
      .then((json) => {
        setResults(json.results ?? []);
        setPantryEmpty(json.pantryEmpty ?? false);
      })
      .finally(() => setLoading(false));
  }, []);

  const canMakeNow = results.filter((r) => r.canMakeNow);
  const others = results.filter((r) => !r.canMakeNow).slice(0, 6 - canMakeNow.length);
  const topResults = [...canMakeNow, ...others].slice(0, 6);

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: canMakeNow.length > 0 ? "color-mix(in srgb, var(--wc-pal-accent) 25%, transparent)" : "var(--wc-border-default)",
        background: "var(--bg-base)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left transition-all"
        style={{ background: open ? "var(--bg-secondary)" : "var(--bg-base)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--wc-pal-accent)" }}
        >
          <Shuffle className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="font-bold text-lg leading-tight"
              style={{ color: "var(--fg-primary)", fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              What can I scramble together?
            </span>
            {!loading && canMakeNow.length > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#0D1A0D", color: "#22c55e", border: "1px solid #22c55e30" }}
              >
                <Sparkles className="w-3 h-3" />
                {canMakeNow.length} ready to cook!
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--wc-pal-mid)" }}>
            {loading
              ? "Checking your pantry…"
              : results.length > 0
              ? `${results.length} recipes sorted by what you already have`
              : "Find recipes from your pantry — no shopping needed"}
          </p>
        </div>

        <div className="shrink-0" style={{ color: "var(--wc-pal-dark)" }}>
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 pt-3" style={{ background: "var(--bg-base)" }}>
          {loading ? (
            /* Simmering loading state */
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <SimmeringPotLoader />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--fg-primary)", fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                  Simmering ideas…
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--wc-pal-dark)" }}>
                  Checking what you can cook right now
                </p>
              </div>
            </div>
          ) : pantryEmpty ? (
            <div className="rounded-xl border p-10 text-center" style={{ borderColor: "var(--wc-border-default)", borderStyle: "dashed" }}>
              <p className="text-sm mb-3" style={{ color: "var(--wc-pal-mid)" }}>
                Add ingredients to your pantry to find what you can make.
              </p>
              <button
                onClick={() => router.push("/pantry")}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all btn-primary-glow"
                style={{ background: "var(--wc-pal-accent)", color: "#fff" }}
              >
                Go to Pantry
              </button>
            </div>
          ) : (
            <>
              {canMakeNow.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                    style={{ color: "#22c55e" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    You have all ingredients for these
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {canMakeNow.slice(0, 3).map((r) => (
                      <ScrambleCard key={r.id} result={r} onNavigate={() => router.push(`/recipes/${r.id}`)} highlight />
                    ))}
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div>
                  {canMakeNow.length > 0 && (
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--wc-pal-dark)" }}>
                      Almost there — a few ingredients missing
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {others.map((r) => (
                      <ScrambleCard key={r.id} result={r} onNavigate={() => router.push(`/recipes/${r.id}`)} />
                    ))}
                  </div>
                </div>
              )}

              {results.length > 6 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push("/pantry")}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-0.5"
                    style={{ borderColor: "var(--wc-border-default)", color: "var(--wc-pal-accent)", background: "var(--bg-base)" }}
                  >
                    See all {results.length} matches in Pantry →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Simmering Pot SVG Loader ─────────────────────────────────── */
function SimmeringPotLoader() {
  return (
    <svg width="120" height="140" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          @keyframes wc-steam { 0%{opacity:0;transform:translateY(0) scaleX(1)} 25%{opacity:0.55} 100%{opacity:0;transform:translateY(-22px) scaleX(1.5)} }
          @keyframes wc-bubble { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.15) translateY(-3px)} }
          @keyframes wc-flame { 0%,100%{transform:scaleY(1) scaleX(1)} 35%{transform:scaleY(0.88) scaleX(1.06)} 65%{transform:scaleY(1.06) scaleX(0.96)} }
          @keyframes wc-lid { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        `}</style>
        <radialGradient id="wcp-copper" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#E8A060"/><stop offset="45%" stopColor="#C07038"/><stop offset="100%" stopColor="#6A300A"/>
        </radialGradient>
        <radialGradient id="wcp-lid" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#D08848"/><stop offset="100%" stopColor="#82400C"/>
        </radialGradient>
        <radialGradient id="wcp-stew" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#C84020"/><stop offset="100%" stopColor="#8A1008"/>
        </radialGradient>
        <linearGradient id="wcp-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A05820"/><stop offset="100%" stopColor="#602806"/>
        </linearGradient>
        <linearGradient id="wcp-flame-b" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#0848C0"/><stop offset="55%" stopColor="#3070F0"/><stop offset="100%" stopColor="#88B8FF" stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id="wcp-flame-o" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#D04000"/><stop offset="100%" stopColor="#FFC840" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Steam */}
      {[82,100,118].map((x,i)=>(
        <path key={x} d={`M${x} 40 C${x-4} 32 ${x+4} 24 ${x} 16`} stroke="#5A3A20" strokeWidth="2.5" strokeLinecap="round" fill="none"
          style={{animation:`wc-steam 2.4s ease-out infinite`,animationDelay:`${i*0.45}s`,transformOrigin:`${x}px 28px`}}/>
      ))}
      {/* Burner */}
      <ellipse cx="100" cy="212" rx="68" ry="13" fill="#100808"/>
      <ellipse cx="100" cy="212" rx="50" ry="8.5" fill="#0A0606"/>
      <line x1="100" y1="200" x2="100" y2="224" stroke="#1E1010" strokeWidth="2"/>
      <line x1="72" y1="203" x2="128" y2="221" stroke="#1E1010" strokeWidth="2"/>
      <line x1="128" y1="203" x2="72" y2="221" stroke="#1E1010" strokeWidth="2"/>
      {/* Flames */}
      <g style={{transformOrigin:"100px 205px",animation:"wc-flame 0.9s ease-in-out infinite"}}>
        <path d="M58 208 C54 188 47 174 51 159 C55 144 65 149 66 163 C67 177 63 190 65 208Z" fill="url(#wcp-flame-b)" opacity="0.9"/>
        <path d="M74 208 C70 189 64 175 68 161 C72 147 81 152 82 165 C83 178 79 191 81 208Z" fill="url(#wcp-flame-b)" opacity="0.95"/>
        <path d="M93 208 C89 184 82 167 87 150 C92 133 108 133 113 150 C118 167 111 184 107 208Z" fill="url(#wcp-flame-b)"/>
        <path d="M95 208 C92 188 87 174 91 162 C95 150 105 150 109 162 C113 174 108 188 105 208Z" fill="url(#wcp-flame-o)" opacity="0.6"/>
        <path d="M119 208 C121 189 127 175 124 161 C121 147 112 152 111 165 C110 178 113 191 111 208Z" fill="url(#wcp-flame-b)" opacity="0.95"/>
        <path d="M135 208 C139 188 146 174 141 159 C136 144 126 149 125 163 C124 177 128 190 126 208Z" fill="url(#wcp-flame-b)" opacity="0.9"/>
      </g>
      {/* Pot body */}
      <path d="M44 90 C38 122,36 158,40 182 Q100 194 160 182 C164 158,162 122,156 90 Q100 84 44 90Z" fill="url(#wcp-copper)"/>
      <path d="M56 110 Q63 97 81 93" stroke="rgba(240,180,100,0.35)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M148 158 Q155 170 156 182" stroke="rgba(30,10,0,0.2)" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Stew */}
      <ellipse cx="100" cy="90" rx="58" ry="11" fill="url(#wcp-stew)"/>
      {[[85,88,5,0],[105,86,3.5,0.55],[117,90,4,0.9],[73,91,2.5,0.3]].map(([cx,cy,r,d])=>(
        <circle key={String(cx)} cx={cx} cy={cy} r={r} fill="#E06040"
          style={{animation:"wc-bubble 1.8s ease-in-out infinite",animationDelay:`${d}s`,transformOrigin:`${cx}px ${cy}px`}}/>
      ))}
      {/* Handles */}
      <path d="M42 134 Q22 134 20 119 Q18 104 36 103 L43 105" stroke="url(#wcp-handle)" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M158 134 Q178 134 180 119 Q182 104 164 103 L157 105" stroke="url(#wcp-handle)" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Lid */}
      <g style={{animation:"wc-lid 2.2s ease-in-out infinite"}}>
        <path d="M42 90 Q100 60 158 90" fill="url(#wcp-lid)"/>
        <ellipse cx="100" cy="90" rx="58" ry="11" fill="#B87038"/>
        <path d="M53 88 Q100 82 147 88" stroke="rgba(240,180,100,0.3)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <ellipse cx="100" cy="63" rx="10" ry="4.5" fill="#7A3A0C"/>
        <ellipse cx="100" cy="59" rx="10" ry="6" fill="url(#wcp-lid)"/>
        <ellipse cx="97" cy="57" rx="4.5" ry="2.8" fill="rgba(240,180,100,0.38)"/>
      </g>
      {/* Chef hat emboss */}
      <g transform="translate(100,148)" opacity="0.12" fill="#6A3810">
        <ellipse cx="0" cy="10" rx="15" ry="4.5"/><rect x="-12" y="2" width="24" height="9" rx="1.5"/><ellipse cx="0" cy="-8" rx="10" ry="13"/>
      </g>
    </svg>
  );
}

/* ── Scramble Card ─────────────────────────────────────────────── */
function ScrambleCard({
  result,
  onNavigate,
  highlight = false,
}: {
  result: ScrambleResult;
  onNavigate: () => void;
  highlight?: boolean;
}) {
  const pct = Math.round((result.haveCount / result.totalIngredients) * 100);
  const totalTime = (result.prep_time_minutes ?? 0) + (result.cook_time_minutes ?? 0);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => e.key === "Enter" && onNavigate()}
      className="cursor-pointer rounded-xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
      style={{
        border: `1px solid ${highlight ? "rgba(34,197,94,0.19)" : "var(--wc-border-default)"}`,
        background: highlight ? "rgba(34,197,94,0.06)" : "var(--bg-secondary)",
      }}
    >
      <div className="h-32 relative overflow-hidden">
        <RecipeImage
          recipeId={result.id}
          imageUrl={result.image_url}
          title={result.title}
          cuisine={result.cuisine_type}
          dietaryTags={result.dietary_tags}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,9,7,0.65) 0%, transparent 50%)" }}/>
        <div
          className="absolute bottom-0 inset-x-0 py-1.5 text-center text-xs font-bold"
          style={{
            background: result.canMakeNow ? "rgba(22,163,74,0.88)" : "rgba(200,82,42,0.82)",
            color: "#fff",
          }}
        >
          {result.canMakeNow ? "✓ All ingredients in pantry" : `${pct}% of ingredients on hand`}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-semibold leading-snug flex-1" style={{ color: "var(--fg-primary)" }}>
            {result.title}
          </h3>
          {result.canMakeNow && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: result.canMakeNow ? "#22c55e" : "var(--wc-pal-accent)" }}
            />
          </div>
          <span className="text-xs shrink-0" style={{ color: "var(--wc-pal-dark)" }}>
            {result.haveCount}/{result.totalIngredients}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--wc-pal-dark)" }}>
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{totalTime}m
            </span>
          )}
          {result.calories && (
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />{result.calories}
            </span>
          )}
        </div>

        {!result.canMakeNow && result.missingIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.missingIngredients
              .filter((m) => m.criticality > 0.5)
              .slice(0, 2)
              .map((m) => (
                <span
                  key={m.name}
                  className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "#2A0D0D", color: "#EF4444" }}
                >
                  <AlertCircle className="w-2.5 h-2.5" />{m.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
