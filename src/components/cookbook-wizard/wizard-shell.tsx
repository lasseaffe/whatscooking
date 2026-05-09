// src/components/cookbook-wizard/wizard-shell.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepCover } from "./step-cover";
import { StepChapters } from "./step-chapters";
import { StepRecipes } from "./step-recipes";
import { StepPublish } from "./step-publish";
import type { CookbookFont } from "@/lib/cookbook-types";

export interface WizardDraft {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  cover_image_url: string;
  theme_color: string;
  title_font: CookbookFont;
  tagline: string;
  price: number;
  chapters: WizardChapter[];
}

export interface WizardChapter {
  id?: string;
  title: string;
  intro_text: string;
  cover_image_url: string;
  position: number;
  recipes: WizardRecipe[];
}

export interface WizardRecipe {
  id?: string;
  recipe_id: string;
  position: number;
  chef_note: string;
  creator_meal_photo_url: string;
  title: string;
  image_url: string | null;
}

const EMPTY_DRAFT: WizardDraft = {
  title: "", description: "", cover_image_url: "",
  theme_color: "#C85A2F", title_font: "serif", tagline: "",
  price: 0, chapters: [],
};

const STEPS = ["Cover", "Chapters", "Recipes", "Publish"];

export function WizardShell({ initialDraft }: { initialDraft?: Partial<WizardDraft> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>({ ...EMPTY_DRAFT, ...initialDraft });
  const [saving, setSaving] = useState(false);

  function updateDraft(patch: Partial<WizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function saveDraft(status: "draft" | "published" = "draft") {
    setSaving(true);
    const slug = draft.slug ?? draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    const method = draft.id ? "PATCH" : "POST";
    const url = draft.id ? `/api/cookbooks/${draft.slug}` : "/api/cookbooks";

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, slug, status }),
    });
    if (!res.ok) { setSaving(false); return null; }
    const saved = await res.json();

    for (let ci = 0; ci < draft.chapters.length; ci++) {
      const ch = draft.chapters[ci];
      const chRes = ch.id
        ? await fetch(`/api/cookbooks/${saved.slug}/chapters/${ch.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: ch.title, intro_text: ch.intro_text, cover_image_url: ch.cover_image_url, position: ci }),
          })
        : await fetch(`/api/cookbooks/${saved.slug}/chapters`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: ch.title, intro_text: ch.intro_text, cover_image_url: ch.cover_image_url, position: ci }),
          });
      if (!chRes.ok) continue;
      const savedChapter = await chRes.json();

      for (let ri = 0; ri < ch.recipes.length; ri++) {
        const r = ch.recipes[ri];
        if (r.id) {
          await fetch(`/api/cookbooks/${saved.slug}/chapters/${savedChapter.id}/recipes/${r.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chef_note: r.chef_note, creator_meal_photo_url: r.creator_meal_photo_url, position: ri }),
          });
        } else {
          await fetch(`/api/cookbooks/${saved.slug}/chapters/${savedChapter.id}/recipes`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_id: r.recipe_id, position: ri, chef_note: r.chef_note, creator_meal_photo_url: r.creator_meal_photo_url }),
          });
        }
      }
    }
    setSaving(false);
    return saved;
  }

  async function handlePublish() {
    const saved = await saveDraft("published");
    if (saved) router.push(`/cookbooks/${saved.slug}`);
  }

  const stepProps = { draft, updateDraft, saving };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button onClick={() => i < step && setStep(i)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: i === step ? "#C85A2F" : i < step ? "#3D2817" : "#C4A882" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: i <= step ? (i === step ? "#C85A2F" : "#3D2817") : "#F5E6D3", color: i <= step ? "#fff" : "#C4A882" }}>
                {i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="w-8 h-px mx-2" style={{ background: "#F5E6D3" }} />}
          </div>
        ))}
      </div>

      {step === 0 && <StepCover {...stepProps} onNext={() => setStep(1)} />}
      {step === 1 && <StepChapters {...stepProps} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepRecipes {...stepProps} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepPublish {...stepProps} onBack={() => setStep(2)} onSaveDraft={() => saveDraft("draft")} onPublish={handlePublish} />}
    </div>
  );
}
