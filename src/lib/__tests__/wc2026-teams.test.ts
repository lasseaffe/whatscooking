import { WC_TEAMS, getTeamByCode } from "@/lib/wc2026-teams";
import {
  SNACK_POOL,
  SNACK_COUNT,
  DISHES_PER_NATION,
  teamSignatureFallback,
} from "@/lib/wc2026-matchday-menu";

describe("WC2026 team registry", () => {
  it("contains all 48 qualified teams", () => {
    expect(WC_TEAMS).toHaveLength(48);
  });

  it("maps England to fixture code GB with British cuisine", () => {
    const eng = getTeamByCode("GB");
    expect(eng?.name).toBe("England");
    expect(eng?.cuisine).toBe("British");
  });

  it("enriches catalog teams with cuisine + slug (Brazil)", () => {
    const br = getTeamByCode("BR");
    expect(br?.name).toBe("Brazil");
    expect(br?.cuisine).toBe("Brazilian");
    expect(br?.countrySlug).toBe("brazil");
    expect(br?.confederation).toBe("CONMEBOL");
  });

  it("covers teams missing from the cuisine catalog (extras)", () => {
    expect(getTeamByCode("HN")?.name).toBe("Honduras");
    expect(getTeamByCode("PE")?.cuisine).toBe("Peruvian");
    expect(getTeamByCode("RS")?.confederation).toBe("UEFA");
  });

  it("has unique codes", () => {
    const codes = WC_TEAMS.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("matchday menu pure helpers", () => {
  it("exposes a snack pool at least as large as the surfaced count", () => {
    expect(SNACK_POOL.length).toBeGreaterThanOrEqual(SNACK_COUNT);
  });

  it("returns curated signature fallbacks for a catalog team", () => {
    const br = getTeamByCode("BR")!;
    const fallback = teamSignatureFallback(br);
    expect(fallback).toHaveLength(DISHES_PER_NATION);
    expect(fallback[0].title).toBeTruthy();
    expect(fallback[0].cuisineHref).toContain("/cuisines/world-cup-2026/brazil/");
  });

  it("returns no fallback for a team without a catalog slug", () => {
    const hn = getTeamByCode("HN")!; // extra team, no countrySlug
    expect(teamSignatureFallback(hn)).toHaveLength(0);
  });
});
