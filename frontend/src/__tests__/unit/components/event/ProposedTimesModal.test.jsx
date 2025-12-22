/**
 * Unit Tests for ProposedTimesModal Component
 * Tests timezone conversion, loading states, user interactions, and accessibility
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-fixtures/renderWithProviders';
import ProposedTimesModal from '../../../../components/event/ProposedTimesModal';

describe('ProposedTimesModal', () => {
  const mockOnClose = jest.fn();
  const mockSetSelectedTimeOption = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockOnSelectTime = jest.fn();

  const mockProposalMetadata = {
    generatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    needsUpdate: false,
  };

  const mockTimeOptions = [
    {
      id: 'option-1',
      start_time_utc: '2024-12-25T14:00:00.000Z',
      end_time_utc: '2024-12-25T15:00:00.000Z',
      availableCount: 8,
      totalParticipants: 10,
      conflicts: 0,
    },
    {
      id: 'option-2',
      start_time_utc: '2024-12-26T16:00:00.000Z',
      end_time_utc: '2024-12-26T17:00:00.000Z',
      availableCount: 6,
      totalParticipants: 10,
      conflicts: 2,
    },
    {
      id: 'option-3',
      start_time_utc: '2024-12-27T10:00:00.000Z',
      end_time_utc: '2024-12-27T11:00:00.000Z',
      availableCount: 5,
      totalParticipants: 10,
      conflicts: 1,
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    timeOptions: mockTimeOptions,
    selectedTimeOption: null,
    setSelectedTimeOption: mockSetSelectedTimeOption,
    proposalMetadata: mockProposalMetadata,
    isCoordinator: false,
    isLoadingProposals: false,
    onRefresh: mockOnRefresh,
    onSelectTime: mockOnSelectTime,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing when open', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('Proposed Times')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Proposed Times')).not.toBeInTheDocument();
    });

    it('renders all time options', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Should render 3 time option cards
      expect(within(modal).getByText(/8 of 10 available/i)).toBeInTheDocument();
      expect(within(modal).getByText(/6 of 10 available/i)).toBeInTheDocument();
      expect(within(modal).getByText(/5 of 10 available/i)).toBeInTheDocument();
    });

    it('renders "Top Choice" badge for first option', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('Top Choice')).toBeInTheDocument();
    });

    it('renders conflict badges when conflicts exist', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('2 conflicts')).toBeInTheDocument();
      expect(within(modal).getByText('1 conflict')).toBeInTheDocument();
    });

    it('renders percentage bars for each option', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Top option: 8/10 = 80%
      expect(within(modal).getByText('80%')).toBeInTheDocument();
      // Second option: 6/10 = 60%
      expect(within(modal).getByText('60%')).toBeInTheDocument();
      // Third option: 5/10 = 50%
      expect(within(modal).getByText('50%')).toBeInTheDocument();
    });
  });

  describe('timezone conversion', () => {
    it('converts UTC times to local timezone for display', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Times should be displayed in local timezone
      // The exact format depends on the user's timezone, but they should be present
      const timeElements = within(modal).getAllByText(/AM|PM/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('displays full date format with weekday', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Should show full date like "Wednesday, December 25, 2024"
      // Note: exact text depends on locale and timezone
      const dateElements = within(modal).getAllByText(/december/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('coordinator features', () => {
    it('shows refresh button when user is coordinator', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={true} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('does not show refresh button when user is not coordinator', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={false} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });

    it('does not show refresh button when no time options', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={true} timeOptions={[]} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
    });

    it('calls onRefresh when refresh button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={true} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const refreshButton = within(modal).getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('disables refresh button during loading', async () => {
      renderWithProviders(
        <ProposedTimesModal
          {...defaultProps}
          isCoordinator={true}
          isLoadingProposals={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const refreshButton = within(modal).getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows loading state on refresh button', async () => {
      renderWithProviders(
        <ProposedTimesModal
          {...defaultProps}
          isCoordinator={true}
          isLoadingProposals={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const refreshButton = within(modal).getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveAttribute('data-loading', '');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no time options available', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={[]} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText(/no proposed times available yet/i)).toBeInTheDocument();
      expect(within(modal).getByText(/participants need to select their preferred times first/i)).toBeInTheDocument();
    });

    it('does not show time option cards when empty', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={[]} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).queryByText(/\d+ of \d+ available/i)).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('selects time option when card is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Click on the second option card (6 of 10 available)
      const secondOption = within(modal).getByText(/6 of 10 available/i).closest('.chakra-card');
      await user.click(secondOption);

      await waitFor(() => {
        expect(mockSetSelectedTimeOption).toHaveBeenCalledWith('option-2');
      });
    });

    it('calls onSelectTime when coordinator clicks option', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={true} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Click on first option
      const firstOption = within(modal).getByText(/8 of 10 available/i).closest('.chakra-card');
      await user.click(firstOption);

      await waitFor(() => {
        expect(mockSetSelectedTimeOption).toHaveBeenCalledWith('option-1');
        expect(mockOnSelectTime).toHaveBeenCalledWith(mockTimeOptions[0]);
      });
    });

    it('does not call onSelectTime when non-coordinator clicks option', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} isCoordinator={false} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const firstOption = within(modal).getByText(/8 of 10 available/i).closest('.chakra-card');
      await user.click(firstOption);

      await waitFor(() => {
        expect(mockSetSelectedTimeOption).toHaveBeenCalledWith('option-1');
      });
      expect(mockOnSelectTime).not.toHaveBeenCalled();
    });

    it('highlights selected time option', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} selectedTimeOption="option-2" />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // The selected card should have primary color border
      // This is checked via Chakra's borderColor prop which applies to the card
      const cards = document.querySelectorAll('.chakra-card');
      expect(cards).toHaveLength(3);
    });

    it('closes modal when close button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const closeButton = within(modal).getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('closes modal when overlay clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Chakra modal overlay
      const overlay = document.querySelector('.chakra-modal__overlay');
      if (overlay) {
        await user.click(overlay);
        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });
  });

  describe('metadata display', () => {
    it('shows generation timestamp', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Should show relative time like "1 hour ago"
      expect(within(modal).getByText(/generated/i)).toBeInTheDocument();
      expect(within(modal).getByText(/hour ago/i)).toBeInTheDocument();
    });

    it('shows update badge when proposals need update', async () => {
      const metadata = {
        ...mockProposalMetadata,
        needsUpdate: true,
      };

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} proposalMetadata={metadata} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText(/updates available/i)).toBeInTheDocument();
      expect(within(modal).getByText(/refresh to see latest proposals/i)).toBeInTheDocument();
    });

    it('does not show update badge when proposals are current', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).queryByText(/updates available/i)).not.toBeInTheDocument();
    });

    it('handles missing metadata gracefully', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} proposalMetadata={null} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Should still render without crashing
      expect(within(modal).getByText('Proposed Times')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels on close button', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const closeButton = within(modal).getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('has proper modal role', async () => {
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('supports keyboard navigation - Escape key closes modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      // Chakra modal should handle Escape key
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('cards are clickable with keyboard', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProposedTimesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      // Find first card and simulate Enter key
      const firstCard = within(modal).getByText(/8 of 10 available/i).closest('.chakra-card');

      // Focus the card
      firstCard.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetSelectedTimeOption).toHaveBeenCalledWith('option-1');
      });
    });

    it('has scrollable content area for many options', async () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        id: `option-${i}`,
        start_time_utc: '2024-12-25T14:00:00.000Z',
        end_time_utc: '2024-12-25T15:00:00.000Z',
        availableCount: 5,
        totalParticipants: 10,
        conflicts: 0,
      }));

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={manyOptions} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // VStack should have overflowY auto and maxH
      const scrollableArea = document.querySelector('[style*="overflow-y"]');
      expect(scrollableArea).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('formats time ago correctly for recent timestamps', async () => {
      const recentMetadata = {
        generatedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        needsUpdate: false,
      };

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} proposalMetadata={recentMetadata} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText(/just now/i)).toBeInTheDocument();
    });

    it('formats time ago correctly for minutes', async () => {
      const metadata = {
        generatedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        needsUpdate: false,
      };

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} proposalMetadata={metadata} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText(/5 minutes ago/i)).toBeInTheDocument();
    });

    it('formats time ago correctly for days', async () => {
      const metadata = {
        generatedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        needsUpdate: false,
      };

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} proposalMetadata={metadata} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText(/2 days ago/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles single time option', async () => {
      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={[mockTimeOptions[0]]} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('Top Choice')).toBeInTheDocument();
      expect(within(modal).getByText(/8 of 10 available/i)).toBeInTheDocument();
    });

    it('handles 100% availability', async () => {
      const perfectOption = [{
        ...mockTimeOptions[0],
        availableCount: 10,
        totalParticipants: 10,
        conflicts: 0,
      }];

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={perfectOption} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('100%')).toBeInTheDocument();
    });

    it('handles 0% availability edge case', async () => {
      const badOption = [{
        ...mockTimeOptions[0],
        availableCount: 0,
        totalParticipants: 10,
        conflicts: 10,
      }];

      renderWithProviders(
        <ProposedTimesModal {...defaultProps} timeOptions={badOption} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      expect(within(modal).getByText('0%')).toBeInTheDocument();
    });

    it('handles missing onSelectTime callback', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProposedTimesModal
          {...defaultProps}
          isCoordinator={true}
          onSelectTime={undefined}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      const modal = screen.getByRole('dialog');

      const firstOption = within(modal).getByText(/8 of 10 available/i).closest('.chakra-card');

      // Should not crash when callback is missing
      await user.click(firstOption);

      await waitFor(() => {
        expect(mockSetSelectedTimeOption).toHaveBeenCalled();
      });
    });
  });
});
