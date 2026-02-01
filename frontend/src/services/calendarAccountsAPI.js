/**
 * Calendar Accounts API service for multi-calendar support.
 *
 * Provides methods to:
 * - List and manage connected calendar accounts
 * - Toggle calendar sources on/off
 * - Set write calendar for event creation
 * - Sync calendars from provider
 */
import api from "./api";

export const calendarAccountsAPI = {
    /**
     * Get all connected calendar accounts for the current user.
     * @returns {Promise<Object>} { accounts: Array, count: number }
     */
    getAccounts: async () => {
        const res = await api.get("/api/calendar-accounts/");
        return res.data;
    },

    /**
     * Get a single calendar account by ID.
     * @param {string} accountId - Account's unique ID
     * @returns {Promise<Object>} Account with sources
     */
    getAccount: async (accountId) => {
        const res = await api.get(`/api/calendar-accounts/${accountId}`);
        return res.data;
    },

    /**
     * Disconnect a calendar account (revokes token, deletes sources).
     * @param {string} accountId - Account's unique ID
     * @returns {Promise<Object>} Success message
     */
    deleteAccount: async (accountId) => {
        const res = await api.delete(`/api/calendar-accounts/${accountId}`);
        return res.data;
    },

    /**
     * Fetch available calendars from the provider API.
     * This returns the current state from Google, not the DB.
     * @param {string} accountId - Account's unique ID
     * @returns {Promise<Object>} { calendars: Array, count: number }
     */
    getAccountCalendars: async (accountId) => {
        const res = await api.get(`/api/calendar-accounts/${accountId}/calendars`);
        return res.data;
    },

    /**
     * Sync calendar list from provider to database.
     * @param {string} accountId - Account's unique ID
     * @returns {Promise<Object>} { message, sources: Array, count: number }
     */
    syncCalendars: async (accountId) => {
        const res = await api.post(`/api/calendar-accounts/${accountId}/sync-calendars`);
        return res.data;
    },

    /**
     * Update a calendar source (toggle enabled, set write calendar).
     * @param {string} sourceId - Source's unique ID
     * @param {Object} updates - { is_enabled?: boolean, is_write_calendar?: boolean }
     * @returns {Promise<Object>} Updated source
     */
    updateSource: async (sourceId, updates) => {
        const res = await api.put(`/api/calendar-accounts/sources/${sourceId}`, updates);
        return res.data;
    },

    /**
     * Get the user's write calendar (where events are created).
     * @returns {Promise<Object>} { write_calendar: Object | null }
     */
    getWriteCalendar: async () => {
        const res = await api.get("/api/calendar-accounts/write-calendar");
        return res.data;
    },
};

export default calendarAccountsAPI;
