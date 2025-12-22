/**
 * Mock data for testing that matches backend API response formats
 * All data structures mirror the actual API responses
 */

/**
 * Mock Users
 */
export const mockUser = {
  id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://i.pravatar.cc/150?img=1',
  timezone: 'America/New_York',
  google_calendar_connected: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

/**
 * Mock Supabase Session (for auth tests)
 */
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000, // 1 hour from now
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://i.pravatar.cc/150?img=1',
    },
    app_metadata: {},
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
};

export const mockCoordinator = {
  id: 'coord-uuid-1234',
  email: 'coordinator@example.com',
  full_name: 'Sarah Coordinator',
  avatar_url: 'https://i.pravatar.cc/150?img=5',
  timezone: 'America/Los_Angeles',
  google_calendar_connected: true,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-10T10:00:00Z',
};

export const mockParticipant = {
  id: 'part-uuid-5678',
  email: 'participant@example.com',
  full_name: 'John Participant',
  avatar_url: 'https://i.pravatar.cc/150?img=13',
  timezone: 'Europe/London',
  google_calendar_connected: false,
  created_at: '2024-01-12T10:00:00Z',
  updated_at: '2024-01-12T10:00:00Z',
};

/**
 * Mock Events
 */
export const mockEvent = {
  id: 'event-uuid-abc123',
  uid: 'evt_shortid_12345',
  name: 'Team Standup',
  description: 'Weekly team standup meeting',
  coordinator_id: 'coord-uuid-1234',
  duration_minutes: 30,
  earliest_date: '2024-12-25',
  latest_date: '2024-12-31',
  earliest_hour: '09:00:00',
  latest_hour: '17:00:00',
  status: 'planning', // planning, finalized, cancelled
  finalized_start_time_utc: null,
  finalized_end_time_utc: null,
  google_calendar_event_id: null,
  google_calendar_html_link: null,
  finalized_at: null,
  proposals_needs_regeneration: false,
  proposals_last_generated_at: null,
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-01T10:00:00Z',
};

export const mockFinalizedEvent = {
  ...mockEvent,
  id: 'event-uuid-xyz789',
  uid: 'evt_finalized_99999',
  name: 'Product Demo',
  status: 'finalized',
  finalized_start_time_utc: '2024-12-28T15:00:00Z',
  finalized_end_time_utc: '2024-12-28T15:30:00Z',
  google_calendar_event_id: 'gcal_event_123',
  google_calendar_html_link: 'https://calendar.google.com/event?eid=abc123',
  finalized_at: '2024-12-20T14:30:00Z',
};

export const mockEvents = [
  mockEvent,
  mockFinalizedEvent,
  {
    id: 'event-uuid-def456',
    uid: 'evt_meeting_67890',
    name: 'Design Review',
    description: 'Review new UI designs',
    coordinator_id: 'coord-uuid-1234',
    duration_minutes: 60,
    earliest_date: '2024-12-26',
    latest_date: '2024-12-30',
    earliest_hour: '10:00:00',
    latest_hour: '16:00:00',
    status: 'planning',
    finalized_start_time_utc: null,
    finalized_end_time_utc: null,
    google_calendar_event_id: null,
    google_calendar_html_link: null,
    finalized_at: null,
    proposals_needs_regeneration: true,
    proposals_last_generated_at: '2024-12-19T10:00:00Z',
    created_at: '2024-12-02T14:00:00Z',
    updated_at: '2024-12-02T14:00:00Z',
  },
];

/**
 * Mock Participants
 */
