/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useCustomTheme } from "../use-custom-theme";

// Mock apply module to avoid DOM side-effects in tests
jest.mock("../apply", () => ({
  applyTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

// Mock storage to use in-memory state
const storageMap: Record<string, string> = {};
let activeId: string | null = null;

jest.mock("../storage", () => ({
  loadThemes: jest.fn(() => Object.values(storageMap).map((v) => JSON.parse(v))),
  saveTheme: jest.fn((t: { id: string; name: string; tokens: Record<string, string> }) => {
    storageMap[t.id] = JSON.stringify(t);
  }),
  deleteTheme: jest.fn((id: string) => {
    delete storageMap[id];
  }),
  setActiveThemeId: jest.fn((id: string | null) => { activeId = id; }),
  getActiveThemeId: jest.fn(() => activeId),
}));

beforeEach(() => {
  Object.keys(storageMap).forEach((k) => delete storageMap[k]);
  activeId = null;
});

describe("useCustomTheme", () => {
  it("initializes with empty themes and no active theme", () => {
    const { result } = renderHook(() => useCustomTheme());
    expect(result.current.themes).toEqual([]);
    expect(result.current.activeTheme).toBeNull();
  });

  it("saveAndActivate adds theme and makes it active", () => {
    const { result } = renderHook(() => useCustomTheme());
    const theme = { id: "t1", name: "Mine", tokens: { "--bg-base": "#001" } };
    act(() => {
      result.current.saveAndActivate(theme);
    });
    expect(result.current.themes).toHaveLength(1);
    expect(result.current.activeTheme?.id).toBe("t1");
  });

  it("deactivate sets activeTheme to null", () => {
    const { result } = renderHook(() => useCustomTheme());
    const theme = { id: "t1", name: "Mine", tokens: {} };
    act(() => {
      result.current.saveAndActivate(theme);
    });
    act(() => {
      result.current.deactivate();
    });
    expect(result.current.activeTheme).toBeNull();
  });

  it("removeTheme removes the theme from the list", () => {
    const { result } = renderHook(() => useCustomTheme());
    act(() => {
      result.current.saveAndActivate({ id: "t1", name: "One", tokens: {} });
    });
    act(() => {
      result.current.removeTheme("t1");
    });
    expect(result.current.themes).toHaveLength(0);
  });
});
