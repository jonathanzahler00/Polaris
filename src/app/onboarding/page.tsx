import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/env";
import { ensureProfileExists, getProfileForUser } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import OnboardingClient from "./OnboardingClient";

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

