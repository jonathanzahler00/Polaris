import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  fcmToken: string;
  platform?: string; // "android" | "ios"
};

/**
 * Register a native FCM token for the Capacitor app so the daily reminder
 * cron can send a proper push notification that opens the app when tapped.
 *
 * Stores device_info as "app:<platform>" to distinguish from widget tokens
 * (which store the raw device model, e.g. "Pixel 7").
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<Body> | null = null;
  try {
    body = (await request.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!body?.fcmToken || typeof body.fcmToken !== "string") {
    return NextResponse.json({ error: "fcmToken required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("fcm_tokens").upsert(
    {
      user_id: user.id,
      token: body.fcmToken,
      device_info: `app:${body.platform ?? "unknown"}`,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" }
  );

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
