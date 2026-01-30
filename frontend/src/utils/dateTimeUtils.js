/**
 * Date and time formatting utilities for event scheduling.
 */

/**
 * Format an hour value to 12-hour display format.
 *
 * @param {number|string} hour - Hour in 24-hour format (0-23)
 * @returns {string} Formatted time string (e.g., "9 AM", "12 PM", "3 PM")
 *
 * @example
 * formatHour(0)  // "12 AM"
 * formatHour(9)  // "9 AM"
 * formatHour(12) // "12 PM"
 * formatHour(15) // "3 PM"
 */
export const formatHour = (hour) => {
  const h = parseInt(hour);
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
};
