import { NextResponse } from "next/server";
import webPush from "web-push";

import { getLocalDateISO, getLocalTimeHHmm, normalizeTimeToHHmm } from "@/lib/date";
import { getRequiredEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_BODY = "Before the day takes over.";

export async function GET(request: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
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
    .select("user_id,timezone,notification_time,last_notified_on,onboarding_completed,notifications_enabled")
    .eq("onboarding_completed", true)
    .eq("notifications_enabled", true);

  if (profilesError || !profilesData) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const profiles = profilesData as Array<{
    user_id: string;
    timezone: string;
    notification_time: string;
    last_notified_on: string | null;
  }>;

  let considered = 0;
  let sent = 0;

  for (const profile of profiles) {
    const nowTime = getLocalTimeHHmm(profile.timezone);
    const targetTime = normalizeTimeToHHmm(profile.notification_time);
    if (nowTime !== targetTime) continue;

    const today = getLocalDateISO(profile.timezone);
    if (profile.last_notified_on === today) continue;

    considered += 1;

    const { data: subsData, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth,is_active")
      .eq("user_id", profile.user_id)
      .eq("is_active", true);

    if (subsError || !subsData || subsData.length === 0) continue;

    const subs = subsData as Array<{
      id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      is_active: boolean;
    }>;

    let anySuccess = false;

    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ body: NOTIFICATION_BODY }),
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

    if (anySuccess) {
      sent += 1;
      await admin
        .from("profiles")
        .update({ last_notified_on: today })
        .eq("user_id", profile.user_id);
    }
  }

  return NextResponse.json({ ok: true, considered, sent });
}

