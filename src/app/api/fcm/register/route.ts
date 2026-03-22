import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveWidgetToken } from "@/lib/utils/widget-token";

type Body = {
  fcmToken: string;
  widgetToken: string;
  deviceInfo?: string;
};

/**
 * Register an Android FCM token so the server can push a widget refresh
 * when the user locks their daily orientation.
 *
 * Authenticated via the widget token (same mechanism as /api/widget/today).
 */
export async function POST(request: Request) {
  let body: Partial<Body> | null = null;
  try {
    body = (await request.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.fcmToken !== "string" ||
    !body.fcmToken ||
    typeof body.widgetToken !== "string" ||
    !body.widgetToken
  ) {
    return NextResponse.json({ error: "fcmToken and widgetToken required" }, { status: 400 });
  }

  const { fcmToken, widgetToken, deviceInfo } = body;

  const userId = await resolveWidgetToken(widgetToken);
  if (!userId) {
    return NextResponse.json({ error: "Invalid widget token" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("fcm_tokens").upsert(
    {
      user_id: userId,
      token: fcmToken,
      device_info: deviceInfo ?? null,
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
