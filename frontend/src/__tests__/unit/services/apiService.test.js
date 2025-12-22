/**
 * Unit Tests for API Service
 * Tests all CRUD operations, error handling, and request/response interceptors
 */

import apiService, { eventsAPI, preferredSlotsAPI, busySlotsAPI, notificationsAPI, usersAPI } from '../../../services/apiService';
import api from '../../../services/api';
import { mockEvent, mockEvents, mockUser, mockParticipants, mockProposedTimes } from 'test-fixtures/mockData';
import { mockEventResponses, mockNotificationResponses } from 'test-fixtures/mockApiResponses';

// Mock the api module
jest.mock('../../../services/api');

describe('apiService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ============================================================================
  // EVENTS API TESTS
  // ============================================================================

  describe('eventsAPI', () => {
    describe('getAll', () => {
      it('should fetch all user events', async () => {
        const mockResponse = { data: mockEvents };
        api.get.mockResolvedValue(mockResponse);

        const result = await eventsAPI.getAll();

        expect(api.get).toHaveBeenCalledWith('/api/events/');
        expect(result).toEqual(mockEvents);
      });

      it('should handle errors when fetching events', async () => {
        api.get.mockRejectedValue(new Error('Network error'));

        await expect(eventsAPI.getAll()).rejects.toThrow('Network error');
        expect(api.get).toHaveBeenCalledWith('/api/events/');
      });
    });

    describe('getByUid', () => {
      it('should fetch event by UID', async () => {
        const mockResponse = { data: mockEvent };
        api.get.mockResolvedValue(mockResponse);

        const result = await eventsAPI.getByUid(mockEvent.uid);

        expect(api.get).toHaveBeenCalledWith(`/api/events/${mockEvent.uid}`);
        expect(result).toEqual(mockEvent);
      });

      it('should handle 404 errors', async () => {
        const error = new Error('Not found');
        error.response = { status: 404, data: { error: 'Event not found' } };
        api.get.mockRejectedValue(error);

        await expect(eventsAPI.getByUid('invalid-uid')).rejects.toThrow('Not found');
      });
    });

    describe('create', () => {
      it('should create a new event', async () => {
        const eventData = {
          name: 'New Meeting',
          description: 'Test meeting',
          duration_minutes: 30,
          earliest_date: '2024-12-25',
          latest_date: '2024-12-31'
        };
        const mockResponse = { data: { ...mockEvent, ...eventData } };
        api.post.mockResolvedValue(mockResponse);

        const result = await eventsAPI.create(eventData);

        expect(api.post).toHaveBeenCalledWith('/api/events', eventData);
        expect(result.name).toEqual(eventData.name);
        expect(result.id).toBeDefined();
        expect(result.uid).toBeDefined();
      });

      it('should handle validation errors', async () => {
        const error = new Error('Validation failed');
        error.response = {
          status: 422,
          data: {
            error: 'Validation failed',
            details: { name: 'Name is required' }
          }
        };
        api.post.mockRejectedValue(error);

        await expect(eventsAPI.create({})).rejects.toThrow('Validation failed');
      });
    });

    describe('update', () => {
      it('should update an event', async () => {
        const updates = { name: 'Updated Event Name' };
        const mockResponse = { data: { ...mockEvent, ...updates } };
        api.put.mockResolvedValue(mockResponse);

        const result = await eventsAPI.update(mockEvent.id, updates);

        expect(api.put).toHaveBeenCalledWith(`/api/events/${mockEvent.id}`, updates);
        expect(result.name).toEqual(updates.name);
      });

      it('should handle unauthorized updates', async () => {
        const error = new Error('Unauthorized');
        error.response = { status: 403, data: { error: 'Not authorized to update this event' } };
        api.put.mockRejectedValue(error);

        await expect(eventsAPI.update(mockEvent.id, {})).rejects.toThrow('Unauthorized');
      });
    });

    describe('delete', () => {
      it('should delete an event', async () => {
        const mockResponse = { data: { success: true, message: 'Event deleted' } };
        api.delete.mockResolvedValue(mockResponse);

        const result = await eventsAPI.delete(mockEvent.id);

        expect(api.delete).toHaveBeenCalledWith(`/api/events/${mockEvent.id}`);
        expect(result.success).toBe(true);
      });

      it('should handle errors when deleting', async () => {
        api.delete.mockRejectedValue(new Error('Delete failed'));

        await expect(eventsAPI.delete(mockEvent.id)).rejects.toThrow('Delete failed');
      });
    });

    describe('getParticipants', () => {
      it('should fetch event participants', async () => {
        const mockResponse = { data: mockParticipants };
        api.get.mockResolvedValue(mockResponse);

        const result = await eventsAPI.getParticipants(mockEvent.uid);

        expect(api.get).toHaveBeenCalledWith(`/api/events/${mockEvent.uid}/participants`);
        expect(result).toEqual(mockParticipants);
      });
    });

    describe('addParticipant', () => {
      it('should add a participant to event', async () => {
        const userId = 'user-123';
        const mockResponse = { data: mockParticipants[0] };
        api.post.mockResolvedValue(mockResponse);

        const result = await eventsAPI.addParticipant(mockEvent.id, userId);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}/participants`,
          { user_id: userId }
        );
        expect(result).toEqual(mockParticipants[0]);
      });
    });

    describe('updateParticipantStatus', () => {
      it('should update participant RSVP status', async () => {
        const userId = 'user-123';
        const status = 'accepted';
        const mockResponse = { data: { ...mockParticipants[0], status } };
        api.put.mockResolvedValue(mockResponse);

        const result = await eventsAPI.updateParticipantStatus(mockEvent.id, userId, status);

        expect(api.put).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}/participants/${userId}`,
          { status }
        );
        expect(result.status).toEqual(status);
      });
    });

    describe('sendInvitations', () => {
      it('should send invitations to emails', async () => {
        const emails = ['user1@example.com', 'user2@example.com'];
        const mockResponse = { data: { sent: 2, failed: 0 } };
        api.post.mockResolvedValue(mockResponse);

        const result = await eventsAPI.sendInvitations(mockEvent.uid, emails);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.uid}/invitations`,
          { emails }
        );
        expect(result.sent).toBe(2);
      });
    });

    describe('finalize', () => {
      it('should finalize event and create calendar event', async () => {
        const finalizationData = {
          start_time_utc: '2024-12-28T15:00:00Z',
          end_time_utc: '2024-12-28T15:30:00Z',
          participant_ids: ['user-1', 'user-2'],
          include_google_meet: true
        };
        const mockResponse = {
          data: {
            event: { ...mockEvent, status: 'finalized' },
            google_calendar_link: 'https://calendar.google.com/event?eid=abc123'
          }
        };
        api.post.mockResolvedValue(mockResponse);

        const result = await eventsAPI.finalize(mockEvent.uid, finalizationData);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.uid}/finalize`,
          finalizationData
        );
        expect(result.event.status).toBe('finalized');
        expect(result.google_calendar_link).toBeDefined();
      });
    });

    describe('proposeTimesAI', () => {
      it('should generate AI time proposals', async () => {
        const mockResponse = {
          data: {
            proposals: mockProposedTimes,
            metadata: { total: 3, cache_hit: false }
          }
        };
        api.post.mockResolvedValue(mockResponse);

        const result = await eventsAPI.proposeTimesAI(mockEvent.uid, 3, false);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.uid}/propose-times`,
          { num_suggestions: 3, force_refresh: false }
        );
        expect(result.proposals).toHaveLength(3);
      });

      it('should use default parameters', async () => {
        const mockResponse = { data: { proposals: [] } };
        api.post.mockResolvedValue(mockResponse);

        await eventsAPI.proposeTimesAI(mockEvent.uid);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.uid}/propose-times`,
          { num_suggestions: 5, force_refresh: false }
        );
      });
    });
  });

  // ============================================================================
  // PREFERRED SLOTS API TESTS
  // ============================================================================

  describe('preferredSlotsAPI', () => {
    describe('getByEvent', () => {
      it('should fetch preferred slots for event', async () => {
        const mockSlots = [
          { id: 'slot-1', start_time_utc: '2024-12-26T14:00:00Z', end_time_utc: '2024-12-26T14:30:00Z' }
        ];
        const mockResponse = { data: { slots: mockSlots } };
        api.get.mockResolvedValue(mockResponse);

        const result = await preferredSlotsAPI.getByEvent(mockEvent.id);

        expect(api.get).toHaveBeenCalledWith(`/api/events/${mockEvent.id}/preferred-slots`);
        expect(result).toEqual(mockSlots);
      });

      it('should return empty array if no slots field', async () => {
        const mockResponse = { data: {} };
        api.get.mockResolvedValue(mockResponse);

        const result = await preferredSlotsAPI.getByEvent(mockEvent.id);

        expect(result).toEqual([]);
      });
    });

    describe('create', () => {
      it('should create a preferred slot', async () => {
        const slotData = {
          start_time_utc: '2024-12-26T14:00:00Z',
          end_time_utc: '2024-12-26T14:30:00Z'
        };
        const mockResponse = { data: { id: 'slot-1', ...slotData } };
        api.post.mockResolvedValue(mockResponse);

        const result = await preferredSlotsAPI.create(mockEvent.id, slotData);

        expect(api.post).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}/preferred-slots`,
          slotData
        );
        expect(result.id).toBe('slot-1');
      });
    });

    describe('delete', () => {
      it('should delete a preferred slot', async () => {
        const slotId = 'slot-1';
        const mockResponse = { data: { success: true } };
        api.delete.mockResolvedValue(mockResponse);

        const result = await preferredSlotsAPI.delete(mockEvent.id, slotId);

        expect(api.delete).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}/preferred-slots/${slotId}`
        );
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // BUSY SLOTS API TESTS
  // ============================================================================

  describe('busySlotsAPI', () => {
    describe('getMerged', () => {
      it('should fetch merged busy slots for event', async () => {
        const mockBusySlots = [
          { user_id: 'user-1', start_time_utc: '2024-12-26T09:00:00Z', end_time_utc: '2024-12-26T10:00:00Z' }
        ];
        const mockResponse = { data: mockBusySlots };
        api.get.mockResolvedValue(mockResponse);

        const result = await busySlotsAPI.getMerged(mockEvent.id);

        expect(api.get).toHaveBeenCalledWith(`/api/busy_slots/event/${mockEvent.id}/merged`);
        expect(result).toEqual(mockBusySlots);
      });
    });

    describe('syncCalendar', () => {
      it('should sync Google Calendar', async () => {
        const mockResponse = { data: { synced: true, events_count: 5 } };
        api.post.mockResolvedValue(mockResponse);

        const result = await busySlotsAPI.syncCalendar();

        expect(api.post).toHaveBeenCalledWith('/api/calendar/sync');
        expect(result.synced).toBe(true);
      });
    });

    describe('getConnectionStatus', () => {
      it('should check calendar connection status', async () => {
        const mockResponse = { data: { connected: true } };
        api.get.mockResolvedValue(mockResponse);

        const result = await busySlotsAPI.getConnectionStatus();

        expect(api.get).toHaveBeenCalledWith('/api/calendar/connection-status');
        expect(result.connected).toBe(true);
      });
    });
  });

  // ============================================================================
  // NOTIFICATIONS API TESTS
  // ============================================================================

  describe('notificationsAPI', () => {
    describe('getAll', () => {
      it('should fetch all notifications with default params', async () => {
        const mockNotifications = [{ id: 'notif-1', message: 'Test' }];
        const mockResponse = { data: mockNotifications };
        api.get.mockResolvedValue(mockResponse);

        const result = await notificationsAPI.getAll();

        expect(api.get).toHaveBeenCalledWith('/api/notifications?limit=50');
        expect(result).toEqual(mockNotifications);
      });

      it('should fetch unread notifications only', async () => {
        const mockResponse = { data: [] };
        api.get.mockResolvedValue(mockResponse);

        await notificationsAPI.getAll(true, 20);

        expect(api.get).toHaveBeenCalledWith('/api/notifications?unread_only=true&limit=20');
      });
    });

    describe('getUnreadCount', () => {
      it('should fetch unread count', async () => {
        const mockResponse = { data: { unread_count: 5 } };
        api.get.mockResolvedValue(mockResponse);

        const result = await notificationsAPI.getUnreadCount();

        expect(api.get).toHaveBeenCalledWith('/api/notifications/unread-count');
        expect(result).toBe(5);
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', async () => {
        const notifId = 'notif-1';
        const mockResponse = { data: { success: true } };
        api.post.mockResolvedValue(mockResponse);

        const result = await notificationsAPI.markAsRead(notifId);

        expect(api.post).toHaveBeenCalledWith(`/api/notifications/${notifId}/read`);
        expect(result.success).toBe(true);
      });
    });

    describe('handleAction', () => {
      it('should handle notification action', async () => {
        const notifId = 'notif-1';
        const action = 'accept';
        const mockResponse = { data: { status: 'accepted' } };
        api.post.mockResolvedValue(mockResponse);

        const result = await notificationsAPI.handleAction(notifId, action);

        expect(api.post).toHaveBeenCalledWith(
          `/api/notifications/${notifId}/action`,
          { action }
        );
        expect(result.status).toBe('accepted');
      });
    });
  });

  // ============================================================================
  // USERS API TESTS
  // ============================================================================

  describe('usersAPI', () => {
    describe('getProfile', () => {
      it('should fetch user profile', async () => {
        const mockResponse = { data: mockUser };
        api.get.mockResolvedValue(mockResponse);

        const result = await usersAPI.getProfile();

        expect(api.get).toHaveBeenCalledWith('/api/users/profile');
        expect(result).toEqual(mockUser);
      });
    });

    describe('updateProfile', () => {
      it('should update user profile', async () => {
        const updates = { full_name: 'Updated Name', timezone: 'Europe/London' };
        const mockResponse = { data: { ...mockUser, ...updates } };
        api.put.mockResolvedValue(mockResponse);

        const result = await usersAPI.updateProfile(updates);

        expect(api.put).toHaveBeenCalledWith('/api/users/profile', updates);
        expect(result.full_name).toBe(updates.full_name);
      });
    });

    describe('search', () => {
      it('should search users by email', async () => {
        const email = 'test@example.com';
        const mockResponse = { data: [mockUser] };
        api.get.mockResolvedValue(mockResponse);

        const result = await usersAPI.search(email);

        expect(api.get).toHaveBeenCalledWith(`/api/users/search?email=${encodeURIComponent(email)}`);
        expect(result).toEqual([mockUser]);
      });

      it('should handle special characters in email', async () => {
        const email = 'test+special@example.com';
        const mockResponse = { data: [] };
        api.get.mockResolvedValue(mockResponse);

        await usersAPI.search(email);

        expect(api.get).toHaveBeenCalledWith(`/api/users/search?email=${encodeURIComponent(email)}`);
      });
    });
  });

  // ============================================================================
  // DEFAULT EXPORT TEST
  // ============================================================================

  describe('default export', () => {
    it('should export all APIs as single object', () => {
      expect(apiService.events).toBe(eventsAPI);
      expect(apiService.preferredSlots).toBe(preferredSlotsAPI);
      expect(apiService.busySlots).toBe(busySlotsAPI);
      expect(apiService.notifications).toBe(notificationsAPI);
      expect(apiService.users).toBe(usersAPI);
    });
  });
});
