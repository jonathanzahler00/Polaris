import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureProfileExists(userId: string) {
  // Use admin client to bypass RLS for profile creation
  const admin = createSupabaseAdminClient();

  // Check if profile exists using admin client
  const { data } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.user_id) return;

  // Create the profile with default values
  await admin
    .from("profiles")
    .upsert({
      user_id: userId,
      timezone: "America/New_York",
      notification_time: "07:00",
      notifications_enabled: false,
      onboarding_completed: false
    }, { onConflict: "user_id", ignoreDuplicates: true })
    .throwOnError();
}

export async function getProfileForUser(userId: string) {
  // Use admin client to bypass RLS when called from widget API
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Profile missing");
  return data;
}

