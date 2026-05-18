import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { JournalPageClient } from "./journal-page-client";
import type { JournalEntry } from "./journal-entry-modal";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { recipe: recipeFilter } = await searchParams;

  let query = supabase
    .from("cook_log")
    .select("id, recipe_id, recipe_title, cooked_at, rating, notes, next_time, photo_url")
    .eq("user_id", user.id)
    .order("cooked_at", { ascending: false })
    .limit(50);

  if (recipeFilter) {
    query = query.eq("recipe_id", recipeFilter);
  }

  const { data: entries } = await query;
  const safe = (entries ?? []) as JournalEntry[];

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-5 h-5 shrink-0" style={{ color: "#F4A261" }} />
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#EFE3CE", fontFamily: "var(--font-fraunces, 'Fraunces', Georgia, serif)" }}
          >
            My Kitchen Journal
          </h1>
          {safe.length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "#5A3A28" }}>
              {safe.length} entr{safe.length !== 1 ? "ies" : "y"}
              {recipeFilter ? " for this recipe" : ""}
            </p>
          )}
        </div>
      </div>

      <JournalPageClient entries={safe} />
    </div>
  );
}
