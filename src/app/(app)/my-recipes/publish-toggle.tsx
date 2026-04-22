"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PublishToggle({ recipeId, initialPublished }: { recipeId: string; initialPublished: boolean }) {
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("recipes").update({ is_published: !published }).eq("id", recipeId);
    setPublished((v) => !v);
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
      style={{
        borderColor: published ? "#2D7A4F" : "#E8D4C0",
        background: published ? "#F0FAF4" : "#fff",
        color: published ? "#2D7A4F" : "#6B5B52",
      }}>
      {published ? <><Globe className="w-3.5 h-3.5" /> Published — make private</> : <><Lock className="w-3.5 h-3.5" /> Publish this recipe</>}
    </button>
  );
}
