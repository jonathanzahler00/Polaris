import { getSessionWithProfile } from "@/lib/services/auth";
import SettingsClient from "@/components/features/settings/SettingsClient";

export default async function SettingsPage() {
  const { profile } = await getSessionWithProfile();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  const monthlyReportEnabled = !!(profile as { monthly_report_enabled?: boolean })
    .monthly_report_enabled;
  return (
    <SettingsClient
      vapidPublicKey={vapidPublicKey}
      monthlyReportEnabled={monthlyReportEnabled}
    />
  );
}
