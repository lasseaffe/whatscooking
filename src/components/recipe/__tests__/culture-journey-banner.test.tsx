import React from "react";
import { render, screen } from "@testing-library/react";
import CultureJourneyBanner from "../culture-journey-banner";
import type { CulturalJourney } from "@/lib/types";

const journey: CulturalJourney = {
  period: "8th–12th century",
  stops: [
    { emoji: "🌍", name: "Persia", note: "Origin of saffron trade routes" },
    { emoji: "🕌", name: "Baghdad", note: "Refined in Abbasid court kitchens" },
    { emoji: "⚓", name: "Venice", note: "Arrived via spice merchants" },
  ],
};

describe("CultureJourneyBanner", () => {
  it("renders nothing when journey is null", () => {
    const { container } = render(<CultureJourneyBanner journey={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the period label", () => {
    render(<CultureJourneyBanner journey={journey} />);
    expect(screen.getByText("8th–12th century")).toBeInTheDocument();
  });

  it("renders all stop names", () => {
    render(<CultureJourneyBanner journey={journey} />);
    expect(screen.getByText("Persia")).toBeInTheDocument();
    expect(screen.getByText("Baghdad")).toBeInTheDocument();
    expect(screen.getByText("Venice")).toBeInTheDocument();
  });

  it("renders all stop notes", () => {
    render(<CultureJourneyBanner journey={journey} />);
    expect(screen.getByText("Origin of saffron trade routes")).toBeInTheDocument();
    expect(screen.getByText("Refined in Abbasid court kitchens")).toBeInTheDocument();
    expect(screen.getByText("Arrived via spice merchants")).toBeInTheDocument();
  });

  it("renders CULTURAL JOURNEY label", () => {
    render(<CultureJourneyBanner journey={journey} />);
    expect(screen.getByText("CULTURAL JOURNEY")).toBeInTheDocument();
  });
});
