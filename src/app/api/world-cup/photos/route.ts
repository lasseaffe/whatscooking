import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const fixtureId = formData.get("fixture_id") as string | null;
  const caption = (formData.get("caption") as string | null) ?? "";

  if (!file || !fixtureId) {
    return NextResponse.json({ error: "Missing file or fixture_id" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${fixtureId}/${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("wc-photos")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase
    .from("wc_match_photos")
    .insert({ fixture_id: fixtureId, user_id: user.id, storage_path: storagePath, caption });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("wc-photos").getPublicUrl(storagePath);

  return NextResponse.json({ storage_path: storagePath, public_url: publicUrl });
}
