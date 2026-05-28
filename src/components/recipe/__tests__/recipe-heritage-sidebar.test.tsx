/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { RecipeHeritageSidebar } from "../recipe-heritage-sidebar";
import type { HeritageNotes } from "@/lib/types";

const notes: HeritageNotes = {
  originStory:
    "Vienna 1683 — bakers shaped pastries into crescents to mark the Ottoman retreat.",
  culturalOccasion: "Morning café ritual · Sunday breakfast",
  keyIngredientNote:
    "Butter lamination is distinctly French — a deliberate transformation of the simpler Viennese kipferl.",
};

describe("RecipeHeritageSidebar", () => {
  it("renders nothing when notes are null", () => {
    const { container } = render(
      <RecipeHeritageSidebar notes={null} cuisineSlug="french" cuisineName="French" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders HERITAGE NOTES label", () => {
    render(
      <RecipeHeritageSidebar notes={notes} cuisineSlug="french" cuisineName="French" />
    );
    expect(screen.getByText("HERITAGE NOTES")).toBeInTheDocument();
  });

  it("renders origin story text", () => {
    render(
      <RecipeHeritageSidebar notes={notes} cuisineSlug="french" cuisineName="French" />
    );
    expect(
      screen.getByText(/Vienna 1683.*bakers shaped pastries/)
    ).toBeInTheDocument();
  });

  it("renders cultural occasion", () => {
    render(
      <RecipeHeritageSidebar notes={notes} cuisineSlug="french" cuisineName="French" />
    );
    expect(screen.getByText(/Morning café ritual/)).toBeInTheDocument();
  });

  it("renders key ingredient note", () => {
    render(
      <RecipeHeritageSidebar notes={notes} cuisineSlug="french" cuisineName="French" />
    );
    expect(screen.getByText(/Butter lamination/)).toBeInTheDocument();
  });

  it("renders a link back to the cuisine page", () => {
    render(
      <RecipeHeritageSidebar notes={notes} cuisineSlug="french" cuisineName="French" />
    );
    const link = screen.getByRole("link", { name: /French Cuisine/ });
    expect(link).toHaveAttribute("href", "/cuisines/french");
  });
});
