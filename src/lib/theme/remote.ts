import { createBrowserClient } from "@supabase/ssr";
import { CustomTheme, ThemeTokens } from "./tokens";
import { loadThemes, saveTheme } from "./storage";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function rowToTheme(row: Record<string, unknown>): CustomTheme {
  return {
    id: row.id as string,
    name: row.name as string,
    tokens: row.tokens as ThemeTokens,
  };
}

export function mergeThemes(local: CustomTheme[], remote: CustomTheme[]): CustomTheme[] {
  const remoteIds = new Set(remote.map((t) => t.id));
  const localOnly = local.filter((t) => !remoteIds.has(t.id));
  return [...remote, ...localOnly];
}

export async function fetchRemoteThemes(): Promise<CustomTheme[]> {
  const supabase = getClient();
  const { data, error } = await supabase.from("user_themes").select("*");
  if (error || !data) return [];
  return data.map(rowToTheme);
}

export async function pushTheme(theme: CustomTheme): Promise<void> {
  const supabase = getClient();
  await supabase.from("user_themes").upsert({
    id: theme.id,
    name: theme.name,
    tokens: theme.tokens,
    base_mode: "dark",
    updated_at: new Date().toISOString(),
  });
}

export async function removeRemoteTheme(id: string): Promise<void> {
  const supabase = getClient();
  await supabase.from("user_themes").delete().eq("id", id);
}

export async function syncLocalToRemote(): Promise<void> {
  const local = loadThemes();
  if (local.length === 0) return;
  const remote = await fetchRemoteThemes();
  const remoteIds = new Set(remote.map((t) => t.id));
  const toUpload = local.filter((t) => !remoteIds.has(t.id));
  for (const theme of toUpload) {
    await pushTheme(theme);
  }
  const merged = mergeThemes(local, remote);
  for (const theme of merged) {
    saveTheme(theme);
  }
}
