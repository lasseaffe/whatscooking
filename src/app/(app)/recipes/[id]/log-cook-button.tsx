"use client";

import { useState } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { springGentle } from "@/lib/motion";
import { CookLogSheet } from "@/components/cook-log-sheet";

interface LogCookButtonProps {
  recipeId: string;
  recipeTitle: string;
}

export function LogCookButton({ recipeId, recipeTitle }: LogCookButtonProps) {
  const [loading, setLoading] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleLog() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cook-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, recipe_title: recipeTitle, source: "recipe_page" }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setLogId(id);
        setSheetOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={springGentle}
        onClick={handleLog}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "rgba(200,90,47,0.12)", border: "1px solid rgba(200,90,47,0.3)", color: "#C85A2F" }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
        Log a cook
      </motion.button>

      {logId && (
        <CookLogSheet
          logId={logId}
          recipeTitle={recipeTitle}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
