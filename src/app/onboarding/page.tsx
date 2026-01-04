import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/utils/env";
import { ensureProfileExists, getProfileForUser } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import OnboardingClient from "@/components/features/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);

  if (profile.onboarding_completed) redirect("/");

  return <OnboardingClient vapidPublicKey={getRequiredEnv("VAPID_PUBLIC_KEY")} />;
}

