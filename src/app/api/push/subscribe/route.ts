import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/services/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createSupabaseServerClient();

  const body = (await request.json()) as Partial<Body>;
  if (
    !body ||
    typeof body.endpoint !== "string" ||
    !body.keys ||
    typeof body.keys.p256dh !== "string" ||
    typeof body.keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: typeof body.userAgent === "string" ? body.userAgent : null,
        is_active: true,
      },
      { onConflict: "user_id,endpoint" },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ notifications_enabled: true })
    .eq("user_id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

