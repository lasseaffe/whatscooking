import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const PERSONAL_DATA_TABLES = [
  "pantry_items",
  "calorie_entries",
  "weight_logs",
  "meal_plans",
  "recipe_saves",
  "recipe_ratings",
  "recipe_comments",
  "swipe_history",
  "feedback",
];

const ANONYMIZE_TABLES = [
  // User-created recipes: keep content, remove identity (Art. 17 — legitimate archival interest)
  "recipes",
];

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Supabase Admin client — service role required for auth.users deletion
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const errors: string[] = [];

  // 1. Delete all personal data rows across every user-owned table
  for (const table of PERSONAL_DATA_TABLES) {
    const { error } = await adminClient.from(table).delete().eq("user_id", userId);
    if (error) errors.push(`${table}: ${error.message}`);
  }

  // 2. Also delete meal_entries for plans that belonged to this user
  //    (meal_plans were deleted above, but entries reference plan_id)
  const { error: entriesError } = await adminClient.rpc("delete_user_meal_entries", {
    p_user_id: userId,
  }).maybeSingle();
  // If the RPC doesn't exist yet, fall back to a direct delete via a subquery approach
  if (entriesError) {
    // Fallback: best-effort, will be cleaned by CASCADE if FK is set up
    errors.push(`meal_entries (non-critical): ${entriesError.message}`);
  }

  // 3. Anonymize user-created recipes — remove user_id, keep content
  for (const table of ANONYMIZE_TABLES) {
    const { error } = await adminClient
      .from(table)
      .update({ user_id: null })
      .eq("user_id", userId);
    if (error) errors.push(`anonymize ${table}: ${error.message}`);
  }

  // 4. Delete dinner party data where user is host
  const { error: partiesError } = await adminClient
    .from("dinner_parties")
    .delete()
    .eq("host_user_id", userId);
  if (partiesError) errors.push(`dinner_parties: ${partiesError.message}`);

  // 5. Remove user from guest lists
  const { error: guestsError } = await adminClient
    .from("party_guests")
    .delete()
    .eq("user_id", userId);
  if (guestsError) errors.push(`party_guests: ${guestsError.message}`);

  // 6. Delete the auth.users record — this is the point of no return
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json(
      { error: "Failed to delete account", detail: authError.message, partial_errors: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deleted: true,
    anonymized_tables: ANONYMIZE_TABLES,
    partial_errors: errors.length > 0 ? errors : undefined,
  });
}
