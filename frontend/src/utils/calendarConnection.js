// Calendar Connection Utility Functions

const CALENDAR_PROMPT_KEY = 'calendar_prompt_shown';
const FIRST_EVENT_CREATION_KEY = 'first_event_creation';
const FIRST_EVENT_VIEW_KEY = 'first_event_view';

/**
 * Check if calendar prompt was shown for a specific context
 * @param {string} context - The context ('create', 'view', etc.)
 * @returns {boolean} - True if prompt was shown for this context
 */
export const hasShownCalendarPrompt = (context) => {
  const shown = localStorage.getItem(`${CALENDAR_PROMPT_KEY}_${context}`);
  return shown === 'true';
};

/**
 * Mark calendar prompt as shown for a specific context
 * @param {string} context - The context ('create', 'view', etc.)
 */
export const markCalendarPromptShown = (context) => {
  localStorage.setItem(`${CALENDAR_PROMPT_KEY}_${context}`, 'true');
};

/**
 * Check if this is the first event creation attempt
 * @returns {boolean} - True if this is the first attempt
 */
export const isFirstEventCreation = () => {
  const firstCreation = localStorage.getItem(FIRST_EVENT_CREATION_KEY);
  return firstCreation !== 'true';
};

/**
 * Check if this is the first event view
 * @returns {boolean} - True if this is the first view
 */
export const isFirstEventView = () => {
  const firstView = localStorage.getItem(FIRST_EVENT_VIEW_KEY);
  return firstView !== 'true';
};

/**
 * Mark first event creation attempt
 */
export const markFirstEventCreation = () => {
  localStorage.setItem(FIRST_EVENT_CREATION_KEY, 'true');
};

/**
 * Mark first event view
 */
export const markFirstEventView = () => {
  localStorage.setItem(FIRST_EVENT_VIEW_KEY, 'true');
};

/**
 * Clear all calendar connection tracking data
 * Useful for testing or resetting user state
 */
export const clearCalendarConnectionData = () => {
  localStorage.removeItem(CALENDAR_PROMPT_KEY);
  localStorage.removeItem(FIRST_EVENT_CREATION_KEY);
  localStorage.removeItem(FIRST_EVENT_VIEW_KEY);
  
  // Clear all context-specific prompt flags
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(`${CALENDAR_PROMPT_KEY}_`)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Get all calendar connection tracking data
 * Useful for debugging or analytics
 * @returns {object} - Object containing all tracking data
 */
export const getCalendarConnectionData = () => {
  const keys = Object.keys(localStorage);
  const calendarKeys = keys.filter(key => 
    key.startsWith(CALENDAR_PROMPT_KEY) || 
    key === FIRST_EVENT_CREATION_KEY || 
    key === FIRST_EVENT_VIEW_KEY
  );
  
  const data = {};
  calendarKeys.forEach(key => {
    data[key] = localStorage.getItem(key);
  });
  
  return data;
};

/**
 * Check if user should see calendar prompt based on context and history
 * @param {string} context - The context ('create', 'view', etc.)
 * @param {boolean} hasGoogleCalendar - Whether user has Google Calendar connected
 * @returns {boolean} - True if prompt should be shown
 */
export const shouldShowCalendarPrompt = (context, hasGoogleCalendar = false) => {
  // Don't show if already connected
  if (hasGoogleCalendar) return false;
  
  // Don't show if already shown for this context
  if (hasShownCalendarPrompt(context)) return false;
  
  // Show on first event creation
  if (context === 'create' && isFirstEventCreation()) return true;
  
  // Show on first event view
  if (context === 'view' && isFirstEventView()) return true;
  
  return false;
};
