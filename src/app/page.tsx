import { redirect } from "next/navigation";

import { daysSinceSignupInTimezone, getLocalDateISO } from "@/lib/utils/date";
import { ensureProfileExists, getProfileForUser } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TodayClient from "@/components/features/today/TodayClient";

const PLACEHOLDER_EXAMPLES = [
  "…being present during dinner.",
  "…ending work when I said I would.",
  "…doing one thing fully.",
  "…not carrying stress home.",
] as const;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);

  if (!profile.onboarding_completed) redirect("/onboarding");

  const today = getLocalDateISO(profile.timezone);
  const { data: orientation } = await supabase
    .from("daily_orientations")
    .select("text")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const daysSince = daysSinceSignupInTimezone(profile.created_at, profile.timezone);
  // Always show placeholder examples - rotate through them based on days since signup
  const placeholder = PLACEHOLDER_EXAMPLES[daysSince % PLACEHOLDER_EXAMPLES.length];

  return (
    <TodayClient
      initialLockedText={orientation?.text ?? null}
      placeholder={placeholder}
    />
  );
}
