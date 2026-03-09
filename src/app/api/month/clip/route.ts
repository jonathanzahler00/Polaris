import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import { getClipPlaybackUrl } from "@/lib/services/month-clip";
import { getLocalMonthKey } from "@/lib/utils/date";

export async function GET(request: Request) {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : getLocalMonthKey(session.profile.timezone);
  const result = await getClipPlaybackUrl(session.user.id, month);
  if (!result) {
    return NextResponse.json({ error: "No clip for this month" }, { status: 404 });
  }
  return NextResponse.json({
    url: result.url,
    month,
    duration_seconds: result.duration_seconds,
    media_type: result.media_type,
  });
}
