import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/utils/timezone";

type Body = {
  timezone: string;
  notification_time: string; // "HH:MM"
  notifications_enabled: boolean;
};

function isHHmm(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Partial<Body>;
  if (
    !body ||
    typeof body.timezone !== "string" ||
    typeof body.notification_time !== "string" ||
    typeof body.notifications_enabled !== "boolean" ||
    !isHHmm(body.notification_time)
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Validate timezone is a real IANA timezone
  if (!isValidTimezone(body.timezone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      timezone: body.timezone,
      notification_time: body.notification_time,
      notifications_enabled: body.notifications_enabled,
      onboarding_completed: true,
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

