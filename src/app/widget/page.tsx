import { getSessionWithProfile } from "@/lib/services/auth";
import WidgetClient from "@/components/features/widget/WidgetClient";

export default async function WidgetPage() {
  const { user, profile } = await getSessionWithProfile({ requireOnboarding: true });
  const widgetToken = user.user_metadata?.widget_token ?? null;
  const widgetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://polarisapp.vercel.app"}/api/widget/today`;
  return <WidgetClient initialToken={widgetToken} widgetUrl={widgetUrl} />;
}
