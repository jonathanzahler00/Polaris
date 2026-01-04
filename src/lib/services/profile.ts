import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureProfileExists(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.user_id) return;

  // Fallback: create the profile server-side if the auth trigger isn't set up yet.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createSupabaseAdminClient();
  await admin
    .from("profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true })
    .throwOnError();
}

export async function getProfileForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Profile missing");
  return data;
}

