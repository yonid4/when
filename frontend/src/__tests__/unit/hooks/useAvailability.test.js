/**
 * Unit Tests for useAvailability Hook
 * Tests fetching and updating user availability/busy slots
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAvailability } from '../../../hooks/useAvailability';
import { getUserBusySlots, addBusySlots } from '../../../services/busySlotsService';
import { mockBusySlots } from 'test-fixtures/mockData';

// Mock the busy slots service
jest.mock('../../../services/busySlotsService');

describe('useAvailability', () => {
  const mockEventId = 'event-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      // Hook starts loading immediately on mount
      expect(result.current.loading).toBe(true);

      // Wait for load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.submitSlots).toBeInstanceOf(Function);
    });

    it('should not fetch if eventId is missing', () => {
      const { result } = renderHook(() => useAvailability(null, mockUserId));

      expect(getUserBusySlots).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should not fetch if userId is missing', () => {
      const { result } = renderHook(() => useAvailability(mockEventId, null));

      expect(getUserBusySlots).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should not fetch if both eventId and userId are missing', () => {
      const { result } = renderHook(() => useAvailability(null, null));

      expect(getUserBusySlots).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('fetching busy slots', () => {
    it('should fetch busy slots on mount', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getUserBusySlots).toHaveBeenCalledWith(mockUserId, mockEventId);
      expect(result.current.busySlots).toEqual(mockBusySlots);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty busy slots response', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle null busy slots response', async () => {
      getUserBusySlots.mockResolvedValue(null);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toEqual([]);
    });

    it('should handle undefined busy slots response', async () => {
      getUserBusySlots.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toEqual([]);
    });

    it('should set error state on fetch failure', async () => {
      const error = new Error('Failed to load availability');
      getUserBusySlots.mockRejectedValue(error);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load availability');
      expect(result.current.busySlots).toEqual([]);
    });

    it('should handle error without message', async () => {
      getUserBusySlots.mockRejectedValue(new Error());

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load availability');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';
      getUserBusySlots.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network Error');
    });
  });

  describe('refetching on dependency changes', () => {
    it('should refetch when eventId changes', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { rerender } = renderHook(
        ({ eventId, userId }) => useAvailability(eventId, userId),
        { initialProps: { eventId: 'event-1', userId: mockUserId } }
      );

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledWith(mockUserId, 'event-1');
      });

      getUserBusySlots.mockClear();
      getUserBusySlots.mockResolvedValue([]);

      // Change eventId
      rerender({ eventId: 'event-2', userId: mockUserId });

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledWith(mockUserId, 'event-2');
      });
    });

    it('should refetch when userId changes', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { rerender } = renderHook(
        ({ eventId, userId }) => useAvailability(eventId, userId),
        { initialProps: { eventId: mockEventId, userId: 'user-1' } }
      );

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledWith('user-1', mockEventId);
      });

      getUserBusySlots.mockClear();
      getUserBusySlots.mockResolvedValue([]);

      // Change userId
      rerender({ eventId: mockEventId, userId: 'user-2' });

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledWith('user-2', mockEventId);
      });
    });

    it('should not refetch when neither dependency changes', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { rerender } = renderHook(
        ({ eventId, userId }) => useAvailability(eventId, userId),
        { initialProps: { eventId: mockEventId, userId: mockUserId } }
      );

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledTimes(1);
      });

      getUserBusySlots.mockClear();

      // Rerender without changing dependencies
      rerender({ eventId: mockEventId, userId: mockUserId });

      // Should not call getUserBusySlots again
      expect(getUserBusySlots).not.toHaveBeenCalled();
    });
  });

  describe('submitSlots', () => {
    it('should submit new busy slots and refresh data', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newSlots = [
        {
          start_time_utc: '2024-12-26T09:00:00Z',
          end_time_utc: '2024-12-26T10:00:00Z',
          event_title: 'Morning Meeting'
        }
      ];

      const updatedSlots = [...mockBusySlots, ...newSlots];

      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockResolvedValue(updatedSlots);

      await act(async () => {
        await result.current.submitSlots(newSlots);
      });

      expect(addBusySlots).toHaveBeenCalledWith(mockEventId, newSlots);
      expect(getUserBusySlots).toHaveBeenCalledWith(mockUserId, mockEventId);
      expect(result.current.busySlots).toEqual(updatedSlots);
    });

    it('should handle empty slots submission', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      await act(async () => {
        await result.current.submitSlots([]);
      });

      expect(addBusySlots).toHaveBeenCalledWith(mockEventId, []);
    });

    it('should throw error if submission fails', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to add busy slots');
      addBusySlots.mockRejectedValue(error);

      const newSlots = [{ start_time_utc: '2024-12-26T09:00:00Z', end_time_utc: '2024-12-26T10:00:00Z' }];

      await expect(
        act(async () => {
          await result.current.submitSlots(newSlots);
        })
      ).rejects.toThrow('Failed to add busy slots');
    });

    it('should handle refresh failure after successful submission', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newSlots = [{ start_time_utc: '2024-12-26T09:00:00Z', end_time_utc: '2024-12-26T10:00:00Z' }];

      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockRejectedValue(new Error('Refresh failed'));

      await expect(
        act(async () => {
          await result.current.submitSlots(newSlots);
        })
      ).rejects.toThrow('Refresh failed');

      // Submission should have been called even though refresh failed
      expect(addBusySlots).toHaveBeenCalledWith(mockEventId, newSlots);
    });

    it('should update busy slots with refreshed data after submission', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toEqual([]);

      const newSlots = [mockBusySlots[0]];
      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockResolvedValue(newSlots);

      await act(async () => {
        await result.current.submitSlots(newSlots);
      });

      expect(result.current.busySlots).toEqual(newSlots);
    });
  });

  describe('cleanup', () => {
    it('should not update state after unmount', async () => {
      getUserBusySlots.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockBusySlots), 1000))
      );

      const { result, unmount } = renderHook(() => useAvailability(mockEventId, mockUserId));

      expect(result.current.loading).toBe(true);

      // Unmount before promise resolves
      unmount();

      await waitFor(() => {
        // Should not throw or update state
        expect(getUserBusySlots).toHaveBeenCalled();
      });
    });

    it('should handle unmount during submission', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result, unmount } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockResolvedValue([mockBusySlots[0]]);

      let submitPromise;
      act(() => {
        submitPromise = result.current.submitSlots([mockBusySlots[0]]);
      });

      // Unmount during submission
      unmount();

      // Hook handles unmount gracefully - promise resolves normally
      // (the mounted flag prevents state updates but doesn't reject the promise)
      await submitPromise;

      // If we reach here, no error was thrown
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid parameter changes', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { rerender } = renderHook(
        ({ eventId, userId }) => useAvailability(eventId, userId),
        { initialProps: { eventId: 'event-1', userId: 'user-1' } }
      );

      // Wait for initial call
      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledTimes(1);
      });

      // Rapidly change parameters
      rerender({ eventId: 'event-2', userId: 'user-1' });
      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledTimes(2);
      });

      rerender({ eventId: 'event-3', userId: 'user-1' });
      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledTimes(3);
      });

      rerender({ eventId: 'event-4', userId: 'user-1' });
      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledTimes(4);
      });
    });

    it('should handle concurrent submissions', async () => {
      getUserBusySlots.mockResolvedValue([]);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      addBusySlots.mockResolvedValue({ success: true });
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const slot1 = [{ start_time_utc: '2024-12-26T09:00:00Z', end_time_utc: '2024-12-26T10:00:00Z' }];
      const slot2 = [{ start_time_utc: '2024-12-27T14:00:00Z', end_time_utc: '2024-12-27T15:00:00Z' }];

      // Submit multiple slots concurrently
      await act(async () => {
        await Promise.all([
          result.current.submitSlots(slot1),
          result.current.submitSlots(slot2)
        ]);
      });

      expect(addBusySlots).toHaveBeenCalledTimes(2);
      expect(getUserBusySlots).toHaveBeenCalledTimes(3); // Initial + 2 refreshes
    });

    it('should handle very large busy slots array', async () => {
      const largeBusySlots = Array.from({ length: 1000 }, (_, i) => ({
        id: `slot-${i}`,
        user_id: mockUserId,
        start_time_utc: `2024-12-${String((i % 28) + 1).padStart(2, '0')}T09:00:00Z`,
        end_time_utc: `2024-12-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`
      }));

      getUserBusySlots.mockResolvedValue(largeBusySlots);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.busySlots).toHaveLength(1000);
    });

    it('should handle special characters in eventId and userId', async () => {
      const specialEventId = 'event-with-special-chars-@#$%';
      const specialUserId = 'user-with-special-chars-!&*';

      getUserBusySlots.mockResolvedValue([]);

      renderHook(() => useAvailability(specialEventId, specialUserId));

      await waitFor(() => {
        expect(getUserBusySlots).toHaveBeenCalledWith(specialUserId, specialEventId);
      });
    });
  });

  describe('loading states', () => {
    it('should set loading to true during initial fetch', () => {
      getUserBusySlots.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after successful fetch', async () => {
      getUserBusySlots.mockResolvedValue(mockBusySlots);

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after failed fetch', async () => {
      getUserBusySlots.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useAvailability(mockEventId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
