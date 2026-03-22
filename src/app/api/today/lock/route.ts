import { NextResponse } from "next/server";

import { getTodayForAuthedUser } from "@/lib/services/today";
import { hasRecordedClipForMonth } from "@/lib/services/month-clip";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { text: string };

export async function POST(request: Request) {
  let body: Partial<Body> | null = null;
  try {
    body = (await request.json()) as Partial<Body>;
  } catch {
    body = null;
  }

  if (!body || typeof body.text !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const text = body.text.trim();
  if (text.length < 1 || text.length > 100) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const { supabase, user, today, profile } = await getTodayForAuthedUser();

    const hasMonthClip = await hasRecordedClipForMonth(user.id, profile.timezone);
    if (!hasMonthClip) {
      return NextResponse.json(
        { error: "month_clip_required", code: "MONTH_CLIP_REQUIRED" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("daily_orientations")
      .insert({
        user_id: user.id,
        date: today,
        text,
        locked_at: new Date().toISOString(),
      })
      .select("text")
      .single();

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
      }
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    // Push widget refresh to Android devices via FCM (best-effort, non-blocking)
    pushWidgetRefresh(user.id).catch(() => {});

    return NextResponse.json({ text: data.text });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Send an FCM data message to all registered Android widget tokens for this user
 * so the widget refreshes immediately when the orientation is locked.
 */
async function pushWidgetRefresh(userId: string): Promise<void> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return;

  const admin = createSupabaseAdminClient();

  const { data: rows } = await admin
    .from("fcm_tokens")
    .select("id, token")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!rows || rows.length === 0) return;

  const tokens = rows.map((r: { id: string; token: string }) => r.token);

  const { sendWidgetRefresh } = await import("@/lib/firebase-admin");
  const staleTokens = await sendWidgetRefresh(tokens);

  // Deactivate stale tokens so we don't keep sending to them
  if (staleTokens.length > 0) {
    await admin
      .from("fcm_tokens")
      .update({ is_active: false })
      .in("token", staleTokens)
      .eq("user_id", userId);
  }
}
