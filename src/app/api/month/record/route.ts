import { NextResponse } from "next/server";
import { getAuthAndProfile } from "@/lib/services/auth";
import {
  registerMonthClip,
  saveMonthClip,
  type MediaType,
} from "@/lib/services/month-clip";

/**
 * Two flows are supported:
 *
 * 1. (preferred, used for video) JSON body `{ duration_seconds, media_type }`
 *    after the client uploaded the blob directly to Supabase Storage via a
 *    signed URL from `/api/month/record/sign`. This avoids the Vercel function
 *    request body size limit (default ~4.5 MB) which 60s videos blow past.
 *
 * 2. (legacy / small audio fallback) `multipart/form-data` with a `clip` blob.
 *    The server uploads to Storage on the user's behalf.
 */
export async function POST(request: Request) {
  const session = await getAuthAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let body: { duration_seconds?: number; media_type?: string };
    try {
      body = (await request.json()) as { duration_seconds?: number; media_type?: string };
    } catch {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const duration = Number(body.duration_seconds);
    const mediaType = body.media_type ?? "audio";
    if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
      return NextResponse.json({ error: "duration_seconds must be 1–60" }, { status: 400 });
    }
    if (mediaType !== "audio" && mediaType !== "video") {
      return NextResponse.json({ error: "media_type must be audio or video" }, { status: 400 });
    }
    const result = await registerMonthClip(
      session.user.id,
      session.profile.timezone,
      duration,
      mediaType as MediaType,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const clip = formData.get("clip") as Blob | File | null;
  const durationStr = formData.get("duration_seconds") as string | null;
  const mediaType = (formData.get("media_type") as string | null) ?? "audio";
  if (!clip || !durationStr) {
    return NextResponse.json({ error: "Missing clip or duration_seconds" }, { status: 400 });
  }
  if (mediaType !== "audio" && mediaType !== "video") {
    return NextResponse.json({ error: "media_type must be audio or video" }, { status: 400 });
  }
  const blob = clip instanceof Blob ? clip : (clip as File);
  let buffer: Buffer;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Invalid clip file" }, { status: 400 });
  }

  const duration = Number(durationStr);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
    return NextResponse.json({ error: "duration_seconds must be 1–60" }, { status: 400 });
  }

  const result = await saveMonthClip(
    session.user.id,
    session.profile.timezone,
    buffer,
    duration,
    mediaType as MediaType,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
