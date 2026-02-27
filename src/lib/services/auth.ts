import { redirect } from "next/navigation";

import { ensureProfileExists, getProfileForUser } from "@/lib/services/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Profile = Awaited<ReturnType<typeof getProfileForUser>>;

export type SessionWithProfile = {
  user: { id: string; user_metadata?: { widget_token?: string } };
  profile: Profile;
};

type GetSessionOptions = {
  requireOnboarding?: boolean;
};

/**
 * For server components: get current user and profile, redirect to /login or /onboarding if needed.
 */
export async function getSessionWithProfile(
  options?: GetSessionOptions
): Promise<SessionWithProfile> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);

  if (options?.requireOnboarding && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return { user, profile };
}

/**
 * For server components (e.g. login page): get session if it exists, no redirect.
 */
export async function getOptionalSession(): Promise<SessionWithProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);
  return { user, profile };
}

/**
 * For API routes that need user + profile. Returns null if unauthenticated.
 */
export async function getAuthAndProfile(): Promise<SessionWithProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);
  return { user, profile };
}

/**
 * For API routes that only need the current user. Returns null if unauthenticated.
 */
export async function getAuthUser(): Promise<{ id: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { id: user.id };
}
