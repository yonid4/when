# Frontend Testing Suite Creation Prompt for Claude Code

## Context
You are tasked with creating a comprehensive test suite for the "When" event coordination application frontend. This is a React 18 application with Chakra UI, real-time features, and complex state management.

## Project Structure
The frontend uses:
- **Framework**: React 18 with functional components and hooks
- **UI Library**: Chakra UI
- **Testing Framework**: Jest + React Testing Library (already in package.json)
- **State Management**: React Context + custom hooks
- **Real-time**: Supabase subscriptions
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Date/Time**: date-fns with timezone handling

## Current Test Organization
- Tests should be organized in `frontend/tests/` directory
- Use React Testing Library best practices
- Mock external dependencies (Supabase, API calls)

## Task: Create Comprehensive Test Suite

### 1. Test Structure Requirements

Create the following test directory structure:
```
frontend/tests/
├── setup.js                       # Test environment setup
├── __mocks__/                     # Manual mocks
│   ├── supabase.js               # Mock Supabase client
│   ├── axios.js                  # Mock axios
│   └── framer-motion.js          # Mock animations
├── unit/                         # Unit tests for individual components
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.test.jsx
│   │   │   ├── SignupForm.test.jsx
│   │   │   └── GoogleAuthButton.test.jsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.test.jsx
│   │   │   ├── FinalizationModal.test.jsx
│   │   │   ├── CoordinatorSlotPopup.test.jsx
│   │   │   └── ParticipantSlotPopup.test.jsx
│   │   ├── events/
│   │   │   ├── TimeSlotDisplay.test.jsx
│   │   │   ├── ProposedTimesModal.test.jsx
│   │   │   ├── InviteModal.test.jsx
│   │   │   ├── DeleteEventModal.test.jsx
│   │   │   └── EventCard.test.jsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.test.jsx
│   │   │   └── NotificationItem.test.jsx
│   │   └── common/
│   │       ├── Header.test.jsx
│   │       ├── Footer.test.jsx
│   │       └── LoadingSpinner.test.jsx
│   ├── hooks/
│   │   ├── useApiCall.test.js
│   │   ├── useAuth.test.js
│   │   ├── useCalendar.test.js
│   │   ├── useAvailability.test.js
│   │   └── useRealtime.test.js
│   ├── services/
│   │   ├── apiService.test.js
│   │   ├── eventService.test.js
│   │   ├── calendarService.test.js
│   │   ├── notificationsService.test.js
│   │   ├── preferredSlotsService.test.js
│   │   └── authService.test.js
│   └── utils/
│       ├── dateUtils.test.js
│       ├── timezoneUtils.test.js
│       └── validators.test.js
├── integration/                  # Integration tests
│   ├── EventCreationFlow.test.jsx
│   ├── InvitationFlow.test.jsx
│   ├── CalendarSyncFlow.test.jsx
│   ├── NotificationFlow.test.jsx
│   ├── EventFinalizationFlow.test.jsx
│   └── DashboardFlow.test.jsx
├── pages/                        # Page component tests
│   ├── Dashboard.test.jsx
│   ├── DashboardTemp.test.jsx
│   ├── EventPage.test.jsx
│   ├── EventTemp.test.jsx
│   ├── EventCreate.test.jsx
│   ├── Landing.test.jsx
│   └── LandingPage.test.jsx
└── fixtures/                     # Test data and helpers
    ├── mockData.js              # Consistent test data
    ├── mockApiResponses.js      # Mock API responses
    ├── testHelpers.js           # Reusable test utilities
    └── renderWithProviders.js   # Custom render function
```

### 2. Testing Setup Files

#### setup.js Should Include:
```javascript
// Jest DOM matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia
global.matchMedia = global.matchMedia || function() {
  return {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock scrollTo
global.scrollTo = jest.fn();

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

#### renderWithProviders.js Should Include:
```javascript
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';

