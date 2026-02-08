import { useEffect, useState } from "react";

import api from "../services/api.js";

const CALENDAR_PROMPT_KEY = "calendar_prompt_shown";
const FIRST_EVENT_CREATION_KEY = "first_event_creation";
const FIRST_EVENT_VIEW_KEY = "first_event_view";

function getLocalStorageFlag(key) {
  return localStorage.getItem(key) === "true";
}

function setLocalStorageFlag(key) {
  localStorage.setItem(key, "true");
}

export function useCalendarConnection() {
  const [needsCalendarPrompt, setNeedsCalendarPrompt] = useState(false);
  const [calendarPromptContext, setCalendarPromptContext] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  async function checkCalendarConnection() {
    try {
      setIsChecking(true);

      // Try the legacy connection-status endpoint first
      try {
        const response = await api.get("/api/calendar/connection-status");
        if (response.data.connected) {
          setIsConnected(true);
          setIsGoogleConnected(true);
        }
      } catch {
        console.debug("Legacy connection check failed, trying new endpoint");
      }

      // Check the new calendar-accounts endpoint
      try {
        const accountsResponse = await api.get("/api/calendar-accounts/");
        const accounts = accountsResponse.data.accounts || [];
        const hasAccounts = accounts.length > 0;
        const hasGoogle = accounts.some((a) => a.provider === "google");
        const hasMicrosoft = accounts.some((a) => a.provider === "microsoft");

        setIsConnected(hasAccounts);
        setIsGoogleConnected(hasGoogle);
        setIsMicrosoftConnected(hasMicrosoft);
        return hasAccounts;
      } catch (accountsError) {
        console.debug("Calendar accounts check failed:", accountsError.message);
      }

      setIsConnected(false);
      return false;
    } catch (error) {
      console.error("Failed to check calendar connection:", error);
      setIsConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }

  // Backward compat alias
  const checkGoogleCalendarConnection = checkCalendarConnection;

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  function hasGoogleCalendar() {
    return isConnected;
  }

  function markCalendarPromptShown(context) {
    setLocalStorageFlag(`${CALENDAR_PROMPT_KEY}_${context}`);
  }

  function isFirstEventCreation() {
    return !getLocalStorageFlag(FIRST_EVENT_CREATION_KEY);
  }

  function isFirstEventView() {
    return !getLocalStorageFlag(FIRST_EVENT_VIEW_KEY);
  }

  function markFirstEventCreation() {
    setLocalStorageFlag(FIRST_EVENT_CREATION_KEY);
  }

  function markFirstEventView() {
    setLocalStorageFlag(FIRST_EVENT_VIEW_KEY);
  }

  function shouldShowCalendarPrompt(context, connectedOverride = null) {
    const connected = connectedOverride !== null ? connectedOverride : hasGoogleCalendar();

    if (connected) {
      return false;
    }

    if (context === "create" && isFirstEventCreation()) {
      return true;
    }

    if (context === "view") {
      return true;
    }

    return false;
  }

  function showCalendarPrompt(context) {
    setCalendarPromptContext(context);
    setNeedsCalendarPrompt(true);
  }

  function hideCalendarPrompt() {
    setNeedsCalendarPrompt(false);
    setCalendarPromptContext(null);
  }

  async function connectGoogleCalendar() {
    const returnUrl = window.location.pathname;

    const response = await api.get("/api/auth/google", {
      params: { return_url: returnUrl },
    });

    if (response.data.auth_url) {
      window.location.href = response.data.auth_url;
    }
  }

  async function connectMicrosoftCalendar() {
    const returnUrl = window.location.pathname;

    const response = await api.get("/api/auth/microsoft", {
      params: { return_url: returnUrl },
    });

    if (response.data.auth_url) {
      window.location.href = response.data.auth_url;
    }
  }

  async function handleCalendarConnected() {
    await checkCalendarConnection();
    hideCalendarPrompt();
  }

  function handleSkipCalendar() {
    if (calendarPromptContext) {
      markCalendarPromptShown(calendarPromptContext);
    }
    hideCalendarPrompt();
  }

  return {
    needsCalendarPrompt,
    calendarPromptContext,
    isConnected,
    isGoogleConnected,
    isMicrosoftConnected,
    isChecking,
    hasGoogleCalendar,
    checkCalendarConnection,
    checkGoogleCalendarConnection,
    shouldShowCalendarPrompt,
    showCalendarPrompt,
    hideCalendarPrompt,
    connectGoogleCalendar,
    connectMicrosoftCalendar,
    handleCalendarConnected,
    handleSkipCalendar,
    markFirstEventCreation,
    markFirstEventView,
  };
}
