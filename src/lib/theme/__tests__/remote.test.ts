/**
 * @jest-environment jsdom
 */
import { rowToTheme, mergeThemes } from "../remote";
import { CustomTheme } from "../tokens";

describe("rowToTheme", () => {
  it("maps a DB row to a CustomTheme", () => {
    const row = {
      id: "abc",
      name: "My Theme",
      tokens: { "--bg-base": "#001" },
      base_mode: "dark",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      user_id: "uid1",
    };
    const theme = rowToTheme(row);
    expect(theme.id).toBe("abc");
    expect(theme.name).toBe("My Theme");
    expect(theme.tokens["--bg-base"]).toBe("#001");
  });
});

describe("mergeThemes", () => {
  it("returns remote themes when local list is empty", () => {
    const remote: CustomTheme[] = [{ id: "r1", name: "Remote", tokens: {} }];
    expect(mergeThemes([], remote)).toEqual(remote);
  });

  it("returns local themes that are not in remote", () => {
    const local: CustomTheme[] = [{ id: "l1", name: "Local Only", tokens: {} }];
    const remote: CustomTheme[] = [{ id: "r1", name: "Remote", tokens: {} }];
    const merged = mergeThemes(local, remote);
    expect(merged.find((t) => t.id === "l1")).toBeDefined();
    expect(merged.find((t) => t.id === "r1")).toBeDefined();
  });

  it("prefers remote when same id exists in both", () => {
    const local: CustomTheme[] = [{ id: "shared", name: "Local ver", tokens: {} }];
    const remote: CustomTheme[] = [{ id: "shared", name: "Remote ver", tokens: {} }];
    const merged = mergeThemes(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("Remote ver");
  });
});
