/**
 * Date and time formatting utilities for event scheduling
 */

/**
 * Format an hour value to 12-hour display format (e.g., "9 AM", "12 PM")
 */
export function formatHour(hour) {
  const h = parseInt(hour);
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}
