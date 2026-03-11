import { getSessionWithProfile } from "@/lib/services/auth";
import SettingsClient from "@/components/features/settings/SettingsClient";

export default async function SettingsPage() {
  await getSessionWithProfile();
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  return <SettingsClient vapidPublicKey={vapidPublicKey} />;
}
