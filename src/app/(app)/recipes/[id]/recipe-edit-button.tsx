"use client";

import { useState } from "react";
import { EditRecipeButton } from "@/components/edit-recipe-button";

interface Props {
  recipeId: string;
  initialTitle: string;
  initialDescription?: string | null;
  initialInstructions: string[];
}

export function RecipeEditButton({ recipeId, initialTitle, initialDescription, initialInstructions }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [instructions, setInstructions] = useState(initialInstructions);

  return (
    <EditRecipeButton
      recipeId={recipeId}
      initialTitle={title}
      initialDescription={description}
      initialInstructions={instructions}
      iconSize={14}
      onSaved={(t, d, ins) => {
        setTitle(t);
        setDescription(d);
        setInstructions(ins);
      }}
    />
  );
}
