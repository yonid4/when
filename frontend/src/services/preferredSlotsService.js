import api from "./api";

/**
 * Service for managing preferred time slots.
 * Handles CRUD operations for user-selected preferred times.
 */

/**
 * Get all preferred slots for an event
 * @param {string} eventId - Event UID or database ID
 * @returns {Promise<Array>} Array of preferred slots with user info
 */
export const getPreferredSlots = async (eventId) => {
  const response = await api.get(`/api/events/${eventId}/preferred-slots`);
  return response.data.slots || [];
};

/**
 * Add a new preferred slot
 * @param {string} eventId - Event UID or database ID
 * @param {Object} slotData - Slot data {start_time_utc, end_time_utc}
 * @returns {Promise<Object>} Created slot data
 */
export const addPreferredSlot = async (eventId, slotData) => {
  const response = await api.post(`/api/events/${eventId}/preferred-slots`, {
    start_time_utc: slotData.start_time_utc,
    end_time_utc: slotData.end_time_utc
  });
  return response.data;
};

/**
 * Delete a preferred slot
 * @param {string} eventId - Event UID or database ID
 * @param {string} slotId - Slot UUID
 * @returns {Promise<Object>} Success message
 */
export const deletePreferredSlot = async (eventId, slotId) => {
  const response = await api.delete(`/api/events/${eventId}/preferred-slots/${slotId}`);
  return response.data;
};




