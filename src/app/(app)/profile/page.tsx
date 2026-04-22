import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <ProfileClient userId={user?.id ?? ""} email={user?.email ?? ""} />
    </div>
  );
}
