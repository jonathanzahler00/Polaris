import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import { createMonthClipUploadToken, type MediaType } from "@/lib/services/month-clip";

export async function POST(request: Request) {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { media_type?: string };
  try {
    body = (await request.json()) as { media_type?: string };
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const mediaType = body.media_type ?? "audio";
  if (mediaType !== "audio" && mediaType !== "video") {
    return NextResponse.json({ error: "media_type must be audio or video" }, { status: 400 });
  }

  const result = await createMonthClipUploadToken(
    session.user.id,
    session.profile.timezone,
    mediaType as MediaType,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    token: result.token,
    path: result.path,
    bucket: result.bucket,
    month: result.month,
    content_type: result.content_type,
  });
}
