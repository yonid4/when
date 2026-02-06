import api from "./api.js";

export const eventsAPI = {
    async getAll() {
        const res = await api.get("/api/events/");
        return res.data;
    },

    async getByUid(uid, bustCache = false) {
        const url = bustCache ? `/api/events/${uid}?_t=${Date.now()}` : `/api/events/${uid}`;
        const res = await api.get(url);
        return res.data;
    },

    async create(eventData) {
        const res = await api.post("/api/events", eventData);
        return res.data;
    },

    async update(eventId, updates) {
        const res = await api.put(`/api/events/${eventId}`, updates);
        return res.data;
    },

    async delete(eventId) {
        const res = await api.delete(`/api/events/${eventId}`);
        return res.data;
    },

    async getParticipants(eventUid) {
        const res = await api.get(`/api/events/${eventUid}/participants`);
        return res.data;
    },

    async addParticipant(eventId, userId) {
        const res = await api.post(`/api/events/${eventId}/participants`, { user_id: userId });
        return res.data;
    },

    /** @deprecated Use updateRsvpStatus for attendance intent */
    async updateParticipantStatus(eventId, userId, status) {
        const res = await api.put(`/api/events/${eventId}/participants/${userId}`, { status });
        return res.data;
    },

    async updateRsvpStatus(eventUid, status) {
        const res = await api.put(`/api/events/${eventUid}/status`, { status });
        return res.data;
    },

    async sendInvitations(eventUid, emails) {
        const res = await api.post(`/api/events/${eventUid}/invitations`, { emails });
        return res.data;
    },

    async finalize(eventUid, data) {
        const res = await api.post(`/api/events/${eventUid}/finalize`, data);
        return res.data;
    },

    async getFinalizationStatus(eventUid) {
        const res = await api.get(`/api/events/${eventUid}/finalize/status`);
        return res.data;
    },

    async proposeTimesAI(eventUid, numSuggestions = 5, forceRefresh = false) {
        const res = await api.post(`/api/events/${eventUid}/propose-times`, {
            num_suggestions: numSuggestions,
            force_refresh: forceRefresh
        });
        return res.data;
    },

    async refreshProposalsAI(eventUid) {
        const res = await api.post(`/api/events/${eventUid}/propose-times/refresh`);
        return res.data;
    },

    async syncEventCalendars(eventUid) {
        const res = await api.post(`/api/calendar/sync-event/${eventUid}`);
        return res.data;
    }
};

export const preferredSlotsAPI = {
    async getByEvent(eventId) {
        const res = await api.get(`/api/events/${eventId}/preferred-slots`);
        return res.data.slots || [];
    },

    async create(eventId, slotData) {
        const res = await api.post(`/api/events/${eventId}/preferred-slots`, slotData);
        return res.data;
    },

    async delete(eventId, slotId) {
        const res = await api.delete(`/api/events/${eventId}/preferred-slots/${slotId}`);
        return res.data;
    }
};

export const busySlotsAPI = {
    async add(eventId, slots) {
        const res = await api.post(`/api/busy_slots/${eventId}`, { slots });
        return res.data;
    },

    async getByEvent(eventId) {
        const res = await api.get(`/api/busy_slots/${eventId}`);
        return res.data;
    },

    async getByUser(userId, eventId) {
        const res = await api.get(`/api/busy_slots/user/${userId}`, { params: { event_id: eventId } });
        return res.data;
    },

    async deleteByUser(eventId, userId) {
        const res = await api.delete(`/api/busy_slots/${eventId}/${userId}`);
        return res.data;
    },

    async getMerged(eventId) {
        const res = await api.get(`/api/busy_slots/event/${eventId}/merged`);
        return res.data;
    },

    async syncUserCalendar(userId, startDateISO, endDateISO) {
        const res = await api.post(`/api/busy_slots/sync/${userId}`, {
            start_date: startDateISO,
            end_date: endDateISO
        });
        return res.data;
    },

    async syncCalendar() {
        const res = await api.post("/api/calendar/sync");
        return res.data;
    },

    async getConnectionStatus() {
        const res = await api.get("/api/calendar/connection-status");
        return res.data;
    }
};

export const notificationsAPI = {
    async getAll(unreadOnly = false, limit = 50) {
        const params = new URLSearchParams();
        if (unreadOnly) params.append("unread_only", "true");
        params.append("limit", limit.toString());
        const res = await api.get(`/api/notifications?${params.toString()}`);
        return res.data;
    },

    async getUnreadCount() {
        const res = await api.get("/api/notifications/unread-count");
        return res.data.unread_count;
    },

    async markAsRead(notificationId) {
        const res = await api.post(`/api/notifications/${notificationId}/read`);
        return res.data;
    },

    async markAllAsRead() {
        const res = await api.post("/api/notifications/mark-all-read");
        return res.data;
    },

    async handleAction(notificationId, action) {
        const res = await api.post(`/api/notifications/${notificationId}/action`, { action });
        return res.data;
    },

    async delete(notificationId) {
        const res = await api.delete(`/api/notifications/${notificationId}`);
        return res.data;
    }
};

export const usersAPI = {
    async getProfile() {
        const res = await api.get("/api/users/profile");
        return res.data;
    },

    async updateProfile(data) {
        const res = await api.put("/api/users/profile", data);
        return res.data;
    },

    async search(email) {
        const res = await api.get(`/api/users/search?email=${encodeURIComponent(email)}`);
        return res.data;
    }
};

export default {
    events: eventsAPI,
    preferredSlots: preferredSlotsAPI,
    busySlots: busySlotsAPI,
    notifications: notificationsAPI,
    users: usersAPI
};
