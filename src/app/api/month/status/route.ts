import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import { getMonthClipStatus } from "@/lib/services/month-clip";

export async function GET() {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { month, hasRecorded } = await getMonthClipStatus(
    session.user.id,
    session.profile.timezone,
  );
  return NextResponse.json({ month, hasRecordedThisMonth: hasRecorded });
}
