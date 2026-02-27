import { redirect } from "next/navigation";

import { getOptionalSession } from "@/lib/services/auth";

import LoginClient from "@/components/features/login/LoginClient";

export default async function LoginPage() {
  const session = await getOptionalSession();
  if (session) {
    redirect(session.profile.onboarding_completed ? "/" : "/onboarding");
  }
  return <LoginClient />;
}

