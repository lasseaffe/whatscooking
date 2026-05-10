import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record; // new group_shopping_items row

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all members of this group except the one who added the item
    const { data: members } = await supabase
      .from("kitchen_group_members")
      .select("user_id")
      .eq("group_id", record.group_id)
      .neq("user_id", record.added_by);

    if (!members?.length) return new Response("no members", { status: 200 });

    const memberIds = members.map((m: { user_id: string }) => m.user_id);

    // Get push subscriptions for those members
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .in("user_id", memberIds);

    if (!subs?.length) return new Response("no subscriptions", { status: 200 });

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    );

    const itemLabel = [record.amount, record.unit, record.name]
      .filter(Boolean)
      .join(" ");

    const notification = JSON.stringify({
      title: "Shopping list updated",
      body: `${itemLabel} was added to the group list`,
      icon: "/icon-192.png",
    });

    await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth_key: string }) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          notification
        )
      )
    );

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
});
