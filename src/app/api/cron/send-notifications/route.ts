import { NextResponse } from "next/server";
import webPush from "web-push";

import { getLocalDateISO } from "@/lib/utils/date";
import { getRequiredEnv } from "@/lib/utils/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_TITLE = "Time to Set Your Orientation";
const NOTIFICATION_BODY = "Set your daily focus before the day takes over.";

/**
 * Daily push notifications — fires once at 10:00 UTC (6:00 AM EDT / 7:00 AM EST).
 *
 * Vercel Hobby plan only supports once-per-day crons, so per-user notification_time
 * windows are not used. All users who haven't been notified today (in their local
 * timezone) receive the push at cron fire time.
 *
 * `last_notified_on` guards against double-sends on retries.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const providedSecret = authHeader?.replace("Bearer ", "");

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  webPush.setVapidDetails(
    "mailto:polaris@localhost",
    getRequiredEnv("VAPID_PUBLIC_KEY"),
    getRequiredEnv("VAPID_PRIVATE_KEY"),
  );

  const { data: profilesData, error: profilesError } = await admin
    .from("profiles")
    .select("user_id,timezone,last_notified_on,onboarding_completed,notifications_enabled")
    .eq("onboarding_completed", true)
    .eq("notifications_enabled", true);

  if (profilesError || !profilesData) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const profiles = profilesData as Array<{
    user_id: string;
    timezone: string;
    last_notified_on: string | null;
  }>;

  // Only notify users who haven't been notified today in their local timezone
  const eligible = profiles.filter((p) => {
    const today = getLocalDateISO(p.timezone || "America/New_York");
    return p.last_notified_on !== today;
  });

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, eligible: 0, total: profiles.length });
  }

  let sent = 0;

  for (const profile of eligible) {
    const today = getLocalDateISO(profile.timezone || "America/New_York");
    let anySuccess = false;

    // --- Web Push (browser / PWA) ---
    const { data: subsData } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", profile.user_id)
      .eq("is_active", true);

    if (subsData && subsData.length > 0) {
      const subs = subsData as Array<{
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
      }>;

      for (const sub of subs) {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }),
          );
          anySuccess = true;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await admin
              .from("push_subscriptions")
              .update({ is_active: false })
              .eq("id", sub.id);
          }
        }
      }
    }

    // --- Native FCM (Capacitor app: Android / iOS) ---
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const { data: appTokenRows } = await admin
        .from("fcm_tokens")
        .select("id,token")
        .eq("user_id", profile.user_id)
        .eq("is_active", true)
        .ilike("device_info", "app:%");

      if (appTokenRows && appTokenRows.length > 0) {
        const appTokens = (
          appTokenRows as Array<{ id: string; token: string }>
        ).map((r) => r.token);

        const { sendAppPushNotification } = await import("@/lib/firebase-admin");
        const staleTokens = await sendAppPushNotification(
          appTokens,
          NOTIFICATION_TITLE,
          NOTIFICATION_BODY,
        );

        if (staleTokens.length > 0) {
          await admin
            .from("fcm_tokens")
            .update({ is_active: false })
            .in("token", staleTokens)
            .eq("user_id", profile.user_id);
        }

        if (appTokens.length > staleTokens.length) anySuccess = true;
      }
    }

    if (anySuccess) {
      sent += 1;
      await admin
        .from("profiles")
        .update({ last_notified_on: today })
        .eq("user_id", profile.user_id);
    }
  }

  return NextResponse.json({ ok: true, sent, eligible: eligible.length, total: profiles.length });
}
