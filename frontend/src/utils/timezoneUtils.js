/**
 * Timezone utility functions for converting between UTC and local time
 * Store in UTC, display in local timezone
 */

/**
 * Get user's current timezone (IANA format)
 */
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert UTC datetime string to local datetime-local input format
 */
export function utcToLocalDatetimeInput(utcDatetimeStr) {
  if (!utcDatetimeStr) return "";

  const date = new Date(utcDatetimeStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/**
 * Convert local datetime-local input to UTC ISO string
 */
export function localDatetimeInputToUtc(localDatetimeStr) {
  if (!localDatetimeStr) return null;
  return new Date(localDatetimeStr).toISOString();
}

/**
 * Convert separate date/time to UTC (for legacy format support)
 */
export function dateTimeToUtc(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return localDatetimeInputToUtc(`${dateStr}T${timeStr}`);
}

/**
 * Format timezone for display (e.g., "EST", "PST")
 */
export function formatTimezone(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short"
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find(p => p.type === "timeZoneName")?.value || timezone;
  } catch {
    return timezone;
  }
}