export function renderWithProviders(ui, {
  initialRoute = '/',
  authValue = null,
  ...renderOptions
} = {}) {
  window.history.pushState({}, 'Test page', initialRoute);
  
  function Wrapper({ children }) {
    return (
      <ChakraProvider>
        <BrowserRouter>
          <AuthProvider value={authValue}>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    );
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
```

### 3. Testing Requirements for Each Component Type

#### Component Tests Should Cover:

**Rendering**:
- Component renders without crashing
- Correct initial state
- Props are applied correctly
- Conditional rendering based on props/state

**User Interactions**:
- Button clicks trigger correct handlers
- Form submissions work correctly
- Input changes update state
- Modal open/close behavior

**Accessibility**:
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

**Error States**:
- Loading states display correctly
- Error messages shown appropriately
- Empty states render properly

#### Hook Tests Should Cover:

**Custom Hooks**:
- Initial state is correct
- State updates work as expected
- Side effects execute properly
- Cleanup functions run
- Error handling works
- Dependencies trigger re-execution

#### Service Tests Should Cover:

**API Services**:
- API calls made with correct parameters
- Response data parsed correctly
- Errors handled appropriately
- Loading states managed
- Retry logic works
- Token management

#### Integration Tests Should Cover:

**Complete User Flows**:
1. **Event Creation Flow**:
   - Navigate to create event page
   - Fill out multi-step form
   - Submit and see success message
   - Redirect to event page

2. **Invitation Flow**:
   - Receive notification
   - Click to view invitation
   - Accept/decline RSVP
   - See updated event status

3. **Calendar Sync Flow**:
   - Click connect calendar button
   - OAuth flow simulation
   - Busy times fetched
   - Calendar displays updated data

### 4. Example Test Templates

#### Component Test:
```javascript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../fixtures/renderWithProviders';
import ProposedTimesModal from '../../src/components/events/ProposedTimesModal';
import { mockProposedTimes } from '../fixtures/mockData';

describe('ProposedTimesModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    eventId: 'test-event-123',
    proposedTimes: mockProposedTimes,
    isCoordinator: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with proposed times', () => {
    renderWithProviders(<ProposedTimesModal {...defaultProps} />);
    
    expect(screen.getByText('AI-Suggested Times')).toBeInTheDocument();
    expect(screen.getByText(/Monday, Dec 18/)).toBeInTheDocument();
  });

  it('displays times in user timezone', () => {
    renderWithProviders(<ProposedTimesModal {...defaultProps} />);
    
    // Times should be converted from UTC to local
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
  });

  it('shows refresh button only for coordinators', () => {
    const { rerender } = renderWithProviders(
      <ProposedTimesModal {...defaultProps} isCoordinator={false} />
    );
    
    expect(screen.queryByText('Refresh Proposals')).not.toBeInTheDocument();
    
    rerender(<ProposedTimesModal {...defaultProps} isCoordinator={true} />);
    
    expect(screen.getByText('Refresh Proposals')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProposedTimesModal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles loading state correctly', () => {
    renderWithProviders(
      <ProposedTimesModal {...defaultProps} proposedTimes={null} />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message when no times available', () => {
    renderWithProviders(
      <ProposedTimesModal {...defaultProps} proposedTimes={[]} />
    );
    
    expect(screen.getByText(/No available time slots/)).toBeInTheDocument();
  });
});
```

#### Hook Test:
```javascript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiCall } from '../../src/hooks/useApiCall';
import * as apiService from '../../src/services/apiService';

jest.mock('../../src/services/apiService');

describe('useApiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useApiCall());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('handles successful API call', async () => {
    const mockData = { id: '123', name: 'Test Event' };
    apiService.getEvent.mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useApiCall());
    
    await act(async () => {
      await result.current.execute(apiService.getEvent, '123');
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual(mockData);
  });

  it('handles API error correctly', async () => {
    const mockError = new Error('Network error');
    apiService.getEvent.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useApiCall());
    
    await act(async () => {
      await result.current.execute(apiService.getEvent, '123');
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });

  it('sets loading state during API call', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    apiService.getEvent.mockReturnValue(promise);
    
    const { result } = renderHook(() => useApiCall());
    
    act(() => {
      result.current.execute(apiService.getEvent, '123');
    });
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      resolvePromise({ id: '123' });
      await promise;
    });
    
    expect(result.current.loading).toBe(false);
  });
});
```

#### Integration Test:
```javascript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../fixtures/renderWithProviders';
import Dashboard from '../../src/pages/Dashboard';
import * as apiService from '../../src/services/apiService';
import { mockEvents, mockNotifications } from '../fixtures/mockData';

jest.mock('../../src/services/apiService');

describe('Dashboard Integration - Invitation Flow', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup initial API responses
    apiService.getEvents.mockResolvedValue(mockEvents);
    apiService.getNotifications.mockResolvedValue(mockNotifications);
  });

  it('completes full invitation acceptance flow', async () => {
    const user = userEvent.setup();
    
    // Mock navigation
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    // Render dashboard
    renderWithProviders(<Dashboard />, {
      authValue: { user: mockUser }
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    });
    
    // Find and click notification bell
    const notificationBell = screen.getByLabelText('Notifications');
    await user.click(notificationBell);
    
    // Notification menu should open
    expect(screen.getByText(/invited you to/)).toBeInTheDocument();
    
    // Click accept button
    const acceptButton = screen.getByText('Accept');
    apiService.acceptInvitation.mockResolvedValue({
      event_uid: 'event-123'
    });
    
    await user.click(acceptButton);
    
    // Should navigate to event page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/event/event-123');
    });
    
    // API should have been called correctly
    expect(apiService.acceptInvitation).toHaveBeenCalledWith(
      expect.any(String)
    );
  });

  it('handles invitation decline correctly', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Dashboard />, {
      authValue: { user: mockUser }
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    });
    
    await user.click(screen.getByLabelText('Notifications'));
    
    const declineButton = screen.getByText('Decline');
    apiService.declineInvitation.mockResolvedValue({ success: true });
    
    await user.click(declineButton);
    
    // Notification should be removed
    await waitFor(() => {
      expect(screen.queryByText(/invited you to/)).not.toBeInTheDocument();
    });
    
    // Should show success message
    expect(screen.getByText(/Invitation declined/)).toBeInTheDocument();
  });
});
```

### 5. Mock Data Structure

#### mockData.js Should Include:
```javascript
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  timezone: 'America/New_York'
};

