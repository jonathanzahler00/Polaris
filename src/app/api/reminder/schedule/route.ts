import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/services/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const REMINDER_TIME = "06:00";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createSupabaseServerClient();

    // Store reminder as enabled in user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        reminder_time: REMINDER_TIME,
        reminder_enabled: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync to profile so cron can send push
    const admin = createSupabaseAdminClient();
    await admin
      .from("profiles")
      .update({
        notification_time: REMINDER_TIME,
        notifications_enabled: true,
      })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, time: REMINDER_TIME });
  } catch (error) {
    console.error("Error enabling reminder:", error);
    return NextResponse.json({ error: "Failed to enable reminder" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reminderEnabled = user.user_metadata?.reminder_enabled ?? false;

    return NextResponse.json({
      time: reminderEnabled ? REMINDER_TIME : null,
      enabled: reminderEnabled,
    });
  } catch (error) {
    console.error("Error getting reminder:", error);
    return NextResponse.json({ error: "Failed to get reminder" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        reminder_enabled: false,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const admin = createSupabaseAdminClient();
    await admin
      .from("profiles")
      .update({ notifications_enabled: false })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling reminder:", error);
    return NextResponse.json({ error: "Failed to disable reminder" }, { status: 500 });
  }
}
