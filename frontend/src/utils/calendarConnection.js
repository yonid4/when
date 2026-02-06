/**
 * Calendar Connection Utility Functions
 * Manages localStorage state for calendar prompts and first-use tracking
 */

const CALENDAR_PROMPT_KEY = "calendar_prompt_shown";
const FIRST_EVENT_CREATION_KEY = "first_event_creation";
const FIRST_EVENT_VIEW_KEY = "first_event_view";

/**
 * Check if calendar prompt was shown for a specific context
 */
export function hasShownCalendarPrompt(context) {
  return localStorage.getItem(`${CALENDAR_PROMPT_KEY}_${context}`) === "true";
}

/**
 * Mark calendar prompt as shown for a specific context
 */
export function markCalendarPromptShown(context) {
  localStorage.setItem(`${CALENDAR_PROMPT_KEY}_${context}`, "true");
}

/**
 * Check if this is the first event creation attempt
 */
export function isFirstEventCreation() {
  return localStorage.getItem(FIRST_EVENT_CREATION_KEY) !== "true";
}

/**
 * Check if this is the first event view
 */
export function isFirstEventView() {
  return localStorage.getItem(FIRST_EVENT_VIEW_KEY) !== "true";
}

/**
 * Mark first event creation attempt
 */
export function markFirstEventCreation() {
  localStorage.setItem(FIRST_EVENT_CREATION_KEY, "true");
}

/**
 * Mark first event view
 */
export function markFirstEventView() {
  localStorage.setItem(FIRST_EVENT_VIEW_KEY, "true");
}

/**
 * Clear all calendar connection tracking data
 */
export function clearCalendarConnectionData() {
  localStorage.removeItem(CALENDAR_PROMPT_KEY);
  localStorage.removeItem(FIRST_EVENT_CREATION_KEY);
  localStorage.removeItem(FIRST_EVENT_VIEW_KEY);

  Object.keys(localStorage)
    .filter(key => key.startsWith(`${CALENDAR_PROMPT_KEY}_`))
    .forEach(key => localStorage.removeItem(key));
}

/**
 * Get all calendar connection tracking data (for debugging/analytics)
 */
export function getCalendarConnectionData() {
  const keys = Object.keys(localStorage);
  const calendarKeys = keys.filter(key =>
    key.startsWith(CALENDAR_PROMPT_KEY) ||
    key === FIRST_EVENT_CREATION_KEY ||
    key === FIRST_EVENT_VIEW_KEY
  );

  return calendarKeys.reduce((data, key) => {
    data[key] = localStorage.getItem(key);
    return data;
  }, {});
}

/**
 * Check if user should see calendar prompt based on context and history
 */
export function shouldShowCalendarPrompt(context, hasGoogleCalendar = false) {
  if (hasGoogleCalendar) return false;
  if (hasShownCalendarPrompt(context)) return false;

  if (context === "create" && isFirstEventCreation()) return true;
  if (context === "view" && isFirstEventView()) return true;

  return false;
}