export const mockParticipants = [
  {
    event_id: 'event-uuid-abc123',
    user_id: 'coord-uuid-1234',
    status: 'accepted', // pending, accepted, declined
    is_coordinator: true,
    joined_at: '2024-12-01T10:00:00Z',
    name: 'Sarah Coordinator',
    email: 'coordinator@example.com',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
  },
  {
    event_id: 'event-uuid-abc123',
    user_id: 'part-uuid-5678',
    status: 'accepted',
    is_coordinator: false,
    joined_at: '2024-12-01T11:00:00Z',
    name: 'John Participant',
    email: 'participant@example.com',
    avatar_url: 'https://i.pravatar.cc/150?img=13',
  },
  {
    event_id: 'event-uuid-abc123',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    status: 'pending',
    is_coordinator: false,
    joined_at: '2024-12-01T12:00:00Z',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
  },
];

/**
 * Mock Proposed Times (AI-generated time suggestions)
 */
export const mockProposedTimes = [
  {
    id: 'proposal-uuid-1',
    event_id: 'event-uuid-abc123',
    start_time_utc: '2024-12-26T14:00:00Z',
    end_time_utc: '2024-12-26T14:30:00Z',
    score: 95,
    conflicts: 0,
    reasoning: 'No conflicts, preferred time zone for most participants',
    availableCount: 3,
    totalParticipants: 3,
    created_at: '2024-12-20T10:00:00Z',
  },
  {
    id: 'proposal-uuid-2',
    event_id: 'event-uuid-abc123',
    start_time_utc: '2024-12-27T10:00:00Z',
    end_time_utc: '2024-12-27T10:30:00Z',
    score: 85,
    conflicts: 0,
    reasoning: 'Morning slot, good for international team',
    availableCount: 3,
    totalParticipants: 3,
    created_at: '2024-12-20T10:00:00Z',
  },
  {
    id: 'proposal-uuid-3',
    event_id: 'event-uuid-abc123',
    start_time_utc: '2024-12-28T16:00:00Z',
    end_time_utc: '2024-12-28T16:30:00Z',
    score: 75,
    conflicts: 1,
    reasoning: 'One participant has minor conflict',
    availableCount: 2,
    totalParticipants: 3,
    created_at: '2024-12-20T10:00:00Z',
  },
];

/**
 * Mock Busy Slots
 */
export const mockBusySlots = [
  {
    id: 'busy-uuid-1',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    start_time_utc: '2024-12-26T09:00:00Z',
    end_time_utc: '2024-12-26T10:00:00Z',
    source: 'google_calendar', // google_calendar, manual
    external_event_id: 'gcal_event_456',
    event_title: 'Morning Meeting',
    created_at: '2024-12-20T08:00:00Z',
    updated_at: '2024-12-20T08:00:00Z',
  },
  {
    id: 'busy-uuid-2',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    start_time_utc: '2024-12-27T13:00:00Z',
    end_time_utc: '2024-12-27T14:00:00Z',
    source: 'manual',
    external_event_id: null,
    event_title: 'Lunch Break',
    created_at: '2024-12-20T08:00:00Z',
    updated_at: '2024-12-20T08:00:00Z',
  },
];

/**
 * Mock Preferred Slots
 */
export const mockPreferredSlots = [
  {
    id: 'pref-uuid-1',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    event_id: 'event-uuid-abc123',
    start_time_utc: '2024-12-26T14:00:00Z',
    end_time_utc: '2024-12-26T14:30:00Z',
    created_at: '2024-12-20T12:00:00Z',
  },
  {
    id: 'pref-uuid-2',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    event_id: 'event-uuid-abc123',
    start_time_utc: '2024-12-27T10:00:00Z',
    end_time_utc: '2024-12-27T10:30:00Z',
    created_at: '2024-12-20T12:00:00Z',
  },
];

/**
 * Mock Notifications
 */
