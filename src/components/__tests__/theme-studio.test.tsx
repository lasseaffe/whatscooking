/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeStudio } from "../theme-studio";

jest.mock("@/lib/theme/apply", () => ({
  applyTokens: jest.fn(),
  clearTokens: jest.fn(),
}));
jest.mock("@/lib/theme/storage", () => ({
  loadThemes: jest.fn(() => []),
  saveTheme: jest.fn(),
  deleteTheme: jest.fn(),
  setActiveThemeId: jest.fn(),
  getActiveThemeId: jest.fn(() => null),
}));
jest.mock("@/lib/theme/remote", () => ({
  pushTheme: jest.fn(),
  removeRemoteTheme: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ThemeStudio", () => {
  it("renders the 'Backgrounds' group heading", () => {
    render(<ThemeStudio />);
    expect(screen.getByText("Backgrounds")).toBeInTheDocument();
  });

  it("renders a color input for each token", () => {
    render(<ThemeStudio />);
    // 17 tokens → 17 color inputs
    const colorInputs = document.querySelectorAll("input[type='color']");
    expect(colorInputs.length).toBe(17);
  });

  it("renders the 'Reset to defaults' button", () => {
    render(<ThemeStudio />);
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeInTheDocument();
  });

  it("renders the 'Save as…' button", () => {
    render(<ThemeStudio />);
    expect(screen.getByRole("button", { name: /save as/i })).toBeInTheDocument();
  });

  it("reset button restores default token values", () => {
    render(<ThemeStudio />);
    const resetBtn = screen.getByRole("button", { name: /reset to defaults/i });
    fireEvent.click(resetBtn);
    const { applyTokens } = require("@/lib/theme/apply");
    expect(applyTokens).toHaveBeenCalledWith(expect.objectContaining({ "--bg-depth": "#090908" }));
  });
});
