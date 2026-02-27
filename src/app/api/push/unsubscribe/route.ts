import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/services/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createSupabaseServerClient();

  const { error: subsError } = await supabase
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("user_id", user.id);

  if (subsError) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ notifications_enabled: false })
    .eq("user_id", user.id);

  if (profileError) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

