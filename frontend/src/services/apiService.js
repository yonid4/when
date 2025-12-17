/**
 * Comprehensive API service for all backend endpoints
 * Consolidates individual service files and adds missing endpoints
 */
import api from "./api";

// ============================================================================
// EVENTS API
// ============================================================================

export const eventsAPI = {
    /**
     * Get all events for the current user (coordinator and participant)
     * @returns {Promise<Array>} Array of events with role property
     */
    getAll: async () => {
        const res = await api.get("/api/events/");
        return res.data;
    },

    /**
     * Get event by UID (used in URLs)
     * @param {string} uid - 12-character UID
     * @returns {Promise<Object>} Event with participants
     */
    getByUid: async (uid) => {
        const res = await api.get(`/api/events/${uid}`);
        return res.data;
    },

    /**
     * Create a new event
     * @param {Object} eventData - Event data
     * @returns {Promise<Object>} Created event with id and uid
     */
    create: async (eventData) => {
        const res = await api.post("/api/events", eventData);
        return res.data;
    },

    /**
     * Update an event
     * @param {string} eventId - Event ID or UID
     * @param {Object} updates - Event updates
     * @returns {Promise<Object>} Updated event
     */
    update: async (eventId, updates) => {
        const res = await api.put(`/api/events/${eventId}`, updates);
        return res.data;
    },

    /**
     * Delete an event
     * @param {string} eventId - Event ID or UID
     * @returns {Promise<Object>} Success message
     */
    delete: async (eventId) => {
        const res = await api.delete(`/api/events/${eventId}`);
        return res.data;
    },

    /**
     * Get event participants
     * @param {string} eventUid - Event UID
     * @returns {Promise<Array>} Participants with profile data
     */
    getParticipants: async (eventUid) => {
        const res = await api.get(`/api/events/${eventUid}/participants`);
        return res.data;
    },

    /**
     * Add participant to event
     * @param {string} eventId - Event ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Added participant
     */
    addParticipant: async (eventId, userId) => {
        const res = await api.post(`/api/events/${eventId}/participants`, { user_id: userId });
        return res.data;
    },

    /**
     * Update participant status (RSVP)
     * @param {string} eventId - Event ID (UUID, not UID!)
     * @param {string} userId - User ID
     * @param {string} status - 'accepted' | 'declined' | 'invited'
     * @returns {Promise<Object>} Updated participant
     */
    updateParticipantStatus: async (eventId, userId, status) => {
        const res = await api.put(`/api/events/${eventId}/participants/${userId}`, { status });
        return res.data;
    },

    /**
     * Send invitations to emails
     * @param {string} eventUid - Event UID
     * @param {Array<string>} emails - Array of email addresses
     * @returns {Promise<Object>} Invitation results
     */
    sendInvitations: async (eventUid, emails) => {
        const res = await api.post(`/api/events/${eventUid}/invitations`, { emails });
        return res.data;
    },

    /**
     * Finalize event and create Google Calendar event
     * @param {string} eventUid - Event UID
     * @param {Object} data - Finalization data
     * @param {string} data.start_time_utc - Start time in UTC
     * @param {string} data.end_time_utc - End time in UTC
     * @param {Array<string>} data.participant_ids - Array of participant IDs
     * @param {boolean} data.include_google_meet - Include Google Meet link
     * @returns {Promise<Object>} Finalization result with Google Calendar link
     */
    finalize: async (eventUid, data) => {
        const res = await api.post(`/api/events/${eventUid}/finalize`, data);
        return res.data;
    },

    /**
     * Get finalization status
     * @param {string} eventUid - Event UID
     * @returns {Promise<Object>} Finalization status
     */
    getFinalizationStatus: async (eventUid) => {
        const res = await api.get(`/api/events/${eventUid}/finalize/status`);
        return res.data;
    },

    /**
     * Generate AI-powered time proposals
     * @param {string} eventUid - Event UID
     * @param {number} numSuggestions - Number of suggestions (default 5)
     * @param {boolean} forceRefresh - Force regeneration of proposals (default false)
     * @returns {Promise<Object>} AI-generated time proposals with metadata
     */
    proposeTimesAI: async (eventUid, numSuggestions = 5, forceRefresh = false) => {
        const res = await api.post(`/api/events/${eventUid}/propose-times`, {
            num_suggestions: numSuggestions,
            force_refresh: forceRefresh
        });
        return res.data;
    },

    /**
     * Force refresh AI proposals for an event (coordinator only)
     * @param {string} eventUid - Event UID
     * @returns {Promise<Object>} Refreshed AI-generated time proposals
     */
    refreshProposalsAI: async (eventUid) => {
        const res = await api.post(`/api/events/${eventUid}/propose-times/refresh`);
        return res.data;
    },

    /**
     * Sync Google Calendars for all event participants (coordinator only)
     * @param {string} eventUid - Event UID
     * @returns {Promise<Object>} Sync results with details for each participant
     */
    syncEventCalendars: async (eventUid) => {
        const res = await api.post(`/api/calendar/sync-event/${eventUid}`);
        return res.data;
    }
};

