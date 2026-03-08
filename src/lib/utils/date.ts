import { DateTime } from "luxon";

export function getLocalDateISO(timezone: string, now = DateTime.now()): string {
  const value = now.setZone(timezone).toISODate();
  if (!value) throw new Error("Invalid date");
  return value;
}

export function getLocalTimeHHmm(timezone: string, now = DateTime.now()): string {
  return now.setZone(timezone).toFormat("HH:mm");
}

export function normalizeTimeToHHmm(timeValue: string): string {
  // Postgres `time` often comes back as "HH:MM:SS".
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) return timeValue.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(timeValue)) return timeValue;
  throw new Error("Invalid time format");
}

export function daysSinceSignupInTimezone(
  createdAtIso: string,
  timezone: string,
  now = DateTime.now(),
): number {
  const signupDay = DateTime.fromISO(createdAtIso).setZone(timezone).startOf("day");
  const today = now.setZone(timezone).startOf("day");
  return Math.max(0, Math.floor(today.diff(signupDay, "days").days));
}

/** Current month in user's timezone as YYYY-MM for monthly clip key. */
export function getLocalMonthKey(timezone: string, now = DateTime.now()): string {
  return now.setZone(timezone).toFormat("yyyy-MM");
}

