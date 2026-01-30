/**
 * Shared constants for event creation and management.
 */
import { FiBriefcase, FiMusic, FiGift, FiCalendar } from "react-icons/fi";

/**
 * Event type options with associated icons and colors.
 */
export const eventTypes = [
  { value: "meeting", label: "Meeting", color: "blue", icon: FiBriefcase },
  { value: "social", label: "Social", color: "green", icon: FiMusic },
  { value: "birthday", label: "Birthday", color: "pink", icon: FiGift },
  { value: "other", label: "Other", color: "purple", icon: FiCalendar }
];

/**
 * Duration options for events with display labels.
 */
export const durationOptions = [
  { value: "15", label: "15 min", short: "15m" },
  { value: "30", label: "30 min", short: "30m" },
  { value: "60", label: "1 hour", short: "1h" },
  { value: "90", label: "1.5 hours", short: "1.5h" },
  { value: "120", label: "2 hours", short: "2h" },
  { value: "180", label: "3 hours", short: "3h" }
];

/**
 * Location type constants for event venues.
 */
export const LOCATION_TYPES = {
  IN_PERSON: "in_person",
  VIRTUAL: "virtual",
  BOTH: "both"
};

/**
 * Get the display label for a duration value.
 *
 * @param {string} value - Duration value in minutes (e.g., "60")
 * @returns {string} Human-readable duration label (e.g., "1 hour")
 */
export const getDurationLabel = (value) => {
  const option = durationOptions.find(o => o.value === value);
  return option ? option.label : `${value} minutes`;
};