export const mockEvent = {
  id: 'event-123',
  uid: 'abc123def456',
  title: 'Team Meeting',
  description: 'Weekly sync',
  start_time: '2024-12-20T10:00:00Z',
  end_time: '2024-12-20T11:00:00Z',
  coordinator_id: 'user-123',
  status: 'active',
  is_finalized: false,
  created_at: '2024-12-18T00:00:00Z'
};

export const mockProposedTimes = [
  {
    id: 'prop-1',
    event_id: 'event-123',
    start_time: '2024-12-20T14:00:00Z',
    end_time: '2024-12-20T15:00:00Z',
    score: 0.95,
    reasoning: 'All participants are available',
    created_at: '2024-12-18T00:00:00Z'
  },
  {
    id: 'prop-2',
    event_id: 'event-123',
    start_time: '2024-12-21T10:00:00Z',
    end_time: '2024-12-21T11:00:00Z',
    score: 0.87,
    reasoning: 'Most participants prefer mornings',
    created_at: '2024-12-18T00:00:00Z'
  }
];

// Add more mock data structures...
```

### 6. Testing Best Practices

1. **Use React Testing Library queries in order of preference**:
   - `getByRole` (most preferred)
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (least preferred)

2. **Test user behavior, not implementation details**:
   - Test what users see and do
   - Avoid testing component state directly
   - Test effects of interactions, not internal methods

3. **Use `waitFor` for async operations**:
   ```javascript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

4. **Clean up after tests**:
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
     cleanup();
   });
   ```

5. **Use `userEvent` instead of `fireEvent`**:
   ```javascript
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### 7. Coverage Goals

Aim for:
- **Overall**: 80%+ code coverage
- **Components**: 85%+ coverage
- **Hooks**: 90%+ coverage
- **Services**: 85%+ coverage
- **Utils**: 95%+ coverage
- **Pages**: 75%+ coverage (harder to test due to complexity)

### 8. Running Tests

Include test scripts in package.json:
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:ci": "CI=true react-scripts test --coverage",
    "test:debug": "react-scripts --inspect-brk test --runInBand --no-cache"
  }
}
```

Configure coverage thresholds in package.json:
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### 9. Priority Order

Create tests in this order:
1. **Setup files** (setup.js, renderWithProviders.js, mockData.js)
2. **Service tests** - API communication layer
3. **Hook tests** - Custom hooks
4. **Component tests** - UI components
5. **Integration tests** - Complete flows
6. **Page tests** - Full pages

### 10. Special Considerations

#### Real-time Features (Supabase subscriptions):
```javascript
// Mock Supabase subscription
const mockSubscription = {
  subscribe: jest.fn((callback) => {
    // Simulate real-time update
    setTimeout(() => callback({ new: mockData }), 100);
    return {
      unsubscribe: jest.fn()
    };
  })
};
```

#### Timezone Handling:
```javascript
// Mock user's timezone
beforeEach(() => {
  jest.spyOn(Intl, 'DateTimeFormat')
    .mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    }));
});
```

#### Router Testing:
```javascript
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Test with specific route
<MemoryRouter initialEntries={['/event/123']}>
  <Routes>
    <Route path="/event/:eventId" element={<EventPage />} />
  </Routes>
</MemoryRouter>
```

## Deliverables

1. Complete test directory structure
2. All test files with comprehensive test cases
3. Setup files and mock utilities
4. Mock data fixtures
5. README.md in tests/ directory
6. Coverage report showing 80%+ coverage

## Important Notes

- DO NOT test external libraries (Chakra UI, React Router)
- DO mock all API calls and external services
- DO test accessibility (ARIA, keyboard navigation)
- DO test error boundaries
- DO test loading and error states
- DO use semantic queries (getByRole, getByLabelText)
- DO test user interactions with userEvent
- DO write descriptive test names
- DO keep tests isolated and independent

## Questions to Clarify Before Starting

If you need clarification on:
1. Component behavior or expected outputs
2. API response structures
3. User flow details
4. Error handling requirements

Please ask before proceeding to ensure accurate tests.