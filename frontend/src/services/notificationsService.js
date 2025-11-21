import api from "./api";

/**
 * Get user's notifications
 * @param {boolean} unreadOnly - Only fetch unread notifications
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Promise<{notifications: Array, unread_count: number}>}
 */
export const getNotifications = async (unreadOnly = false, limit = 20) => {
  const params = new URLSearchParams();
  if (unreadOnly) params.append("unread_only", "true");
  params.append("limit", limit.toString());

  const response = await api.get(`/api/notifications?${params.toString()}`);
  return response.data;
};

/**
 * Get unread notification count
 * @returns {Promise<number>}
 */
export const getUnreadCount = async () => {
  const response = await api.get("/api/notifications/unread-count");
  return response.data.unread_count;
};

/**
 * Mark a notification as read
 * @param {string} notificationId
 * @returns {Promise<{success: boolean}>}
 */
export const markAsRead = async (notificationId) => {
  const response = await api.post(`/api/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise<{success: boolean}>}
 */
export const markAllAsRead = async () => {
  const response = await api.post("/api/notifications/read-all");
  return response.data;
};

/**
 * Handle notification action (accept/decline invitation)
 * @param {string} notificationId
 * @param {string} action - 'accept' or 'decline'
 * @returns {Promise<{success: boolean, action: string, message: string}>}
 */
export const handleNotificationAction = async (notificationId, action) => {
  console.log(`DEBUG: handleNotificationAction called with notificationId=${notificationId}, action=${action}`);
  
  try {
    const response = await api.post(`/api/notifications/${notificationId}/action`, {
      action
    });
    console.log(`DEBUG: handleNotificationAction success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`DEBUG: handleNotificationAction error:`, error);
    console.error(`DEBUG: Error response:`, error.response?.data);
    console.error(`DEBUG: Error status:`, error.response?.status);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId
 * @returns {Promise<{success: boolean}>}
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/api/notifications/${notificationId}`);
  return response.data;
};

