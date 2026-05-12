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

  // maxMinutes = 60
  it("detects 60 min from '60 min dinner'", () => {
    expect(parseFinderText("60 min dinner").maxMinutes).toBe(60);
  });

  it("detects 60 min from '1 hour recipe'", () => {
    expect(parseFinderText("1 hour recipe").maxMinutes).toBe(60);
  });

  // pantry from "from the fridge"
  it("detects pantry mode from 'from the fridge'", () => {
    expect(parseFinderText("something from the fridge").pantryMode).toBe("pantry");
  });

  // vibe coverage for remaining 4 vibes
  it("detects date-night vibe from 'romantic dinner'", () => {
    expect(parseFinderText("romantic dinner for two").vibe).toBe("date-night");
  });

  it("detects clean vibe from 'healthy'", () => {
    expect(parseFinderText("something healthy and light").vibe).toBe("clean");
  });

  it("detects fuel vibe from 'protein'", () => {
    expect(parseFinderText("high protein post-workout meal").vibe).toBe("fuel");
  });

  it("detects lazy vibe from 'lazy'", () => {
    expect(parseFinderText("lazy sunday dinner").vibe).toBe("lazy");
  });

  // dietary tags: vegetarian, dairy-free, halal
  it("detects vegetarian dietary tag", () => {
    expect(parseFinderText("vegetarian option please").dietary).toContain("vegetarian");
  });

  it("detects dairy-free dietary tag", () => {
    expect(parseFinderText("dairy free dessert").dietary).toContain("dairy-free");
  });

  it("detects halal dietary tag", () => {
    expect(parseFinderText("halal chicken recipe").dietary).toContain("halal");
  });
});
