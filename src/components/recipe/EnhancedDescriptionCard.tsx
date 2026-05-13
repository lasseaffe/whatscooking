"use client";

import { Globe, ChefHat, Sparkles, Users, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import type { EnhancedDescription } from "@/lib/types";

interface Props {
  description: EnhancedDescription;
  compact?: boolean;
}

const SKILL_LABEL: Record<EnhancedDescription["effort"]["skill_level"], string> = {
  beginner: "Beginner-friendly",
  intermediate: "Intermediate technique",
  advanced: "Advanced — judgement calls",
};

const SKILL_COLOR: Record<EnhancedDescription["effort"]["skill_level"], string> = {
  beginner: "#86EFAC",
  intermediate: "#F4A261",
  advanced: "#F87171",
};

export function EnhancedDescriptionCard({ description, compact }: Props) {
  const d = description;
  return (
    <div className={compact ? "" : "rounded-2xl border p-5"} style={compact ? undefined : { borderColor: "#3A2A20", background: "#1A1410" }}>
      {/* Headnote — the editorial hero paragraph */}
      <p
        className="leading-relaxed"
        style={{
          color: "#D9C5B2",
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: "1.0625rem",
          lineHeight: 1.75,
          maxWidth: "62ch",
          whiteSpace: "pre-line",
        }}
      >
        {d.headnote_narrative}
      </p>

      {/* Fact row — icon-led structured data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 pt-5" style={{ borderTop: "1px solid #2A2020" }}>
        <Row icon={<Globe className="w-3.5 h-3.5" />} label={d.origin.cuisine.toUpperCase()} body={d.origin.tradition} />
        <Row icon={<ChefHat className="w-3.5 h-3.5" />} label="TECHNIQUE" body={d.technique_signature} />
        <Row icon={<Sparkles className="w-3.5 h-3.5" />} label="FLAVOR" body={d.ingredient_signature} />
        <Row icon={<Users className="w-3.5 h-3.5" />} label="FOR" body={d.audience} />
      </div>

      <div className="mt-4 pt-4 flex flex-wrap items-center gap-3 text-xs" style={{ borderTop: "1px solid #2A2020" }}>
        <span className="inline-flex items-center gap-1.5" style={{ color: "#C9B89A" }}>
          <Clock className="w-3.5 h-3.5" style={{ color: "#F4A261" }} />
          {d.effort.time_feel}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "rgba(244,162,97,0.08)", color: SKILL_COLOR[d.effort.skill_level] }}>
          {SKILL_LABEL[d.effort.skill_level]}
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: d.effort.forgiving ? "#86EFAC" : "#F87171" }}>
          {d.effort.forgiving ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          {d.effort.forgiving ? "Forgiving — mistakes recover" : "Unforgiving — watch the cues"}
        </span>
      </div>
    </div>
  );
}

function Row({ icon, label, body }: { icon: React.ReactNode; label: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-1" style={{ color: "#F4A261" }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-widest" style={{ color: "#8A6A4A" }}>{label}</p>
        <p className="text-sm leading-relaxed mt-0.5" style={{ color: "#C9B89A", lineHeight: 1.6 }}>{body}</p>
      </div>
    </div>
  );
}