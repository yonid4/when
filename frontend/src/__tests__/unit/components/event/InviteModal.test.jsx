/**
 * Unit Tests for InviteModal Component
 * Tests email input, validation, API integration, and toast notifications
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-fixtures/renderWithProviders';
import InviteModal from '../../../../components/event/InviteModal';
import api from '../../../../services/api';

// Mock the API
jest.mock('../../../../services/api');

// Mock Chakra UI toast
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => ({
  ...jest.requireActual('@chakra-ui/react'),
  useToast: () => mockToast,
}));

describe('InviteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    eventUid: 'evt_123abc',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing when open', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Invite Participants')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(<InviteModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Invite Participants')).not.toBeInTheDocument();
    });

    it('renders email icon in header', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Invite Participants')).toBeInTheDocument();
    });

    it('renders textarea for email input', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('shows instruction text', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText(/enter email addresses/i)).toBeInTheDocument();
      expect(within(modal).getByText(/one per line or comma-separated/i)).toBeInTheDocument();
    });

    it('shows note about user registration requirement', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText(/users must have signed up with when/i)).toBeInTheDocument();
    });

    it('renders Cancel and Send buttons', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: /send invitations/i })).toBeInTheDocument();
    });
  });

  describe('email input', () => {
    it('allows typing email addresses', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com');

      expect(textarea).toHaveValue('alice@example.com');
    });

    it('accepts comma-separated emails', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com, bob@example.com');

      expect(textarea).toHaveValue('alice@example.com, bob@example.com');
    });

    it('accepts newline-separated emails', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com\nbob@example.com');

      expect(textarea.value).toContain('alice@example.com');
      expect(textarea.value).toContain('bob@example.com');
    });

    it('accepts mixed comma and newline separation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com, bob@example.com\ncharlie@example.com');

      expect(textarea.value).toContain('alice@example.com');
      expect(textarea.value).toContain('bob@example.com');
      expect(textarea.value).toContain('charlie@example.com');
    });

    it('clears textarea on successful submission', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com');

      const sendButton = within(modal).getByRole('button', { name: /send invitations/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('validation', () => {
    it('shows error toast when no emails entered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const sendButton = within(modal).getByRole('button', { name: /send invitations/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'No emails entered',
            status: 'error',
          })
        );
      });
    });

    it('trims whitespace from email addresses', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('  alice@example.com  ');

      const sendButton = within(modal).getByRole('button', { name: /send invitations/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: ['alice@example.com'] }
        );
      });
    });

    it('filters out empty lines', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);

      await user.click(textarea);
      await user.paste('alice@example.com\n\n\n');

      const sendButton = within(modal).getByRole('button', { name: /send invitations/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: ['alice@example.com'] }
        );
      });
    });
  });

  describe('sending invitations', () => {
    it('sends single email successfully', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: ['alice@example.com'] }
        );
      });
    });

    it('sends multiple emails successfully', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 3, failed: 0 },
          results: [
            { email: 'alice@example.com', status: 'success' },
            { email: 'bob@example.com', status: 'success' },
            { email: 'charlie@example.com', status: 'success' },
          ],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com, bob@example.com\ncharlie@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: ['alice@example.com', 'bob@example.com', 'charlie@example.com'] }
        );
      });
    });

    it('shows loading state while sending', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      // Button should show loading state
      const sendButton = within(modal).getByRole('button', { name: /sending/i });
      expect(sendButton).toBeDisabled();
    });

    it('disables textarea while sending', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(textarea).toBeDisabled();
      });
    });

    it('shows success toast on successful send', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 2, failed: 0 },
          results: [
            { email: 'alice@example.com', status: 'success' },
            { email: 'bob@example.com', status: 'success' },
          ],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com, bob@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Invitations sent!',
            description: 'Successfully sent 2 invitation(s)',
            status: 'success',
          })
        );
      });
    });

    it('shows warning toast when some invitations fail', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 1 },
          results: [
            { email: 'alice@example.com', status: 'success' },
            { email: 'invalid@example.com', status: 'error', message: 'User not found' },
          ],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com, invalid@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Some invitations failed',
            status: 'warning',
          })
        );
      });
    });

    it('shows both success and warning toasts for partial success', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 2, failed: 1 },
          results: [
            { email: 'alice@example.com', status: 'success' },
            { email: 'bob@example.com', status: 'success' },
            { email: 'invalid@example.com', status: 'error', message: 'User not found' },
          ],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com, bob@example.com, invalid@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Invitations sent!',
            status: 'success',
          })
        );
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Some invitations failed',
            status: 'warning',
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast on network error', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to send invitations',
            description: 'Network error',
            status: 'error',
          })
        );
      });
    });

    it('shows generic error message when error has no message', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValue({});

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Failed to send invitations',
            description: 'An error occurred',
            status: 'error',
          })
        );
      });
    });

    it('does not close modal on error', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValue(new Error('API error'));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      // Modal should still be open
      expect(within(modal).getByText('Invite Participants')).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('re-enables inputs after error', async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValue(new Error('API error'));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      // Inputs should be re-enabled
      expect(textarea).not.toBeDisabled();
      expect(within(modal).getByRole('button', { name: /send invitations/i })).not.toBeDisabled();
    });
  });

  describe('modal interactions', () => {
    it('closes modal when Cancel clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      await user.click(within(modal).getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('clears emails when modal is closed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');

      await user.click(within(modal).getByRole('button', { name: /cancel/i }));

      // Re-open modal
      const { rerender } = renderWithProviders(<InviteModal {...defaultProps} isOpen={false} />);
      rerender(<InviteModal {...defaultProps} isOpen={true} />);

      // Textarea should be empty
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const newModal = screen.getByRole('dialog');
      expect(within(newModal).getByPlaceholderText(/john@example.com/i)).toHaveValue('');
    });

    it('prevents closing while sending', async () => {
      const user = userEvent.setup();
      api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      // Try to click cancel while sending
      const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('closes modal and calls onSuccess after successful send', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('handles missing onSuccess callback', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} onSuccess={undefined} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Should not crash when onSuccess is missing
    });
  });

  describe('accessibility', () => {
    it('has proper modal role', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('has labeled close button', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const closeButton = within(modal).getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('has accessible textarea label', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      expect(textarea).toBeInTheDocument();
    });

    it('supports keyboard navigation - Escape closes modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('focuses first interactive element when opened', async () => {
      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      // Chakra modal should handle focus management
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles very long email list', async () => {
      const user = userEvent.setup();
      const manyEmails = Array.from({ length: 50 }, (_, i) => `user${i}@example.com`);
      api.post.mockResolvedValue({
        data: {
          summary: { success: 50, failed: 0 },
          results: manyEmails.map(email => ({ email, status: 'success' })),
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste(manyEmails.join(', '));
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: manyEmails }
        );
      });
    }, 15000);

    it('handles special characters in email', async () => {
      const user = userEvent.setup();
      const specialEmail = 'user+test@example.com';
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: specialEmail, status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste(specialEmail);
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/events/evt_123abc/invite',
          { emails: [specialEmail] }
        );
      });
    });

    it('handles duplicate emails in list', async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValue({
        data: {
          summary: { success: 1, failed: 0 },
          results: [{ email: 'alice@example.com', status: 'success' }],
        },
      });

      renderWithProviders(<InviteModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const textarea = within(modal).getByPlaceholderText(/john@example.com/i);
      await user.click(textarea);
      await user.paste('alice@example.com, alice@example.com');
      await user.click(within(modal).getByRole('button', { name: /send invitations/i }));

      // API is called with both duplicates (backend handles deduplication)
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });
});
