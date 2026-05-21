"use client";

import { useState, useCallback } from "react";
import {
  THEME_TOKENS,
  TOKEN_GROUPS,
  CONTRAST_PAIRS,
  ThemeTokens,
  defaultTokens,
} from "@/lib/theme/tokens";
import { contrastRatio, meetsAA } from "@/lib/theme/contrast";
import { applyTokens } from "@/lib/theme/apply";
import { useCustomTheme } from "@/lib/theme/use-custom-theme";
import { pushTheme, removeRemoteTheme } from "@/lib/theme/remote";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function ThemeStudio() {
  const [tokens, setTokens] = useState<ThemeTokens>(() => defaultTokens());
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const { themes, activeTheme, saveAndActivate, deactivate, removeTheme } = useCustomTheme();

  const handleTokenChange = useCallback(
    (key: string, value: string) => {
      const next = { ...tokens, [key]: value };
      setTokens(next);
      applyTokens(next);
    },
    [tokens]
  );

  const handleReset = useCallback(() => {
    const defaults = defaultTokens();
    setTokens(defaults);
    applyTokens(defaults);
  }, []);

  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    const theme = { id: generateId(), name: saveName.trim(), tokens };
    saveAndActivate(theme);
    pushTheme(theme).catch(() => {});
    setSaveName("");
    setShowSaveInput(false);
  }, [saveName, tokens, saveAndActivate]);

  const handleActivate = useCallback(
    (theme: { id: string; name: string; tokens: ThemeTokens }) => {
      setTokens(theme.tokens);
      saveAndActivate(theme);
    },
    [saveAndActivate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeTheme(id);
      removeRemoteTheme(id).catch(() => {});
    },
    [removeTheme]
  );

  const resolve = (key: string) => tokens[key] ?? key;

  return (
    <div className="space-y-6">
      {/* Token groups */}
      {TOKEN_GROUPS.map((group) => (
        <section key={group}>
          <h3 className="text-sm font-semibold text-[var(--fg-tertiary)] uppercase tracking-widest mb-3">
            {group}
          </h3>
          <div className="space-y-2">
            {THEME_TOKENS.filter((t) => t.group === group).map((token) => (
              <div key={token.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={tokens[token.key] ?? token.default}
                  onChange={(e) => handleTokenChange(token.key, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-[var(--border-base)] bg-transparent p-0"
                  title={token.key}
                />
                <span className="flex-1 text-sm text-[var(--fg-secondary)]">{token.label}</span>
                <input
                  type="text"
                  value={tokens[token.key] ?? token.default}
                  onChange={(e) => handleTokenChange(token.key, e.target.value)}
                  className="w-24 rounded border border-[var(--border-base)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-mono text-[var(--fg-primary)]"
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Contrast warnings */}
      {CONTRAST_PAIRS.some((pair) => !meetsAA(resolve(pair.fg), resolve(pair.bg))) && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--fg-tertiary)] uppercase tracking-widest mb-3">
            Contrast Warnings
          </h3>
          <div className="space-y-1">
            {CONTRAST_PAIRS.filter((pair) => !meetsAA(resolve(pair.fg), resolve(pair.bg))).map(
              (pair) => (
                <div
                  key={pair.label}
                  className="flex items-center gap-2 rounded bg-[var(--bg-attention)]/20 px-3 py-1.5 text-xs"
                >
                  <span className="text-[var(--bg-attention)]">&#9888;</span>
                  <span className="text-[var(--fg-secondary)]">{pair.label}</span>
                  <span className="ml-auto font-mono text-[var(--fg-tertiary)]">
                    {contrastRatio(resolve(pair.fg), resolve(pair.bg)).toFixed(1)}:1
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleReset}
          className="rounded border border-[var(--border-primary)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]"
        >
          Reset to defaults
        </button>
        {!showSaveInput ? (
          <button
            onClick={() => setShowSaveInput(true)}
            className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90"
          >
            Save as&hellip;
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Theme name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-sm text-[var(--fg-primary)]"
            />
            <button
              onClick={handleSave}
              className="rounded bg-[var(--bg-accent)] px-3 py-1.5 text-sm text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveInput(false);
                setSaveName("");
              }}
              className="rounded border border-[var(--border-primary)] px-3 py-1.5 text-sm text-[var(--fg-secondary)]"
            >
              Cancel
            </button>
          </div>
        )}
        {activeTheme && (
          <button
            onClick={deactivate}
            className="rounded border border-[var(--border-primary)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            Deactivate custom theme
          </button>
        )}
      </div>

      {/* Saved themes list */}
      {themes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[var(--fg-tertiary)] uppercase tracking-widest mb-3">
            Saved Themes
          </h3>
          <div className="space-y-2">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="flex items-center gap-3 rounded border border-[var(--border-base)] bg-[var(--bg-secondary)] px-3 py-2"
              >
                <span className="flex-1 text-sm text-[var(--fg-primary)]">{theme.name}</span>
                {activeTheme?.id === theme.id && (
                  <span className="text-xs text-[var(--fg-accent)]">Active</span>
                )}
                <button
                  onClick={() => handleActivate(theme)}
                  className="text-xs text-[var(--fg-accent)] hover:underline"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleDelete(theme.id)}
                  className="text-xs text-[var(--fg-tertiary)] hover:text-[var(--bg-destructive)]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
