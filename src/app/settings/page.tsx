import { getSessionWithProfile } from "@/lib/services/auth";
import SettingsClient from "@/components/features/settings/SettingsClient";

export default async function SettingsPage() {
  await getSessionWithProfile();
  return <SettingsClient />;
}
