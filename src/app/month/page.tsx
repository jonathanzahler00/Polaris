import { getSessionWithProfile } from "@/lib/services/auth";
import { hasRecordedClipForMonth } from "@/lib/services/month-clip";
import { getLocalMonthKey } from "@/lib/utils/date";
import MonthRecordClient from "@/components/features/month/MonthRecordClient";

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function MonthPage() {
  const { user, profile } = await getSessionWithProfile({ requireOnboarding: true });
  const currentMonth = getLocalMonthKey(profile.timezone);
  const hasRecordedThisMonth = await hasRecordedClipForMonth(user.id, profile.timezone, currentMonth);
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <MonthRecordClient
        currentMonthKey={currentMonth}
        currentMonthLabel={formatMonthLabel(currentMonth)}
        hasRecordedThisMonth={hasRecordedThisMonth}
      />
    </div>
  );
}
