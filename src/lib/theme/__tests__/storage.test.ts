/**
 * @jest-environment jsdom
 */
import {
  saveTheme,
  loadThemes,
  deleteTheme,
  setActiveThemeId,
  getActiveThemeId,
  STORAGE_KEY,
  ACTIVE_KEY,
} from "../storage";
import { CustomTheme } from "../tokens";

const theme1: CustomTheme = { id: "t1", name: "Dark Blue", tokens: { "--bg-base": "#001" } };
const theme2: CustomTheme = { id: "t2", name: "Warm", tokens: { "--bg-base": "#221" } };

beforeEach(() => {
  localStorage.clear();
});

describe("saveTheme", () => {
  it("persists a theme to localStorage", () => {
    saveTheme(theme1);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("t1");
  });

  it("updates an existing theme by id", () => {
    saveTheme(theme1);
    const updated: CustomTheme = { ...theme1, name: "Dark Blue v2" };
    saveTheme(updated);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Dark Blue v2");
  });

  it("appends a new theme when id is different", () => {
    saveTheme(theme1);
    saveTheme(theme2);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(2);
  });
});

describe("loadThemes", () => {
  it("returns an empty array when localStorage is empty", () => {
    expect(loadThemes()).toEqual([]);
  });

  it("returns saved themes", () => {
    saveTheme(theme1);
    saveTheme(theme2);
    const themes = loadThemes();
    expect(themes).toHaveLength(2);
    expect(themes[0].id).toBe("t1");
  });
});

describe("deleteTheme", () => {
  it("removes a theme by id", () => {
    saveTheme(theme1);
    saveTheme(theme2);
    deleteTheme("t1");
    const themes = loadThemes();
    expect(themes).toHaveLength(1);
    expect(themes[0].id).toBe("t2");
  });

  it("is a no-op for unknown ids", () => {
    saveTheme(theme1);
    deleteTheme("unknown");
    expect(loadThemes()).toHaveLength(1);
  });
});

describe("active theme id", () => {
  it("setActiveThemeId stores the id", () => {
    setActiveThemeId("t1");
    expect(localStorage.getItem(ACTIVE_KEY)).toBe("t1");
  });

  it("getActiveThemeId returns stored id", () => {
    setActiveThemeId("t2");
    expect(getActiveThemeId()).toBe("t2");
  });

  it("getActiveThemeId returns null when not set", () => {
    expect(getActiveThemeId()).toBeNull();
  });

  it("setActiveThemeId with null clears the key", () => {
    setActiveThemeId("t1");
    setActiveThemeId(null);
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
  });
});
