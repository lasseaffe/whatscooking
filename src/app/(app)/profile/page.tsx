import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hacks } = await supabase
    .from("recipes")
    .select("id, title, description, source_url, image_url, ingredients, instructions, prep_time_minutes, cook_time_minutes")
    .contains("dish_types", ["hack"])
    .order("created_at", { ascending: true })
    .limit(20);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <ProfileClient userId={user?.id ?? ""} email={user?.email ?? ""} hacks={hacks ?? []} />
    </div>
  );
}
