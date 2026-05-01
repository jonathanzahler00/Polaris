import { NextResponse } from "next/server";

import { getAuthUser } from "@/lib/services/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("monthly_report_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
  }
  return NextResponse.json({ enabled: !!data?.monthly_report_enabled });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { enabled?: boolean };
  try {
    body = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be boolean" }, { status: 400 });
  }
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ monthly_report_enabled: body.enabled })
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
