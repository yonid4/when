/**
 * Mock API Response Shapes
 * Standard response formats from the backend API
 */

/**
 * Success response wrapper
 */
export function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Error response wrapper
 */
export function createErrorResponse(error = 'An error occurred', statusCode = 400) {
  return {
    success: false,
    error,
    statusCode,
  };
}

/**
 * Paginated response wrapper
 */
export function createPaginatedResponse(items, page = 1, pageSize = 20, totalCount = null) {
  const total = totalCount !== null ? totalCount : items.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      totalCount: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Standard API responses for common scenarios
 */

// Auth responses
export const mockAuthResponses = {
  loginSuccess: {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000, // 1 hour from now
    },
  },
  loginError: createErrorResponse('Invalid email or password', 401),
  signupSuccess: {
    user: {
      id: 'user-new-123',
      email: 'newuser@example.com',
      full_name: 'New User',
    },
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
    },
  },
  signupError: createErrorResponse('Email already exists', 409),
  logoutSuccess: createSuccessResponse(null, 'Logged out successfully'),
};

// Event responses
export const mockEventResponses = {
  createSuccess: (eventData) => createSuccessResponse(eventData, 'Event created successfully'),
  createError: createErrorResponse('Failed to create event', 400),
  getSuccess: (eventData) => createSuccessResponse(eventData),
  getError: createErrorResponse('Event not found', 404),
  updateSuccess: (eventData) => createSuccessResponse(eventData, 'Event updated successfully'),
  updateError: createErrorResponse('Failed to update event', 400),
  deleteSuccess: createSuccessResponse(null, 'Event deleted successfully'),
  deleteError: createErrorResponse('Failed to delete event', 400),
  listSuccess: (events) => createSuccessResponse(events),
  listError: createErrorResponse('Failed to fetch events', 500),
};

// Participant responses
export const mockParticipantResponses = {
  addSuccess: (participantData) => createSuccessResponse(participantData, 'Participant added successfully'),
  addError: createErrorResponse('Failed to add participant', 400),
  updateStatusSuccess: (participantData) => createSuccessResponse(participantData, 'Status updated successfully'),
  updateStatusError: createErrorResponse('Failed to update status', 400),
  listSuccess: (participants) => createSuccessResponse(participants),
  listError: createErrorResponse('Failed to fetch participants', 500),
};

// Busy slots responses
export const mockBusySlotsResponses = {
  createSuccess: (busySlot) => createSuccessResponse(busySlot, 'Busy slot created'),
  createError: createErrorResponse('Failed to create busy slot', 400),
  listSuccess: (busySlots) => createSuccessResponse(busySlots),
  listError: createErrorResponse('Failed to fetch busy slots', 500),
  deleteSuccess: createSuccessResponse(null, 'Busy slot deleted'),
  deleteError: createErrorResponse('Failed to delete busy slot', 400),
  syncSuccess: (result) => createSuccessResponse(result, 'Calendar synced successfully'),
  syncError: createErrorResponse('Failed to sync calendar', 500),
};

// Proposed times responses
export const mockProposedTimesResponses = {
  generateSuccess: (proposedTimes) => createSuccessResponse(proposedTimes, 'Time proposals generated'),
  generateError: createErrorResponse('Failed to generate time proposals', 500),
  listSuccess: (proposedTimes) => createSuccessResponse(proposedTimes),
  listError: createErrorResponse('Failed to fetch proposed times', 500),
};

// Notification responses
export const mockNotificationResponses = {
  listSuccess: (notifications) => createSuccessResponse(notifications),
  listError: createErrorResponse('Failed to fetch notifications', 500),
  markReadSuccess: createSuccessResponse(null, 'Notification marked as read'),
  markReadError: createErrorResponse('Failed to mark notification as read', 400),
  markAllReadSuccess: createSuccessResponse(null, 'All notifications marked as read'),
  deleteSuccess: createSuccessResponse(null, 'Notification deleted'),
  deleteError: createErrorResponse('Failed to delete notification', 400),
  getUnreadCountSuccess: (count) => createSuccessResponse({ count }),
};

// Invitation responses
export const mockInvitationResponses = {
  sendSuccess: (invitation) => createSuccessResponse(invitation, 'Invitation sent'),
  sendError: createErrorResponse('Failed to send invitation', 400),
  respondSuccess: (invitation) => createSuccessResponse(invitation, 'Invitation response recorded'),
  respondError: createErrorResponse('Failed to respond to invitation', 400),
  listSuccess: (invitations) => createSuccessResponse(invitations),
  listError: createErrorResponse('Failed to fetch invitations', 500),
};

// Finalization responses
export const mockFinalizationResponses = {
  finalizeSuccess: (result) => createSuccessResponse(result, 'Event finalized successfully'),
  finalizeError: createErrorResponse('Failed to finalize event', 400),
  alreadyFinalizedError: createErrorResponse('Event already finalized', 409),
  notCoordinatorError: createErrorResponse('Only coordinator can finalize event', 403),
  noCalendarError: createErrorResponse('Google Calendar not connected', 400),
};

// Google Calendar responses
export const mockGoogleCalendarResponses = {
  connectSuccess: createSuccessResponse({ auth_url: 'https://accounts.google.com/o/oauth2/auth?...' }, 'Redirect to Google'),
  connectError: createErrorResponse('Failed to initiate Google OAuth', 500),
  callbackSuccess: createSuccessResponse({ connected: true }, 'Calendar connected successfully'),
  callbackError: createErrorResponse('Failed to connect calendar', 400),
  disconnectSuccess: createSuccessResponse(null, 'Calendar disconnected'),
  disconnectError: createErrorResponse('Failed to disconnect calendar', 400),
};

// Validation errors
export const mockValidationErrors = {
  missingFields: createErrorResponse({
    message: 'Validation failed',
    errors: {
      name: 'Name is required',
      duration_minutes: 'Duration must be greater than 0',
    },
  }, 422),
  invalidEmail: createErrorResponse({
    message: 'Validation failed',
    errors: {
      email: 'Invalid email format',
    },
  }, 422),
  invalidDateRange: createErrorResponse({
    message: 'Validation failed',
    errors: {
      earliest_date: 'Earliest date must be before latest date',
    },
  }, 422),
};

// Network errors
export const mockNetworkErrors = {
  timeout: {
    message: 'Request timeout',
    code: 'ECONNABORTED',
  },
  networkError: {
    message: 'Network Error',
    code: 'ERR_NETWORK',
  },
  serverError: createErrorResponse('Internal server error', 500),
  serviceUnavailable: createErrorResponse('Service temporarily unavailable', 503),
};

export default {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  mockAuthResponses,
  mockEventResponses,
  mockParticipantResponses,
  mockBusySlotsResponses,
  mockProposedTimesResponses,
  mockNotificationResponses,
  mockInvitationResponses,
  mockFinalizationResponses,
  mockGoogleCalendarResponses,
  mockValidationErrors,
  mockNetworkErrors,
};
