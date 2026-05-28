/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { HeritageAtlasSection } from "../heritage-atlas-section";
import type { CuisineInfo } from "@/lib/cuisines";

const FULL_CUISINE: CuisineInfo = {
  slug: "french",
  name: "French",
  flag: "FR",
  region: "Europe",
  tagline: "Butter, technique, and pure audacity.",
  description: "The mother cuisine.",
  keyDishes: ["Croissant", "Bouillabaisse"],
  color: "#2C4A8C",
  bg: "#EEF2FA",
  heroImage: "https://example.com/french.jpg",
  dbValues: ["French"],
  historyExtract: "French cuisine has shaped culinary culture worldwide.",
  historySource: "https://en.wikipedia.org/wiki/French_cuisine",
  stapleIngredients: [
    { emoji: "🧈", name: "Butter", note: "Cultural core" },
    { emoji: "🍷", name: "Wine", note: "Identity symbol" },
  ],
  coreTechniques: [
    { emoji: "🔥", name: "Confit", note: "Medieval preservation" },
    { emoji: "🥣", name: "Braise", note: "Low & slow" },
  ],
  culturalOccasions: ["☕ Morning café ritual", "🎭 Bastille Day feasts"],
  crossCultureBridges: [
    {
      dish: "Croissant",
      from: "Ottoman Empire via Vienna",
      story: "Viennese bakers shaped pastries into crescents to celebrate.",
      recipeMatch: "croissant",
    },
  ],
};

const MINIMAL_CUISINE: CuisineInfo = {
  slug: "italian",
  name: "Italian",
  flag: "IT",
  region: "Europe",
  tagline: "Simple ingredients, serious love.",
  description: "Italy gave us pizza.",
  keyDishes: ["Pizza", "Pasta"],
  color: "#C0392B",
  bg: "#FDEDEC",
  heroImage: "https://example.com/italian.jpg",
  dbValues: ["Italian"],
};

describe("HeritageAtlasSection", () => {
  it("renders nothing when no heritage fields are present", () => {
    const { container } = render(<HeritageAtlasSection cuisine={MINIMAL_CUISINE} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the history extract when provided", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    expect(screen.getByText(/French cuisine has shaped culinary culture worldwide/)).toBeInTheDocument();
  });

  it("renders staple ingredient names", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    expect(screen.getByText("Butter")).toBeInTheDocument();
    expect(screen.getByText("Wine")).toBeInTheDocument();
  });

  it("renders core technique names", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    expect(screen.getByText("Confit")).toBeInTheDocument();
    expect(screen.getByText("Braise")).toBeInTheDocument();
  });

  it("renders cultural occasions", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    expect(screen.getByText("☕ Morning café ritual")).toBeInTheDocument();
    expect(screen.getByText("🎭 Bastille Day feasts")).toBeInTheDocument();
  });

  it("renders cross-culture bridge dish name and origin", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    expect(screen.getByText("Croissant")).toBeInTheDocument();
    expect(screen.getByText(/Ottoman Empire via Vienna/)).toBeInTheDocument();
  });

  it("renders a Wikipedia source link when historySource is provided", () => {
    render(<HeritageAtlasSection cuisine={FULL_CUISINE} />);
    const link = screen.getByRole("link", { name: /Wikipedia/i });
    expect(link).toHaveAttribute("href", "https://en.wikipedia.org/wiki/French_cuisine");
  });
});
