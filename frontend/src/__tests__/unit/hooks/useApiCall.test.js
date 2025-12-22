/**
 * Unit Tests for useApiCall Hook
 * Tests loading states, error handling, success callbacks, and toast notifications
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Chakra UI BEFORE importing the hook
const mockToast = jest.fn();

jest.mock('@chakra-ui/react', () => ({
  ChakraProvider: ({ children }) => <div>{children}</div>,
  useToast: () => mockToast
}));

// Import after mocking
import { useApiCall } from '../../../hooks/useApiCall';

describe('useApiCall', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockToast.mockClear();
  });

  // Wrapper component (not needed but kept for consistency)
  const wrapper = ({ children }) => <div>{children}</div>;

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.execute).toBeInstanceOf(Function);
      expect(result.current.clearError).toBeInstanceOf(Function);
    });
  });

  describe('execute - successful API calls', () => {
    it('should handle successful API call', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ data: 'success' }));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute(mockApiFunction);
      });

      expect(mockApiFunction).toHaveBeenCalled();
      expect(returnValue).toEqual({ data: 'success' });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to true during API call', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const mockApiFunction = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
      );

      let executePromise;
      act(() => {
        executePromise = result.current.execute(mockApiFunction);
      });

      // Should be loading immediately after execute is called
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await executePromise;
      });

      // Should not be loading after completion
      expect(result.current.loading).toBe(false);
    });

    it('should show success toast when successMessage is provided', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ id: '123' }));

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          successMessage: 'Operation completed successfully'
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Operation completed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    });

    it('should not show success toast when showSuccessToast is false', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ id: '123' }));

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          successMessage: 'Success',
          showSuccessToast: false
        });
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback with result', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ id: '123', name: 'Test' }));
      const onSuccess = jest.fn();

      await act(async () => {
        await result.current.execute(mockApiFunction, { onSuccess });
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: '123', name: 'Test' });
    });

    it('should return result from API function', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const expectedResult = { id: '456', data: 'test data' };
      const mockApiFunction = jest.fn(() => Promise.resolve(expectedResult));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute(mockApiFunction);
      });

      expect(returnValue).toEqual(expectedResult);
    });
  });

  describe('execute - error handling', () => {
    it('should handle API errors and set error state', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      // Hook uses err.message when no response.data.message/error exists
      expect(result.current.error).toBe('API error');
      expect(result.current.loading).toBe(false);
    });

    it('should extract error message from response.data.message', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Request failed');
      error.response = {
        data: { message: 'Validation failed: Name is required' }
      };
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.error).toBe('Validation failed: Name is required');
    });

    it('should extract error message from response.data.error', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Request failed');
      error.response = {
        data: { error: 'Unauthorized access' }
      };
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.error).toBe('Unauthorized access');
    });

    it('should use error.message as fallback', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Network timeout');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.error).toBe('Network timeout');
    });

    it('should use custom errorMessage when provided', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      // Create error without message to test fallback
      const error = new Error();
      error.message = ''; // Empty message so it falls back to errorMessage
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          errorMessage: 'Failed to load data'
        });
      });

      // When error has no message, hook uses the custom errorMessage
      expect(result.current.error).toBe('Failed to load data');
    });

    it('should show error toast by default', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      error.response = { data: { message: 'Something went wrong' } };
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    });

    it('should not show error toast when showErrorToast is false', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          showErrorToast: false
        });
      });

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));
      const onError = jest.fn();

      await act(async () => {
        await result.current.execute(mockApiFunction, { onError });
      });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should return null on error', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute(mockApiFunction);
      });

      expect(returnValue).toBeNull();
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Test error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('API call error:', error);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('API error');
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      // Trigger an error
      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should not affect loading state when clearing error', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('multiple sequential calls', () => {
    it('should handle multiple sequential API calls', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const mockApiFunction1 = jest.fn(() => Promise.resolve({ id: 1 }));
      const mockApiFunction2 = jest.fn(() => Promise.resolve({ id: 2 }));

      let result1, result2;

      await act(async () => {
        result1 = await result.current.execute(mockApiFunction1);
      });

      await act(async () => {
        result2 = await result.current.execute(mockApiFunction2);
      });

      expect(result1).toEqual({ id: 1 });
      expect(result2).toEqual({ id: 2 });
      expect(result.current.loading).toBe(false);
    });

    it('should clear previous errors on new call', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });

      const errorFunction = jest.fn(() => Promise.reject(new Error('Error 1')));
      const successFunction = jest.fn(() => Promise.resolve({ data: 'success' }));

      // First call fails
      await act(async () => {
        await result.current.execute(errorFunction, { showErrorToast: false });
      });

      expect(result.current.error).not.toBeNull();

      // Second call succeeds
      await act(async () => {
        await result.current.execute(successFunction);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle success with both toast and callback', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ id: '123' }));
      const onSuccess = jest.fn();

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          successMessage: 'Created successfully',
          onSuccess
        });
      });

      expect(mockToast).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith({ id: '123' });
    });

    it('should handle error with both toast and callback', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Failed');
      const mockApiFunction = jest.fn(() => Promise.reject(error));
      const onError = jest.fn();

      await act(async () => {
        await result.current.execute(mockApiFunction, {
          errorMessage: 'Operation failed',
          onError
        });
      });

      expect(mockToast).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors with detailed messages', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const error = new Error('Validation failed');
      error.response = {
        status: 422,
        data: {
          message: 'Validation failed',
          details: {
            email: 'Invalid email format',
            password: 'Password too short'
          }
        }
      };
      const mockApiFunction = jest.fn(() => Promise.reject(error));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.error).toBe('Validation failed');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Validation failed',
          status: 'error'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle API function that returns undefined', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve(undefined));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute(mockApiFunction);
      });

      expect(returnValue).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle API function that returns null', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve(null));

      let returnValue;
      await act(async () => {
        returnValue = await result.current.execute(mockApiFunction);
      });

      expect(returnValue).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle very fast API calls', async () => {
      const { result } = renderHook(() => useApiCall(), { wrapper });
      const mockApiFunction = jest.fn(() => Promise.resolve({ fast: true }));

      await act(async () => {
        await result.current.execute(mockApiFunction);
      });

      expect(result.current.loading).toBe(false);
      expect(mockApiFunction).toHaveBeenCalled();
    });
  });
});