export const mockNotifications = [
  {
    id: 'notif-uuid-1',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    event_id: 'event-uuid-abc123',
    notification_type: 'event_invitation', // event_invitation, event_finalized, event_deleted
    title: "You're invited to Team Standup",
    message: 'Sarah Coordinator has invited you to join the event "Team Standup".',
    metadata: {
      coordinator_id: 'coord-uuid-1234',
      invitation_id: 'inv-uuid-1',
    },
    is_read: false,
    read_at: null,
    action_taken: false,
    action_type: null,
    action_at: null,
    created_at: '2024-12-20T11:00:00Z',
  },
  {
    id: 'notif-uuid-2',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    event_id: 'event-uuid-xyz789',
    notification_type: 'event_finalized',
    title: 'Event Finalized: Product Demo',
    message: 'The event "Product Demo" has been scheduled for Friday, December 28, 2024 at 03:00 PM UTC. Check your Google Calendar for details.',
    metadata: {
      finalized_time: 'Friday, December 28, 2024 at 03:00 PM UTC',
      google_calendar_link: 'https://calendar.google.com/event?eid=abc123',
    },
    is_read: true,
    read_at: '2024-12-20T12:00:00Z',
    action_taken: false,
    action_type: null,
    action_at: null,
    created_at: '2024-12-20T14:30:00Z',
  },
  {
    id: 'notif-uuid-3',
    user_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    event_id: 'event-uuid-old',
    notification_type: 'event_deleted',
    title: 'Event Cancelled: Old Meeting',
    message: 'The event "Old Meeting" has been cancelled by the coordinator.',
    metadata: {
      deleted_by: 'coord-uuid-1234',
    },
    is_read: true,
    read_at: '2024-12-19T10:00:00Z',
    action_taken: true,
    action_type: 'acknowledged',
    action_at: '2024-12-19T10:01:00Z',
    created_at: '2024-12-19T09:00:00Z',
  },
];

/**
 * Mock Invitations
 */
export const mockInvitations = [
  {
    id: 'inv-uuid-1',
    event_id: 'event-uuid-abc123',
    inviter_id: 'coord-uuid-1234',
    invitee_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    invitee_email: 'test@example.com',
    status: 'pending', // pending, accepted, declined
    created_at: '2024-12-20T11:00:00Z',
    updated_at: '2024-12-20T11:00:00Z',
  },
  {
    id: 'inv-uuid-2',
    event_id: 'event-uuid-def456',
    inviter_id: 'coord-uuid-1234',
    invitee_id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    invitee_email: 'test@example.com',
    status: 'accepted',
    created_at: '2024-12-18T10:00:00Z',
    updated_at: '2024-12-18T11:00:00Z',
  },
];

/**
 * Mock User Events Response (with role information)
 */
export const mockUserEvents = [
  {
    ...mockEvent,
    role: 'coordinator',
    participant_count: 3,
    unread_notifications: 1,
  },
  {
    ...mockFinalizedEvent,
    role: 'participant',
    participant_count: 5,
    unread_notifications: 0,
  },
];

/**
 * Helper function to create a mock user with custom properties
 */
export function createMockUser(overrides = {}) {
  return {
    ...mockUser,
    ...overrides,
  };
}

/**
 * Helper function to create a mock event with custom properties
 */
export function createMockEvent(overrides = {}) {
  return {
    ...mockEvent,
    ...overrides,
  };
}

/**
 * Helper function to create mock participants
 */
export function createMockParticipants(count = 3, eventId = 'event-uuid-abc123') {
  return Array.from({ length: count }, (_, i) => ({
    event_id: eventId,
    user_id: `user-uuid-${i}`,
    status: i === 0 ? 'accepted' : 'pending',
    is_coordinator: i === 0,
    joined_at: `2024-12-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    avatar_url: `https://i.pravatar.cc/150?img=${i + 1}`,
  }));
}

export default {
  mockUser,
  mockSession,
  mockCoordinator,
  mockParticipant,
  mockEvent,
  mockFinalizedEvent,
  mockEvents,
  mockParticipants,
  mockProposedTimes,
  mockBusySlots,
  mockPreferredSlots,
  mockNotifications,
  mockInvitations,
  mockUserEvents,
  createMockUser,
  createMockEvent,
  createMockParticipants,
};
