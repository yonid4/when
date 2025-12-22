/**
 * Unit Tests for Auth Service
 * Tests authentication operations including Google OAuth and logout
 */

import { getGoogleAuthUrl, logout, me } from '../../../services/authService';
import api from '../../../services/api';
import { supabase } from '../../../services/supabaseClient';
import { mockUser } from 'test-fixtures/mockData';

// Mock dependencies
jest.mock('../../../services/api');
jest.mock('../../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn()
    }
  }
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('should fetch Google OAuth URL successfully', async () => {
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/auth?client_id=...';
      const mockResponse = {
        data: {
          auth_url: mockAuthUrl
        }
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await getGoogleAuthUrl();

      expect(api.get).toHaveBeenCalledWith('/api/auth/google');
      expect(result).toEqual(mockResponse.data);
      expect(result.auth_url).toBe(mockAuthUrl);
    });

    it('should handle errors when fetching auth URL', async () => {
      const error = new Error('Google OAuth configuration error');
      error.response = {
        status: 500,
        data: { error: 'Failed to initialize Google OAuth' }
      };

      api.get.mockRejectedValue(error);

      await expect(getGoogleAuthUrl()).rejects.toThrow('Google OAuth configuration error');
      expect(api.get).toHaveBeenCalledWith('/api/auth/google');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';

      api.get.mockRejectedValue(networkError);

      await expect(getGoogleAuthUrl()).rejects.toThrow('Network Error');
    });
  });

  describe('logout', () => {
    it('should logout successfully from both backend and Supabase', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Logged out successfully'
        }
      };

      api.get.mockResolvedValue(mockResponse);
      supabase.auth.signOut.mockResolvedValue({ error: null });

      await logout();

      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should call Supabase signOut even if backend logout fails', async () => {
      const error = new Error('Backend logout failed');
      api.get.mockRejectedValue(error);
      supabase.auth.signOut.mockResolvedValue({ error: null });

      // logout will throw but should still call Supabase signOut in finally block
      await expect(logout()).rejects.toThrow('Backend logout failed');

      // Even though backend failed, Supabase signOut should still be called
      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle Supabase signOut errors gracefully', async () => {
      const mockResponse = { data: { success: true } };
      api.get.mockResolvedValue(mockResponse);

      const supabaseError = new Error('Supabase signOut failed');
      supabase.auth.signOut.mockRejectedValue(supabaseError);

      // Supabase error will propagate
      await expect(logout()).rejects.toThrow('Supabase signOut failed');

      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle both backend and Supabase failures', async () => {
      const backendError = new Error('Backend error');
      api.get.mockRejectedValue(backendError);

      const supabaseError = new Error('Supabase error');
      supabase.auth.signOut.mockRejectedValue(supabaseError);

      // Supabase error will be the final error thrown (from finally block)
      await expect(logout()).rejects.toThrow('Supabase error');

      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle timeout during logout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      api.get.mockRejectedValue(timeoutError);
      supabase.auth.signOut.mockResolvedValue({ error: null });

      // Timeout error will propagate
      await expect(logout()).rejects.toThrow('Request timeout');

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should fetch current user profile successfully', async () => {
      const mockResponse = {
        data: mockUser
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await me();

      expect(api.get).toHaveBeenCalledWith('/api/auth/me');
      expect(result).toEqual(mockUser);
      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should handle unauthorized access (401)', async () => {
      const error = new Error('Unauthorized');
      error.response = {
        status: 401,
        data: { error: 'Authentication required' }
      };

      api.get.mockRejectedValue(error);

      await expect(me()).rejects.toThrow('Unauthorized');
      expect(api.get).toHaveBeenCalledWith('/api/auth/me');
    });

    it('should handle expired session', async () => {
      const error = new Error('Session expired');
      error.response = {
        status: 401,
        data: { error: 'Session expired' }
      };

      api.get.mockRejectedValue(error);

      await expect(me()).rejects.toThrow('Session expired');
    });

    it('should handle network errors when fetching profile', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';

      api.get.mockRejectedValue(networkError);

      await expect(me()).rejects.toThrow('Network Error');
    });

    it('should handle server errors (500)', async () => {
      const error = new Error('Internal Server Error');
      error.response = {
        status: 500,
        data: { error: 'Internal Server Error' }
      };

      api.get.mockRejectedValue(error);

      await expect(me()).rejects.toThrow('Internal Server Error');
    });

    it('should return user with all expected fields', async () => {
      const completeUser = {
        ...mockUser,
        google_calendar_connected: true,
        timezone: 'America/New_York',
        avatar_url: 'https://example.com/avatar.jpg'
      };

      const mockResponse = { data: completeUser };
      api.get.mockResolvedValue(mockResponse);

      const result = await me();

      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.full_name).toBeDefined();
      expect(result.timezone).toBe('America/New_York');
      expect(result.google_calendar_connected).toBe(true);
    });
  });

  // Integration-style tests
  describe('authentication flow', () => {
    it('should complete full auth flow: get URL → login → fetch profile', async () => {
      // Step 1: Get auth URL
      const authUrl = 'https://accounts.google.com/o/oauth2/auth?...';
      api.get.mockResolvedValueOnce({ data: { auth_url: authUrl } });

      const urlResult = await getGoogleAuthUrl();
      expect(urlResult.auth_url).toBe(authUrl);

      // Step 2: After redirect, fetch user profile
      api.get.mockResolvedValueOnce({ data: mockUser });

      const userResult = await me();
      expect(userResult.id).toBeDefined();
      expect(userResult.email).toBe(mockUser.email);
    });

    it('should handle logout after successful authentication', async () => {
      // Get profile
      api.get.mockResolvedValueOnce({ data: mockUser });
      const user = await me();
      expect(user).toEqual(mockUser);

      // Logout
      api.get.mockResolvedValueOnce({ data: { success: true } });
      supabase.auth.signOut.mockResolvedValue({ error: null });

      await logout();

      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle empty response from me()', async () => {
      const mockResponse = { data: null };
      api.get.mockResolvedValue(mockResponse);

      const result = await me();

      expect(result).toBeNull();
    });

    it('should handle malformed auth URL response', async () => {
      const mockResponse = { data: {} }; // Missing auth_url
      api.get.mockResolvedValue(mockResponse);

      const result = await getGoogleAuthUrl();

      expect(result).toEqual({});
      expect(result.auth_url).toBeUndefined();
    });

    it('should handle concurrent logout requests', async () => {
      api.get.mockResolvedValue({ data: { success: true } });
      supabase.auth.signOut.mockResolvedValue({ error: null });

      // Call logout multiple times concurrently
      const logoutPromises = [logout(), logout(), logout()];

      await Promise.all(logoutPromises);

      // All should complete successfully
      expect(api.get).toHaveBeenCalledTimes(3);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(3);
    });
  });
});
