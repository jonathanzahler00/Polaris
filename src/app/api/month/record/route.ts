import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import { saveMonthClip } from "@/lib/services/month-clip";

export async function POST(request: Request) {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const audio = formData.get("audio") as Blob | null;
  const durationStr = formData.get("duration_seconds") as string | null;
  if (!audio || !(audio instanceof Blob) || !durationStr) {
    return NextResponse.json({ error: "Missing audio or duration_seconds" }, { status: 400 });
  }

  const duration = Number(durationStr);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
    return NextResponse.json({ error: "duration_seconds must be 1–60" }, { status: 400 });
  }

  const result = await saveMonthClip(
    session.user.id,
    session.profile.timezone,
    audio,
    duration,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
