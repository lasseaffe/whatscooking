import { hexToRgb, relativeLuminance, contrastRatio, meetsAA } from "../contrast";

describe("hexToRgb", () => {
  it("parses a 6-digit hex", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("parses a 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("parses an 8-digit hex (ignores alpha)", () => {
    expect(hexToRgb("#ff0000ff")).toEqual({ r: 255, g: 0, b: 0 });
  });
  it("returns null for invalid input", () => {
    expect(hexToRgb("not-a-color")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });
  it("returns 1 for white", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black vs white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#aaaaaa", "#aaaaaa")).toBeCloseTo(1, 5);
  });
  it("returns 1 for bogus hex inputs", () => {
    expect(contrastRatio("bad", "also-bad")).toBe(1);
  });
});

describe("meetsAA", () => {
  it("passes black on white (ratio 21)", () => {
    expect(meetsAA("#000000", "#ffffff")).toBe(true);
  });
  it("fails low-contrast pair (ratio < 4.5)", () => {
    expect(meetsAA("#777777", "#888888")).toBe(false);
  });
});
