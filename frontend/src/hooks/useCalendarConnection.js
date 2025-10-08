import { useState, useEffect } from "react";
import api from "../services/api";

const CALENDAR_PROMPT_KEY = 'calendar_prompt_shown';
const FIRST_EVENT_CREATION_KEY = 'first_event_creation';
const FIRST_EVENT_VIEW_KEY = 'first_event_view';

export const useCalendarConnection = () => {
  const [needsCalendarPrompt, setNeedsCalendarPrompt] = useState(false);
  const [calendarPromptContext, setCalendarPromptContext] = useState(null);

  // Check if user has Google Calendar connected
  // For now, we'll assume they don't have it connected
  // This can be enhanced later to check actual user profile
  const hasGoogleCalendar = () => {
    return false; // Simplified for now
  };

  // Check if prompt was shown for this context
  const hasShownCalendarPrompt = (context) => {
    const shown = localStorage.getItem(`${CALENDAR_PROMPT_KEY}_${context}`);
    return shown === 'true';
  };

  // Mark prompt as shown for this context
  const markCalendarPromptShown = (context) => {
    localStorage.setItem(`${CALENDAR_PROMPT_KEY}_${context}`, 'true');
  };

  // Check if this is first event creation attempt
  const isFirstEventCreation = () => {
    const firstCreation = localStorage.getItem(FIRST_EVENT_CREATION_KEY);
    return firstCreation !== 'true';
  };

  // Check if this is first event view
  const isFirstEventView = () => {
    const firstView = localStorage.getItem(FIRST_EVENT_VIEW_KEY);
    return firstView !== 'true';
  };

  // Mark first event creation attempt
  const markFirstEventCreation = () => {
    localStorage.setItem(FIRST_EVENT_CREATION_KEY, 'true');
  };

  // Mark first event view
  const markFirstEventView = () => {
    localStorage.setItem(FIRST_EVENT_VIEW_KEY, 'true');
  };

  // Determine if calendar prompt should be shown
  const shouldShowCalendarPrompt = (context) => {
    // Don't show if already connected
    if (hasGoogleCalendar()) return false;
    
    // Don't show if already shown for this context
    if (hasShownCalendarPrompt(context)) return false;
    
    // Show on first event creation
    if (context === 'create' && isFirstEventCreation()) return true;
    
    // Show on first event page view
    if (context === 'view' && isFirstEventView()) return true;
    
    return false;
  };

  // Show calendar prompt
  const showCalendarPrompt = (context) => {
    setCalendarPromptContext(context);
    setNeedsCalendarPrompt(true);
  };

  // Hide calendar prompt
  const hideCalendarPrompt = () => {
    setNeedsCalendarPrompt(false);
    setCalendarPromptContext(null);
  };

  // Connect Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      const response = await api.post('/api/auth/google/connect');
      if (response.data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      throw error;
    }
  };

  // Handle calendar connection success
  const handleCalendarConnected = () => {
    hideCalendarPrompt();
    // Optionally show success message
    console.log('Google Calendar connected successfully!');
  };

  // Handle skip calendar connection
  const handleSkipCalendar = () => {
    markCalendarPromptShown(calendarPromptContext);
    hideCalendarPrompt();
  };

  return {
    needsCalendarPrompt,
    calendarPromptContext,
    hasGoogleCalendar,
    shouldShowCalendarPrompt,
    showCalendarPrompt,
    hideCalendarPrompt,
    connectGoogleCalendar,
    handleCalendarConnected,
    handleSkipCalendar,
    markFirstEventCreation,
    markFirstEventView
  };
};
