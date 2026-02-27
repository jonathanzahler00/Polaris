import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/utils/env";
import { getSessionWithProfile } from "@/lib/services/auth";

import OnboardingClient from "@/components/features/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const session = await getSessionWithProfile();
  if (session.profile.onboarding_completed) redirect("/");
  return <OnboardingClient vapidPublicKey={getRequiredEnv("VAPID_PUBLIC_KEY")} />;
}

