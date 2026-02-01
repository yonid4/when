import { useState, useEffect } from "react";
import api from "../services/api";

const CALENDAR_PROMPT_KEY = 'calendar_prompt_shown';
const FIRST_EVENT_CREATION_KEY = 'first_event_creation';
const FIRST_EVENT_VIEW_KEY = 'first_event_view';

export const useCalendarConnection = () => {
  const [needsCalendarPrompt, setNeedsCalendarPrompt] = useState(false);
  const [calendarPromptContext, setCalendarPromptContext] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user has Google Calendar connected via API
  // Checks both legacy endpoint and new calendar-accounts endpoint for backwards compatibility
  const checkGoogleCalendarConnection = async () => {
    try {
      setIsChecking(true);

      // Try the legacy connection-status endpoint first
      try {
        const response = await api.get('/api/calendar/connection-status');
        if (response.data.connected) {
          setIsConnected(true);
          return true;
        }
      } catch (legacyError) {
        // Legacy endpoint may fail, continue to check new endpoint
        console.debug('Legacy connection check failed, trying new endpoint');
      }

      // Also check the new calendar-accounts endpoint
      try {
        const accountsResponse = await api.get('/api/calendar-accounts/');
        const hasAccounts = (accountsResponse.data.accounts?.length || 0) > 0;
        setIsConnected(hasAccounts);
        return hasAccounts;
      } catch (accountsError) {
        // New endpoint may not exist yet during migration
        console.debug('Calendar accounts check failed:', accountsError.message);
      }

      setIsConnected(false);
      return false;
    } catch (error) {
      console.error('Failed to check calendar connection:', error);
      setIsConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection status on mount
  useEffect(() => {
    checkGoogleCalendarConnection();
  }, []);

  // Get connection status synchronously
  const hasGoogleCalendar = () => {
    return isConnected;
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
  const shouldShowCalendarPrompt = (context, isConnected = null) => {
    // Use passed isConnected value if provided, otherwise use state
    const connected = isConnected !== null ? isConnected : hasGoogleCalendar();

    // Don't show if already connected
    if (connected) {
      return false;
    }

    // Show on first event creation
    if (context === 'create' && isFirstEventCreation()) {
      return true;
    }

    // Show on first event page view
    if (context === 'view') {
      return true;
    }

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

  // Connect Google Calendar - redirect to backend OAuth endpoint
  const connectGoogleCalendar = async () => {
    try {
      // Store current URL to return after OAuth
      const returnUrl = window.location.pathname;
      
      // Get Google OAuth URL from backend
      const response = await api.get('/api/auth/google', {
        params: { return_url: returnUrl }
      });
      
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
  const handleCalendarConnected = async () => {
    // Re-check connection status
    await checkGoogleCalendarConnection();
    hideCalendarPrompt();
  };

  // Handle skip calendar connection
  const handleSkipCalendar = () => {
    if (calendarPromptContext) {
      markCalendarPromptShown(calendarPromptContext);
    }
    hideCalendarPrompt();
  };

  return {
    needsCalendarPrompt,
    calendarPromptContext,
    isConnected,
    isChecking,
    hasGoogleCalendar,
    checkGoogleCalendarConnection,
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