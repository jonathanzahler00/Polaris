import { daysSinceSignupInTimezone, getLocalDateISO } from "@/lib/utils/date";
import { getSessionWithProfile } from "@/lib/services/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TodayClient from "@/components/features/today/TodayClient";

const PLACEHOLDER_EXAMPLES = [
  "…being present during dinner.",
  "…ending work when I said I would.",
  "…doing one thing fully.",
  "…not carrying stress home.",
] as const;

export default async function Home() {
  const { user, profile } = await getSessionWithProfile({ requireOnboarding: true });

  const supabase = await createSupabaseServerClient();
  const today = getLocalDateISO(profile.timezone);
  const { data: orientation } = await supabase
    .from("daily_orientations")
    .select("text")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const daysSince = daysSinceSignupInTimezone(profile.created_at, profile.timezone);
  const placeholder = PLACEHOLDER_EXAMPLES[daysSince % PLACEHOLDER_EXAMPLES.length];

  return (
    <TodayClient
      initialLockedText={orientation?.text ?? null}
      placeholder={placeholder}
    />
  );
}
