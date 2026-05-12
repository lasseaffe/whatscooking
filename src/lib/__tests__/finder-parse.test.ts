import { parseFinderText } from "../finder-parse";

describe("parseFinderText", () => {
  it("detects quick time from 'quick meal'", () => {
    expect(parseFinderText("quick meal").maxMinutes).toBe(30);
  });

  it("detects ≤15 min from 'under 15 minutes'", () => {
    expect(parseFinderText("under 15 minutes").maxMinutes).toBe(15);
  });

  it("detects vegan dietary tag", () => {
    expect(parseFinderText("vegan pasta please").dietary).toContain("vegan");
  });

  it("detects gluten-free", () => {
    expect(parseFinderText("gluten free option").dietary).toContain("gluten-free");
  });

  it("detects spicy exclusion", () => {
    expect(parseFinderText("no spice please").excludeKeywords).toContain("spicy");
  });

  it("detects pantry mode from 'use what I've got'", () => {
    expect(parseFinderText("use what I've got").pantryMode).toBe("pantry");
  });

  it("detects dish hint 'pasta'", () => {
    expect(parseFinderText("I want pasta tonight").dishHint).toBe("pasta");
  });

  it("detects comfort vibe from 'cozy'", () => {
    expect(parseFinderText("something cozy and warm").vibe).toBe("comfort");
  });

  it("detects impress vibe from 'fancy'", () => {
    expect(parseFinderText("something fancy for guests").vibe).toBe("impress");
  });

  it("returns empty hints for empty string", () => {
    expect(parseFinderText("")).toEqual({});
  });

  it("does not mix up 'not spicy' with vibe detection", () => {
    const result = parseFinderText("quick vegan pasta not spicy");
    expect(result.maxMinutes).toBe(30);
    expect(result.dietary).toContain("vegan");
    expect(result.dishHint).toBe("pasta");
    expect(result.excludeKeywords).toContain("spicy");
  });
});
