"use client";

import { useState } from "react";
import { ImportPreviewModal } from "../../import-preview-modal";
import type { ExternalRecipe } from "@/lib/external-sources/adapters";

export function SaveButton({ recipe }: { recipe: ExternalRecipe }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold px-4 py-2 rounded-full"
        style={{ background: "#C8522A", color: "#fff" }}
      >
        Save to cookbook
      </button>
      {open && <ImportPreviewModal recipe={recipe} onClose={() => setOpen(false)} />}
    </>
  );
}