// ============================================================================
// PREFERRED SLOTS API
// ============================================================================

export const preferredSlotsAPI = {
    /**
     * Get preferred slots for an event
     * @param {string} eventId - Event ID (UUID, not UID!)
     * @returns {Promise<Array>} Preferred slots
     */
    getByEvent: async (eventId) => {
        const res = await api.get(`/api/events/${eventId}/preferred-slots`);
        return res.data.slots || [];
    },

    /**
     * Add a preferred slot
     * @param {string} eventId - Event ID (UUID)
     * @param {Object} slotData - Slot data
     * @param {string} slotData.start_time_utc - Start time in UTC
     * @param {string} slotData.end_time_utc - End time in UTC
     * @returns {Promise<Object>} Created slot
     */
    create: async (eventId, slotData) => {
        const res = await api.post(`/api/events/${eventId}/preferred-slots`, slotData);
        return res.data;
    },

    /**
     * Delete a preferred slot
     * @param {string} eventId - Event ID (UUID)
     * @param {string} slotId - Slot ID
     * @returns {Promise<Object>} Success message
     */
    delete: async (eventId, slotId) => {
        const res = await api.delete(`/api/events/${eventId}/preferred-slots/${slotId}`);
        return res.data;
    }
};

// ============================================================================
// BUSY SLOTS API
// ============================================================================

export const busySlotsAPI = {
    /**
     * Get merged busy slots for all event participants
     * @param {string} eventId - Event ID (UUID, not UID!)
     * @returns {Promise<Array>} Busy slots
     */
    getMerged: async (eventId) => {
        const res = await api.get(`/api/busy_slots/event/${eventId}/merged`);
        return res.data;
    },

    /**
     * Sync user's Google Calendar
     * @returns {Promise<Object>} Sync result
     */
    syncCalendar: async () => {
        const res = await api.post("/api/calendar/sync");
        return res.data;
    },

    /**
     * Check Google Calendar connection status
     * @returns {Promise<Object>} Connection status
     */
    getConnectionStatus: async () => {
        const res = await api.get("/api/calendar/connection-status");
        return res.data;
    }
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsAPI = {
    /**
     * Get all notifications
     * @param {boolean} unreadOnly - Only fetch unread notifications
     * @param {number} limit - Maximum number to fetch
     * @returns {Promise<Object>} Notifications and unread count
     */
    getAll: async (unreadOnly = false, limit = 50) => {
        const params = new URLSearchParams();
        if (unreadOnly) params.append("unread_only", "true");
        params.append("limit", limit.toString());
        const res = await api.get(`/api/notifications?${params.toString()}`);
        return res.data;
    },

    /**
     * Get unread notification count
     * @returns {Promise<number>} Unread count
     */
    getUnreadCount: async () => {
        const res = await api.get("/api/notifications/unread-count");
        return res.data.unread_count;
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} Success message
     */
    markAsRead: async (notificationId) => {
        const res = await api.post(`/api/notifications/${notificationId}/read`);
        return res.data;
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<Object>} Success message
     */
    markAllAsRead: async () => {
        const res = await api.post("/api/notifications /mark-all-read");
        return res.data;
    },

    /**
     * Handle notification action (accept/decline invitation)
     * @param {string} notificationId - Notification ID
     * @param {string} action - 'accept' | 'decline'
     * @returns {Promise<Object>} Action result
     */
    handleAction: async (notificationId, action) => {
        const res = await api.post(`/api/notifications/${notificationId}/action`, { action });
        return res.data;
    },

    /**
     * Delete a notification
     * @param {string} notificationId - Notification ID
     * @returns {Promise<Object>} Success message
     */
    delete: async (notificationId) => {
        const res = await api.delete(`/api/notifications/${notificationId}`);
        return res.data;
    }
};

// ============================================================================
// USERS API
// ============================================================================

export const usersAPI = {
    /**
     * Get current user's profile
     * @returns {Promise<Object>} User profile
     */
    getProfile: async () => {
        const res = await api.get("/api/users/profile");
        return res.data;
    },

    /**
     * Update user profile
     * @param {Object} data - Profile updates
     * @returns {Promise<Object>} Updated profile
     */
    updateProfile: async (data) => {
        const res = await api.put("/api/users/profile", data);
        return res.data;
    },

    /**
     * Search users by email
     * @param {string} email - Email to search for
     * @returns {Promise<Array>} Matching users
     */
    search: async (email) => {
        const res = await api.get(`/api/users/search?email=${encodeURIComponent(email)}`);
        return res.data;
    }
};

// Export all APIs as a single object for convenience
export default {
    events: eventsAPI,
    preferredSlots: preferredSlotsAPI,
    busySlots: busySlotsAPI,
    notifications: notificationsAPI,
    users: usersAPI
};
