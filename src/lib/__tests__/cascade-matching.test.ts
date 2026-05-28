import { titleMatchesTerms } from "../cascade-matching";

describe("titleMatchesTerms", () => {
  it("matches exact case-insensitive title", () => {
    expect(titleMatchesTerms("Croissant", ["croissant"])).toBe(true);
  });

  it("matches partial substring", () => {
    expect(titleMatchesTerms("Classic Croissant Recipe", ["croissant"])).toBe(true);
  });

  it("matches any of multiple terms", () => {
    expect(titleMatchesTerms("Beef Ramen Bowl", ["ramen", "croissant"])).toBe(true);
  });

  it("returns false when no terms match", () => {
    expect(titleMatchesTerms("Chocolate Cake", ["croissant", "ramen"])).toBe(false);
  });

  it("ignores empty terms", () => {
    expect(titleMatchesTerms("Croissant", ["", "croissant"])).toBe(true);
  });

  it("handles empty terms array", () => {
    expect(titleMatchesTerms("Anything", [])).toBe(false);
  });

  it("handles accented characters case-insensitively", () => {
    expect(titleMatchesTerms("Crème Brûlée", ["crème brûlée"])).toBe(true);
  });
});
