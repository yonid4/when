/**
 * Unit Tests for Event Service
 * Tests event CRUD operations and participant management
 */

import {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  addParticipant,
  updateParticipantStatus
} from '../../../services/eventService';
import api from '../../../services/api';
import { mockEvent, mockParticipants } from 'test-fixtures/mockData';

// Mock the api module
jest.mock('../../../services/api');

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create a new event successfully', async () => {
      const eventPayload = {
        name: 'Team Meeting',
        description: 'Weekly sync',
        duration_minutes: 30,
        earliest_date: '2024-12-25',
        latest_date: '2024-12-31',
        earliest_hour: '09:00:00',
        latest_hour: '17:00:00'
      };

      const mockResponse = {
        data: {
          ...mockEvent,
          ...eventPayload
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await createEvent(eventPayload);

      expect(api.post).toHaveBeenCalledWith('/api/events', eventPayload);
      expect(result).toEqual(mockResponse.data);
      expect(result.name).toBe(eventPayload.name);
      expect(result.id).toBeDefined();
      expect(result.uid).toBeDefined();
    });

    it('should handle validation errors when creating event', async () => {
      const invalidPayload = {
        name: '', // Invalid: empty name
        duration_minutes: -10 // Invalid: negative duration
      };

      const error = new Error('Validation failed');
      error.response = {
        status: 422,
        data: {
          error: 'Validation failed',
          details: {
            name: 'Name is required',
            duration_minutes: 'Duration must be greater than 0'
          }
        }
      };

      api.post.mockRejectedValue(error);

      await expect(createEvent(invalidPayload)).rejects.toThrow('Validation failed');
      expect(api.post).toHaveBeenCalledWith('/api/events', invalidPayload);
    });

    it('should handle network errors', async () => {
      const eventPayload = { name: 'Test Event' };
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';

      api.post.mockRejectedValue(networkError);

      await expect(createEvent(eventPayload)).rejects.toThrow('Network Error');
    });
  });

  describe('getEvent', () => {
    it('should fetch event by ID successfully', async () => {
      const mockResponse = { data: mockEvent };
      api.get.mockResolvedValue(mockResponse);

      const result = await getEvent(mockEvent.id);

      expect(api.get).toHaveBeenCalledWith(`/api/events/${mockEvent.id}`);
      expect(result).toEqual(mockEvent);
    });

    it('should fetch event by UID successfully', async () => {
      const mockResponse = { data: mockEvent };
      api.get.mockResolvedValue(mockResponse);

      const result = await getEvent(mockEvent.uid);

      expect(api.get).toHaveBeenCalledWith(`/api/events/${mockEvent.uid}`);
      expect(result).toEqual(mockEvent);
    });

    it('should handle 404 when event not found', async () => {
      const error = new Error('Not Found');
      error.response = {
        status: 404,
        data: { error: 'Event not found' }
      };

      api.get.mockRejectedValue(error);

      await expect(getEvent('nonexistent-id')).rejects.toThrow('Not Found');
      expect(api.get).toHaveBeenCalledWith('/api/events/nonexistent-id');
    });

    it('should handle unauthorized access', async () => {
      const error = new Error('Unauthorized');
      error.response = {
        status: 403,
        data: { error: 'Not authorized to view this event' }
      };

      api.get.mockRejectedValue(error);

      await expect(getEvent(mockEvent.id)).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const eventId = mockEvent.id;
      const updates = {
        name: 'Updated Event Name',
        description: 'Updated description'
      };

      const mockResponse = {
        data: {
          ...mockEvent,
          ...updates,
          updated_at: new Date().toISOString()
        }
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateEvent(eventId, updates);

      expect(api.put).toHaveBeenCalledWith(`/api/events/${eventId}`, updates);
      expect(result.name).toBe(updates.name);
      expect(result.description).toBe(updates.description);
    });

    it('should handle partial updates', async () => {
      const eventId = mockEvent.id;
      const updates = { duration_minutes: 60 };

      const mockResponse = {
        data: {
          ...mockEvent,
          duration_minutes: 60
        }
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateEvent(eventId, updates);

      expect(api.put).toHaveBeenCalledWith(`/api/events/${eventId}`, updates);
      expect(result.duration_minutes).toBe(60);
    });

    it('should handle validation errors on update', async () => {
      const error = new Error('Validation failed');
      error.response = {
        status: 422,
        data: {
          error: 'Validation failed',
          details: { earliest_date: 'Earliest date must be before latest date' }
        }
      };

      api.put.mockRejectedValue(error);

      const invalidUpdates = {
        earliest_date: '2024-12-31',
        latest_date: '2024-12-25' // Invalid: later than earliest
      };

      await expect(updateEvent(mockEvent.id, invalidUpdates)).rejects.toThrow('Validation failed');
    });

    it('should handle unauthorized update attempts', async () => {
      const error = new Error('Forbidden');
      error.response = {
        status: 403,
        data: { error: 'Only coordinator can update event' }
      };

      api.put.mockRejectedValue(error);

      await expect(updateEvent(mockEvent.id, { name: 'Hacked' })).rejects.toThrow('Forbidden');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Event deleted successfully'
        }
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await deleteEvent(mockEvent.id);

      expect(api.delete).toHaveBeenCalledWith(`/api/events/${mockEvent.id}`);
      expect(result.success).toBe(true);
    });

    it('should handle errors when deleting event', async () => {
      const error = new Error('Cannot delete finalized event');
      error.response = {
        status: 400,
        data: { error: 'Cannot delete finalized event' }
      };

      api.delete.mockRejectedValue(error);

      await expect(deleteEvent(mockEvent.id)).rejects.toThrow('Cannot delete finalized event');
    });

    it('should handle 404 when deleting non-existent event', async () => {
      const error = new Error('Not Found');
      error.response = {
        status: 404,
        data: { error: 'Event not found' }
      };

      api.delete.mockRejectedValue(error);

      await expect(deleteEvent('nonexistent-id')).rejects.toThrow('Not Found');
    });
  });

  describe('addParticipant', () => {
    it('should add participant to event successfully', async () => {
      const eventId = mockEvent.id;
      const userId = 'new-user-id';

      const mockResponse = {
        data: mockParticipants[0]
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await addParticipant(eventId, userId);

      expect(api.post).toHaveBeenCalledWith(
        `/api/events/${eventId}/participants`,
        { user_id: userId }
      );
      expect(result).toEqual(mockParticipants[0]);
    });

    it('should handle duplicate participant error', async () => {
      const error = new Error('Participant already exists');
      error.response = {
        status: 409,
        data: { error: 'User is already a participant' }
      };

      api.post.mockRejectedValue(error);

      await expect(addParticipant(mockEvent.id, 'user-123')).rejects.toThrow('Participant already exists');
    });

    it('should handle invalid user ID', async () => {
      const error = new Error('User not found');
      error.response = {
        status: 404,
        data: { error: 'User not found' }
      };

      api.post.mockRejectedValue(error);

      await expect(addParticipant(mockEvent.id, 'invalid-user')).rejects.toThrow('User not found');
    });
  });

  describe('updateParticipantStatus', () => {
    it('should update participant status to accepted', async () => {
      const eventId = mockEvent.id;
      const userId = mockParticipants[0].user_id;
      const status = 'accepted';

      const mockResponse = {
        data: {
          ...mockParticipants[0],
          status: 'accepted'
        }
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateParticipantStatus(eventId, userId, status);

      expect(api.put).toHaveBeenCalledWith(
        `/api/events/${eventId}/participants/${userId}`,
        { status }
      );
      expect(result.status).toBe('accepted');
    });

    it('should update participant status to declined', async () => {
      const eventId = mockEvent.id;
      const userId = mockParticipants[0].user_id;
      const status = 'declined';

      const mockResponse = {
        data: {
          ...mockParticipants[0],
          status: 'declined'
        }
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateParticipantStatus(eventId, userId, status);

      expect(result.status).toBe('declined');
    });

    it('should handle invalid status value', async () => {
      const error = new Error('Invalid status');
      error.response = {
        status: 422,
        data: {
          error: 'Validation failed',
          details: { status: 'Status must be one of: pending, accepted, declined' }
        }
      };

      api.put.mockRejectedValue(error);

      await expect(
        updateParticipantStatus(mockEvent.id, 'user-123', 'invalid-status')
      ).rejects.toThrow('Invalid status');
    });

    it('should handle participant not found', async () => {
      const error = new Error('Participant not found');
      error.response = {
        status: 404,
        data: { error: 'Participant not found in this event' }
      };

      api.put.mockRejectedValue(error);

      await expect(
        updateParticipantStatus(mockEvent.id, 'nonexistent-user', 'accepted')
      ).rejects.toThrow('Participant not found');
    });
  });

  // Edge cases and error scenarios
  describe('edge cases', () => {
    it('should handle empty response data', async () => {
      const mockResponse = { data: null };
      api.get.mockResolvedValue(mockResponse);

      const result = await getEvent(mockEvent.id);

      expect(result).toBeNull();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';

      api.get.mockRejectedValue(timeoutError);

      await expect(getEvent(mockEvent.id)).rejects.toThrow('Request timeout');
    });

    it('should handle server errors (500)', async () => {
      const error = new Error('Internal Server Error');
      error.response = {
        status: 500,
        data: { error: 'Internal Server Error' }
      };

      api.post.mockRejectedValue(error);

      await expect(createEvent({ name: 'Test' })).rejects.toThrow('Internal Server Error');
    });
  });
});
