import { DateTime } from "luxon";

import { getSessionWithProfile } from "@/lib/services/auth";
import { hasRecordedClipForMonth } from "@/lib/services/month-clip";
import { getLocalMonthKey } from "@/lib/utils/date";
import MonthRecordClient from "@/components/features/month/MonthRecordClient";

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function previousMonthKey(monthKey: string): string {
  const dt = DateTime.fromFormat(monthKey, "yyyy-MM");
  return dt.minus({ months: 1 }).toFormat("yyyy-MM");
}

export default async function MonthPage() {
  const { user, profile } = await getSessionWithProfile({ requireOnboarding: true });
  const currentMonth = getLocalMonthKey(profile.timezone);
  const prevMonth = previousMonthKey(currentMonth);
  const [hasRecordedThisMonth, hasRecordedPreviousMonth] = await Promise.all([
    hasRecordedClipForMonth(user.id, profile.timezone, currentMonth),
    hasRecordedClipForMonth(user.id, profile.timezone, prevMonth),
  ]);
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <MonthRecordClient
        currentMonthKey={currentMonth}
        currentMonthLabel={formatMonthLabel(currentMonth)}
        hasRecordedThisMonth={hasRecordedThisMonth}
        previousMonthKey={prevMonth}
        previousMonthLabel={formatMonthLabel(prevMonth)}
        hasRecordedPreviousMonth={hasRecordedPreviousMonth}
      />
    </div>
  );
}
