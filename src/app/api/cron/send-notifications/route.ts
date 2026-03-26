import { NextResponse } from "next/server";
import webPush from "web-push";

import { getLocalDateISO, getLocalTimeHHmm, normalizeTimeToHHmm } from "@/lib/utils/date";
import { getRequiredEnv } from "@/lib/utils/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_TITLE = "Time to Set Your Orientation";
const NOTIFICATION_BODY = "Set your daily focus before the day takes over.";

/**
 * Timezone-aware push notifications.
 *
 * OLD: Ran once at 06:00 UTC → blasted every user regardless of timezone.
 * NEW: Runs every 15 min → only notifies users whose local time is currently
 *      in the [notification_time, notification_time + 15min) window.
 *
 * A user in America/Los_Angeles gets their push at ~6:00 AM PT.
 * A user in Europe/Berlin gets theirs at ~6:00 AM CET.
 *
 * `last_notified_on` still guards against double-sends on retries/overlaps.
 *
 * Vercel cron schedule: "* /15 * * * *" (every 15 min, requires Pro plan).
 * Fallback for Hobby plan: "0 * * * *" (hourly, ±30 min accuracy).
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

  // ── 1. Fetch all notification-enabled users ────────────────────────────
  const { data: profilesData, error: profilesError } = await admin
    .from("profiles")
    .select("user_id,timezone,notification_time,last_notified_on,onboarding_completed,notifications_enabled")
    .eq("onboarding_completed", true)
    .eq("notifications_enabled", true);

  if (profilesError || !profilesData) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const profiles = profilesData as Array<{
    user_id: string;
    timezone: string;
    notification_time: string | null;
    last_notified_on: string | null;
  }>;

  // ── 2. Filter to users in their local notification window ──────────────
  //
  // For each user, check if their local time RIGHT NOW falls within
  // [notification_time, notification_time + WINDOW_MINUTES).
  // Default notification_time is "06:00" if not set.
  //
  // The cron fires every WINDOW_MINUTES, so this covers all timezones
  // with no gaps and no overlaps (guarded by last_notified_on).

  const WINDOW_MINUTES = 15;
  const eligible: typeof profiles = [];

  for (const profile of profiles) {
    const tz = profile.timezone || "America/New_York";
    const today = getLocalDateISO(tz);

    // Already notified today?
    if (profile.last_notified_on === today) continue;

    // What time is it locally for this user?
    const localTimeStr = getLocalTimeHHmm(tz); // "HH:mm"
    const [localH, localM] = localTimeStr.split(":").map(Number);
    const localMinutes = localH * 60 + localM;

    // What's their preferred notification time?
    const rawNotifTime = profile.notification_time || "06:00";
    const notifTimeStr = normalizeTimeToHHmm(rawNotifTime); // "HH:mm"
    const [notifH, notifM] = notifTimeStr.split(":").map(Number);
    const notifMinutes = notifH * 60 + notifM;

    // Is local time inside [notifTime, notifTime + WINDOW)?
    if (localMinutes >= notifMinutes && localMinutes < notifMinutes + WINDOW_MINUTES) {
      eligible.push(profile);
    }
  }

  if (eligible.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, eligible: 0, total: profiles.length });
  }

  // ── 3. Send notifications to eligible users ────────────────────────────
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
