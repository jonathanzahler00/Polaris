import { getLocalDateISO } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getTodayForAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile missing");

  const today = getLocalDateISO(profile.timezone);

  const { data: orientation } = await supabase
    .from("daily_orientations")
    .select("id,user_id,date,text,locked_at,created_at")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return { supabase, user, profile, today, orientation };
}

