import { redirect } from "next/navigation";

import { ensureProfileExists, getProfileForUser } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import LoginClient from "@/components/features/login/LoginClient";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileExists(user.id);
    const profile = await getProfileForUser(user.id);
    redirect(profile.onboarding_completed ? "/" : "/onboarding");
  }

  return <LoginClient />;
}

