/**
 * Timezone validation utilities
 */

// Cache the list of valid timezones
let validTimezonesCache: Set<string> | null = null;

/**
 * Get the set of valid IANA timezone identifiers
 */
function getValidTimezones(): Set<string> {
  if (validTimezonesCache) {
    return validTimezonesCache;
  }

  try {
    // Modern browsers and Node.js 18+ support this
    const timezones = Intl.supportedValuesOf("timeZone");
    validTimezonesCache = new Set(timezones);
  } catch {
    // Fallback: common timezones if Intl.supportedValuesOf is not available
    validTimezonesCache = new Set([
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Phoenix",
      "America/Toronto",
      "America/Vancouver",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Rome",
      "Europe/Madrid",
      "Europe/Amsterdam",
      "Europe/Moscow",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Bangkok",
      "Asia/Singapore",
      "Asia/Hong_Kong",
      "Asia/Shanghai",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Perth",
      "Pacific/Auckland",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
    ]);
  }

  return validTimezonesCache;
}

/**
 * Check if a timezone string is a valid IANA timezone identifier
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== "string") {
    return false;
  }

  // Quick check against known valid timezones
  const validTimezones = getValidTimezones();
  if (validTimezones.has(timezone)) {
    return true;
  }

  // Additional check: try to use it with Intl.DateTimeFormat
  // This catches timezones that might not be in our cache
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate timezone and return a safe default if invalid
 */
export function validateTimezone(
  timezone: string,
  defaultTimezone = "America/New_York"
): string {
  return isValidTimezone(timezone) ? timezone : defaultTimezone;
}

