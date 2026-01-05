import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { time } = await request.json();

    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:MM" },
        { status: 400 }
      );
    }

    // Store reminder time in user metadata
    const { error } = await supabase.auth.updateUser({
      data: {
        reminder_time: time,
        reminder_enabled: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, time });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return NextResponse.json(
      { error: "Failed to schedule reminder" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminderTime = user.user_metadata?.reminder_time;
    const reminderEnabled = user.user_metadata?.reminder_enabled ?? false;

    return NextResponse.json({
      time: reminderTime || null,
      enabled: reminderEnabled,
    });
  } catch (error) {
    console.error("Error getting reminder:", error);
    return NextResponse.json(
      { error: "Failed to get reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        reminder_enabled: false,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling reminder:", error);
    return NextResponse.json(
      { error: "Failed to disable reminder" },
      { status: 500 }
    );
  }
}
