import { useState, useEffect, useCallback } from "react";
import { calendarAccountsAPI } from "../services/calendarAccountsAPI";

/**
 * Hook for managing calendar accounts and sources.
 *
 * Provides:
 * - accounts: List of connected accounts with sources
 * - writeCalendar: Current write calendar source
 * - Loading and error states
 * - Methods to manage accounts and sources
 */
export const useCalendarAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [writeCalendar, setWriteCalendar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    /**
     * Fetch all accounts and write calendar
     */
    const fetchAccounts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [accountsRes, writeCalendarRes] = await Promise.all([
                calendarAccountsAPI.getAccounts(),
                calendarAccountsAPI.getWriteCalendar(),
            ]);

            setAccounts(accountsRes.accounts || []);
            setWriteCalendar(writeCalendarRes.write_calendar || null);
        } catch (err) {
            console.error("Failed to fetch calendar accounts:", err);
            setError(err.response?.data?.message || "Failed to load calendar accounts");
            setAccounts([]);
            setWriteCalendar(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    /**
     * Disconnect a calendar account
     * @param {string} accountId - Account to disconnect
     */
    const disconnectAccount = async (accountId) => {
        try {
            setError(null);
            await calendarAccountsAPI.deleteAccount(accountId);

            // Remove from local state
            setAccounts((prev) => prev.filter((a) => a.id !== accountId));

            // Refresh write calendar in case it was on deleted account
            const writeCalendarRes = await calendarAccountsAPI.getWriteCalendar();
            setWriteCalendar(writeCalendarRes.write_calendar || null);

            return true;
        } catch (err) {
            console.error("Failed to disconnect account:", err);
            setError(err.response?.data?.message || "Failed to disconnect account");
            return false;
        }
    };

    /**
     * Toggle a calendar source enabled/disabled
     * @param {string} sourceId - Source to toggle
     * @param {boolean} isEnabled - New enabled state
     */
    const toggleSourceEnabled = async (sourceId, isEnabled) => {
        try {
            setError(null);
            await calendarAccountsAPI.updateSource(sourceId, { is_enabled: isEnabled });

            // Update local state
            setAccounts((prev) =>
                prev.map((account) => ({
                    ...account,
                    calendar_sources: account.calendar_sources?.map((source) =>
                        source.id === sourceId ? { ...source, is_enabled: isEnabled } : source
                    ),
                }))
            );

            return true;
        } catch (err) {
            console.error("Failed to toggle source:", err);
            setError(err.response?.data?.message || "Failed to update calendar");
            return false;
        }
    };

    /**
     * Set a calendar source as the write calendar
     * @param {string} sourceId - Source to set as write calendar
     */
    const setWriteCalendarSource = async (sourceId) => {
        try {
            setError(null);
            await calendarAccountsAPI.updateSource(sourceId, { is_write_calendar: true });

            // Update local state - unset all others, set this one
            setAccounts((prev) =>
                prev.map((account) => ({
                    ...account,
                    calendar_sources: account.calendar_sources?.map((source) => ({
                        ...source,
                        is_write_calendar: source.id === sourceId,
                    })),
                }))
            );

            // Refresh write calendar
            const writeCalendarRes = await calendarAccountsAPI.getWriteCalendar();
            setWriteCalendar(writeCalendarRes.write_calendar || null);

            return true;
        } catch (err) {
            console.error("Failed to set write calendar:", err);
            setError(err.response?.data?.message || "Failed to set write calendar");
            return false;
        }
    };

    /**
     * Sync calendars from provider for an account
     * @param {string} accountId - Account to sync
     */
    const syncAccountCalendars = async (accountId) => {
        try {
            setError(null);
            setIsSyncing(true);

            const result = await calendarAccountsAPI.syncCalendars(accountId);

            // Refresh accounts to get updated sources
            await fetchAccounts();

            return result;
        } catch (err) {
            console.error("Failed to sync calendars:", err);
            setError(err.response?.data?.message || "Failed to sync calendars");
            return null;
        } finally {
            setIsSyncing(false);
        }
    };

    /**
     * Check if user has any connected accounts
     */
    const hasConnectedAccounts = accounts.length > 0;

    /**
     * Check if user has any enabled calendars
     */
    const hasEnabledCalendars = accounts.some((account) =>
        account.calendar_sources?.some((source) => source.is_enabled)
    );

    /**
     * Get total number of enabled calendars
     */
    const enabledCalendarsCount = accounts.reduce(
        (count, account) =>
            count + (account.calendar_sources?.filter((source) => source.is_enabled)?.length || 0),
        0
    );

    /**
     * Get all sources flattened with account info
     */
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

    return {
        // State
        accounts,
        writeCalendar,
        isLoading,
        isSyncing,
        error,

        // Computed
        hasConnectedAccounts,
        hasEnabledCalendars,
        enabledCalendarsCount,
        allSources,

        // Actions
        refetch: fetchAccounts,
        disconnectAccount,
        toggleSourceEnabled,
        setWriteCalendarSource,
        syncAccountCalendars,

        // Clear error
        clearError: () => setError(null),
    };
};

export default useCalendarAccounts;
