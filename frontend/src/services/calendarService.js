import api from './api';

/**
 * Calendar Service - Handles Google Calendar connection and management
 */

/**
 * Connect Google Calendar for the current user
 * @returns {Promise<object>} - Response with auth_url for Google OAuth
 */
export const connectGoogleCalendar = async () => {
  try {
    const response = await api.post('/api/auth/google/connect');
    return response.data;
  } catch (error) {
    console.error('Failed to connect Google Calendar:', error);
    throw error;
  }
};

/**
 * Check if user has Google Calendar connected
 * @returns {Promise<boolean>} - True if calendar is connected
 */
export const checkCalendarConnection = async () => {
  try {
    const response = await api.get('/api/users/me');
    return response.data?.google_calendar_id !== null && 
           response.data?.google_calendar_id !== undefined;
  } catch (error) {
    console.error('Failed to check calendar connection:', error);
    return false;
  }
};

/**
 * Get user's calendar information
 * @returns {Promise<object>} - Calendar data including ID and timezone
 */
export const getCalendarInfo = async () => {
  try {
    const response = await api.get('/api/users/me');
    return {
      google_calendar_id: response.data?.google_calendar_id,
      timezone: response.data?.timezone,
      has_google_calendar: response.data?.google_calendar_id !== null
    };
  } catch (error) {
    console.error('Failed to get calendar info:', error);
    throw error;
  }
};

/**
 * Disconnect Google Calendar for the current user
 * @returns {Promise<object>} - Response from disconnect operation
 */
export const disconnectGoogleCalendar = async () => {
  try {
    const response = await api.delete('/api/auth/google/disconnect');
    return response.data;
  } catch (error) {
    console.error('Failed to disconnect Google Calendar:', error);
    throw error;
  }
};

/**
 * Get user's Google Calendar events
 * @param {string} startDate - Start date for events (ISO string)
 * @param {string} endDate - End date for events (ISO string)
 * @returns {Promise<Array>} - Array of calendar events
 */
export const getCalendarEvents = async (startDate, endDate) => {
  try {
    const response = await api.get('/api/calendar/events', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get calendar events:', error);
    throw error;
  }
};

/**
 * Create a calendar event
 * @param {object} eventData - Event data to create
 * @returns {Promise<object>} - Created event data
 */
export const createCalendarEvent = async (eventData) => {
  try {
    const response = await api.post('/api/calendar/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
};

/**
 * Update a calendar event
 * @param {string} eventId - ID of the event to update
 * @param {object} eventData - Updated event data
 * @returns {Promise<object>} - Updated event data
 */
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/api/calendar/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    throw error;
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - ID of the event to delete
 * @returns {Promise<object>} - Response from delete operation
 */
export const deleteCalendarEvent = async (eventId) => {
  try {
    const response = await api.delete(`/api/calendar/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    throw error;
  }
};