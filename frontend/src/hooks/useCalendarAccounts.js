import { useCallback, useEffect, useState } from "react";

import { calendarAccountsAPI } from "../services/calendarAccountsAPI.js";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || fallback;
}

function updateSourceInAccounts(accounts, sourceId, updates) {
  return accounts.map((account) => ({
    ...account,
    calendar_sources: account.calendar_sources?.map((source) =>
      source.id === sourceId ? { ...source, ...updates } : source
    ),
  }));
}

export function useCalendarAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [writeCalendars, setWriteCalendars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [accountsRes, writeCalendarRes] = await Promise.all([
        calendarAccountsAPI.getAccounts(),
        calendarAccountsAPI.getWriteCalendar(),
      ]);

      setAccounts(accountsRes.accounts || []);
      setWriteCalendars(writeCalendarRes.write_calendars || []);
    } catch (err) {
      console.error("Failed to fetch calendar accounts:", err);
      setError(getErrorMessage(err, "Failed to load calendar accounts"));
      setAccounts([]);
      setWriteCalendars([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function disconnectAccount(accountId) {
    try {
      setError(null);
      await calendarAccountsAPI.deleteAccount(accountId);

      setAccounts((prev) => prev.filter((a) => a.id !== accountId));

      // Re-fetch write calendars as one might have been deleted
      const writeCalendarRes = await calendarAccountsAPI.getWriteCalendar();
      setWriteCalendars(writeCalendarRes.write_calendars || []);

      return true;
    } catch (err) {
      console.error("Failed to disconnect account:", err);
      setError(getErrorMessage(err, "Failed to disconnect account"));
      return false;
    }
  }

  async function toggleSourceEnabled(sourceId, isEnabled) {
    try {
      setError(null);
      await calendarAccountsAPI.updateSource(sourceId, { is_enabled: isEnabled });

      setAccounts((prev) => updateSourceInAccounts(prev, sourceId, { is_enabled: isEnabled }));

      return true;
    } catch (err) {
      console.error("Failed to toggle source:", err);
      setError(getErrorMessage(err, "Failed to update calendar"));
      return false;
    }
  }

  async function setWriteCalendarSource(sourceId) {
    try {
      setError(null);
      await calendarAccountsAPI.updateSource(sourceId, { is_write_calendar: true });

      // Re-fetch everything to ensure correct state (backend handles provider-exclusive logic)
      await fetchAccounts();

      return true;
    } catch (err) {
      console.error("Failed to set write calendar:", err);
      setError(getErrorMessage(err, "Failed to set write calendar"));
      return false;
    }
  }

  async function syncAccountCalendars(accountId) {
    try {
      setError(null);
      setIsSyncing(true);

      const result = await calendarAccountsAPI.syncCalendars(accountId);
      await fetchAccounts();

      return result;
    } catch (err) {
      console.error("Failed to sync calendars:", err);
      setError(getErrorMessage(err, "Failed to sync calendars"));
      return null;
    } finally {
      setIsSyncing(false);
    }
  }

  const hasConnectedAccounts = accounts.length > 0;

  const hasEnabledCalendars = accounts.some((account) =>
    account.calendar_sources?.some((source) => source.is_enabled)
  );

  const enabledCalendarsCount = accounts.reduce(
    (count, account) =>
      count + (account.calendar_sources?.filter((source) => source.is_enabled)?.length || 0),
    0
  );

  const allSources = accounts.flatMap((account) =>
    (account.calendar_sources || []).map((source) => ({
      ...source,
      account: {
        id: account.id,
        provider: account.provider,
        provider_email: account.provider_email,
      },
    }))
  );

  function clearError() {
    setError(null);
  }

  return {
    accounts,
    writeCalendars,
    isLoading,
    isSyncing,
    error,
    hasConnectedAccounts,
    hasEnabledCalendars,
    enabledCalendarsCount,
    allSources,
    refetch: fetchAccounts,
    disconnectAccount,
    toggleSourceEnabled,
    setWriteCalendarSource,
    syncAccountCalendars,
    clearError,
  };
}

export default useCalendarAccounts;
