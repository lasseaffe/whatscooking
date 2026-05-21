/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";

jest.mock("@/lib/theme/apply", () => ({
  applyTokens: jest.fn(),
}));
jest.mock("@/lib/theme/storage", () => ({
  getActiveThemeId: jest.fn(() => "t1"),
  loadThemes: jest.fn(() => [{ id: "t1", name: "Test", tokens: { "--bg-base": "#001" } }]),
}));

import { CustomThemeInitializer } from "../custom-theme-initializer";
import { applyTokens } from "@/lib/theme/apply";

describe("CustomThemeInitializer", () => {
  it("renders nothing visible", () => {
    const { container } = render(<CustomThemeInitializer />);
    expect(container.firstChild).toBeNull();
  });

  it("calls applyTokens with the active theme's tokens on mount", () => {
    render(<CustomThemeInitializer />);
    expect(applyTokens).toHaveBeenCalledWith({ "--bg-base": "#001" });
  });
});
