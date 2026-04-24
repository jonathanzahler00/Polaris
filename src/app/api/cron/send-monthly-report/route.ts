import { NextResponse } from "next/server";
import { Resend } from "resend";
import { DateTime } from "luxon";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildMonthlyReportHtml, type DayEntry } from "@/lib/email/monthly-report";

/**
 * Monthly report cron — fires on the 1st of each month at 08:00 UTC.
 * Sends each opted-in user an email listing every daily orientation they
 * wrote in the previous calendar month, ordered by day.
 *
 * Required env vars:
 *   RESEND_API_KEY        — Resend API key
 *   RESEND_FROM_EMAIL     — verified sender, e.g. "Polaris <reports@yourdomain.com>"
 *   CRON_SECRET           — shared with Vercel cron for auth
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader?.replace("Bearer ", "") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return NextResponse.json(
      { error: "RESEND_API_KEY or RESEND_FROM_EMAIL not configured" },
      { status: 500 },
    );
  }

  const resend = new Resend(resendApiKey);
  const admin = createSupabaseAdminClient();

  // The cron fires on the 1st — report covers the month that just ended.
  const now = DateTime.utc();
  const prevMonth = now.minus({ months: 1 });
  const monthKey = prevMonth.toFormat("yyyy-MM"); // e.g. "2026-02"
  const startDate = `${monthKey}-01`;
  const endDate = prevMonth.endOf("month").toISODate();

  // Fetch all users who have monthly_report_enabled and a confirmed email.
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, timezone, monthly_report_enabled")
    .eq("monthly_report_enabled", true)
    .eq("onboarding_completed", true);

  if (profilesError || !profiles) {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    // Look up their email from Supabase Auth.
    const {
      data: { user: authUser },
    } = await admin.auth.admin.getUserById(profile.user_id);

    if (!authUser?.email) {
      skipped += 1;
      continue;
    }

    // Fetch their orientations for the previous month.
    const { data: entries, error: entriesError } = await admin
      .from("daily_orientations")
      .select("date, text")
      .eq("user_id", profile.user_id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (entriesError || !entries || entries.length === 0) {
      skipped += 1;
      continue;
    }

    const dayEntries: DayEntry[] = entries.map((e) => ({ date: e.date, text: e.text }));
    const html = buildMonthlyReportHtml(monthKey, dayEntries);

    const monthLabel = prevMonth.toFormat("MMMM yyyy");

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: authUser.email,
      subject: `Your ${monthLabel} orientations — Polaris`,
      html,
    });

    if (sendError) {
      errors.push(`${profile.user_id}: ${sendError.message}`);
    } else {
      sent += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    month: monthKey,
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
