import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileExists, getProfileForUser } from "@/lib/services/profile";
import WidgetClient from "@/components/features/widget/WidgetClient";

export default async function WidgetPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureProfileExists(user.id);
  const profile = await getProfileForUser(user.id);

  if (!profile.onboarding_completed) redirect("/onboarding");

  const widgetToken = user.user_metadata?.widget_token || null;
  const widgetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://polarisapp.vercel.app"}/api/widget/today`;

  return <WidgetClient initialToken={widgetToken} widgetUrl={widgetUrl} />;
}
