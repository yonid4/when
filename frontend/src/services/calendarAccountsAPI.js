import api from "./api.js";

export const calendarAccountsAPI = {
    async getAccounts() {
        const res = await api.get("/api/calendar-accounts/");
        return res.data;
    },

    async getAccount(accountId) {
        const res = await api.get(`/api/calendar-accounts/${accountId}`);
        return res.data;
    },

    async deleteAccount(accountId) {
        const res = await api.delete(`/api/calendar-accounts/${accountId}`);
        return res.data;
    },

    async getAccountCalendars(accountId) {
        const res = await api.get(`/api/calendar-accounts/${accountId}/calendars`);
        return res.data;
    },

    async syncCalendars(accountId) {
        const res = await api.post(`/api/calendar-accounts/${accountId}/sync-calendars`);
        return res.data;
    },

    async updateSource(sourceId, updates) {
        const res = await api.put(`/api/calendar-accounts/sources/${sourceId}`, updates);
        return res.data;
    },

    async getWriteCalendar() {
        const res = await api.get("/api/calendar-accounts/write-calendar");
        return res.data;
    }
};

export default calendarAccountsAPI;
