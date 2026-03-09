import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import { listClips } from "@/lib/services/month-clip";

export async function GET() {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clips = await listClips(session.user.id);
  return NextResponse.json({ clips });
}
