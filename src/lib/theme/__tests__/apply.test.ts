/**
 * @jest-environment jsdom
 */
import { applyTokens, clearTokens } from "../apply";
import { defaultTokens } from "../tokens";

describe("applyTokens", () => {
  afterEach(() => {
    // Clean up inline styles after each test
    document.documentElement.removeAttribute("style");
  });

  it("writes token values as inline CSS custom properties on documentElement", () => {
    const tokens = { "--bg-base": "#0d0d0c", "--fg-primary": "#ffffff" };
    applyTokens(tokens);
    expect(document.documentElement.style.getPropertyValue("--bg-base")).toBe("#0d0d0c");
    expect(document.documentElement.style.getPropertyValue("--fg-primary")).toBe("#ffffff");
  });

  it("applies all 17 default tokens without error", () => {
    expect(() => applyTokens(defaultTokens())).not.toThrow();
    expect(document.documentElement.style.getPropertyValue("--bg-depth")).toBe("#090908");
  });

  it("sets data-theme attribute to 'custom'", () => {
    applyTokens({ "--bg-base": "#000" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("custom");
  });
});

describe("clearTokens", () => {
  it("removes the inline custom properties that were set", () => {
    applyTokens({ "--bg-base": "#0d0d0c", "--fg-primary": "#ffffff" });
    clearTokens({ "--bg-base": "#0d0d0c", "--fg-primary": "#ffffff" });
    expect(document.documentElement.style.getPropertyValue("--bg-base")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--fg-primary")).toBe("");
  });

  it("removes data-theme attribute", () => {
    applyTokens({ "--bg-base": "#000" });
    clearTokens({ "--bg-base": "#000" });
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});
