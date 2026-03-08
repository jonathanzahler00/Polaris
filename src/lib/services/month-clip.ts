import { getLocalMonthKey } from "@/lib/utils/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function hasRecordedClipForMonth(
  userId: string,
  timezone: string,
  month?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const key = month ?? getLocalMonthKey(timezone);
  const { data } = await supabase
    .from("monthly_clips")
    .select("id")
    .eq("user_id", userId)
    .eq("month", key)
    .maybeSingle();
  return !!data;
}

export async function getMonthClipStatus(
  userId: string,
  timezone: string,
): Promise<{ month: string; hasRecorded: boolean }> {
  const month = getLocalMonthKey(timezone);
  const hasRecorded = await hasRecordedClipForMonth(userId, timezone, month);
  return { month, hasRecorded };
}

const MAX_DURATION_SECONDS = 60;
const BUCKET = "month-clips";

export async function saveMonthClip(
  userId: string,
  timezone: string,
  audioBlob: Blob,
  durationSeconds: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (durationSeconds < 1 || durationSeconds > MAX_DURATION_SECONDS) {
    return { ok: false, error: "Duration must be 1–60 seconds" };
  }
  const month = getLocalMonthKey(timezone);
  const admin = createSupabaseAdminClient();
  const path = `${userId}/${month}.webm`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, audioBlob, {
    contentType: "audio/webm",
    upsert: true,
  });
  if (uploadError) {
    return { ok: false, error: "Upload failed" };
  }

  const { error: upsertError } = await admin
    .from("monthly_clips")
    .upsert(
      {
        user_id: userId,
        month,
        storage_path: path,
        duration_seconds: durationSeconds,
      },
      { onConflict: "user_id,month" },
    );
  if (upsertError) {
    return { ok: false, error: "Save failed" };
  }
  return { ok: true };
}

const SIGNED_URL_EXPIRES_SEC = 3600;

export async function getClipPlaybackUrl(
  userId: string,
  month: string,
): Promise<{ url: string; duration_seconds: number } | null> {
  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("monthly_clips")
    .select("storage_path, duration_seconds")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (!row?.storage_path) return null;
  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_path, SIGNED_URL_EXPIRES_SEC);
  if (signed?.signedUrl) {
    return { url: signed.signedUrl, duration_seconds: row.duration_seconds };
  }
  return null;
}
