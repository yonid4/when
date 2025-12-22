# Frontend Test Infrastructure Guide

## ✅ Setup Complete!

All test infrastructure files have been created and verified. The setup is working correctly.

---

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── setupTests.js                    # Jest setup (auto-loaded by CRA)
│   ├── __tests__/                       # Test files go here
│   │   └── verify.test.js              # ✅ Verification test (passing)
│   ├── test-fixtures/                   # → Symlink to ../tests/fixtures
│   └── test-mocks/                      # → Symlink to ../tests/__mocks__
│
└── tests/                               # Test utilities (source of truth)
    ├── setup.js                         # Same as src/setupTests.js
    ├── fixtures/                        # Test helpers
    │   ├── renderWithProviders.js      # Custom render with providers
    │   ├── mockData.js                 # Mock data matching backend API
    │   ├── mockApiResponses.js         # API response shapes
    │   └── testHelpers.js              # Utility functions
    └── __mocks__/                       # Mock implementations
        ├── supabase.js                 # Supabase client mock
        └── axios.js                    # Axios HTTP mock
```

---

## 🎯 How to Write Tests

### Location
**Important**: Tests must be in `src/` directory, NOT in `tests/` directory!

Create React App only finds tests in:
- `src/**/__tests__/**/*.{js,jsx}`
- `src/**/*.{test,spec}.{js,jsx}`

### Recommended Structure

```
src/
├── __tests__/                     # General tests
│   ├── verify.test.js
│   └── App.test.js
│
├── services/
│   ├── apiService.js
│   └── apiService.test.js        # Co-located with code
│
├── hooks/
│   ├── useApiCall.js
│   └── useApiCall.test.js        # Co-located with code
│
└── components/
    ├── EventCard/
    │   ├── EventCard.jsx
    │   └── EventCard.test.jsx    # Co-located with code
    └── ...
```

---

## 🧪 Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run all tests once (no watch)
npm test -- --watchAll=false

# Run specific test file
npm test -- src/services/apiService.test.js

# Run tests matching a pattern
npm test -- --testPathPattern=services

# Run with coverage
npm test -- --coverage --watchAll=false

# Run in verbose mode
npm test -- --verbose
```

---

## 📝 Example Tests

### Example 1: Service Test

```javascript
// src/services/apiService.test.js
import apiService from './apiService';
import axios from 'axios';

// Axios is auto-mocked from test-mocks/axios.js
jest.mock('axios');

describe('apiService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    axios.__reset();
  });

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      // Arrange
      const mockEvents = [
        { id: 'event-1', name: 'Meeting' },
        { id: 'event-2', name: 'Standup' },
      ];
      axios.__setMockResponse('GET', '/api/events', { data: mockEvents });

      // Act
      const result = await apiService.getEvents();

      // Assert
      expect(result).toEqual(mockEvents);
      expect(axios.get).toHaveBeenCalledWith('/api/events');
    });

    it('should handle errors', async () => {
      // Arrange
      axios.__setMockError('GET', '/api/events', 'Network error');

      // Act & Assert
      await expect(apiService.getEvents()).rejects.toThrow();
    });
  });
});
```

### Example 2: Hook Test

```javascript
// src/hooks/useApiCall.test.js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiCall } from './useApiCall';

describe('useApiCall', () => {
  it('should manage loading state correctly', async () => {
    const mockFn = jest.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
    );

    const { result } = renderHook(() => useApiCall());

    // Initially not loading
    expect(result.current.loading).toBe(false);

    // Start the call
    act(() => {
      result.current.execute(mockFn);
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    // Wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'test' });
  });
});
```

### Example 3: Component Test

```javascript
// src/components/EventCard/EventCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from 'test-fixtures/renderWithProviders';
import { mockEvent } from 'test-fixtures/mockData';
import EventCard from './EventCard';

describe('EventCard', () => {
  it('should render event details', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(mockEvent.name)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();
    render(<EventCard event={mockEvent} onDelete={handleDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith(mockEvent.id);
  });

  it('should render with auth context', () => {
    const { rerender } = render(<EventCard event={mockEvent} />, {
      initialAuthState: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token' },
      },
    });

    // Test component behavior with authenticated user
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
});
```

### Example 4: Using Mock Data

```javascript
// src/pages/EventList/EventList.test.jsx
import React from 'react';
import { render, screen, waitFor } from 'test-fixtures/renderWithProviders';
import { mockEvents, mockUser } from 'test-fixtures/mockData';
import { mockEventResponses } from 'test-fixtures/mockApiResponses';
import EventList from './EventList';
import axios from 'axios';

jest.mock('axios');

describe('EventList', () => {
  beforeEach(() => {
    axios.__reset();
  });

  it('should display list of events', async () => {
    axios.__setMockResponse(
      'GET',
      '/api/events',
      mockEventResponses.listSuccess(mockEvents)
    );

    render(<EventList />);

    await waitFor(() => {
      expect(screen.getByText(mockEvents[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockEvents[1].name)).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    axios.__setMockResponse(
      'GET',
      '/api/events',
      mockEventResponses.listError
    );

    render(<EventList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch events/i)).toBeInTheDocument();
    });
  });
});
```

---

## 🛠️ Test Utilities Reference

### From `test-fixtures/renderWithProviders.js`

```javascript
import { render, renderWithAuth, renderWithoutAuth } from 'test-fixtures/renderWithProviders';

// Render with all providers (Chakra, Router, Auth)
const { getByText } = render(<MyComponent />);

// Render with authenticated user
const { getByRole } = renderWithAuth(<MyComponent />, {
  user: { id: 'user-123', email: 'test@example.com' },
});

// Render without authentication
const { queryByText } = renderWithoutAuth(<MyComponent />);
```

### From `test-fixtures/testHelpers.js`

```javascript
import {
  waitForLoadingToFinish,
  waitForElement,
  createMockUser,
  createMockEvent,
  delay,
  mockConsoleError,
  getFormErrors,
} from 'test-fixtures/testHelpers';

// Wait for loading indicators to disappear
await waitForLoadingToFinish(container);

// Create mock data with overrides
const user = createMockUser({ email: 'custom@example.com' });
const event = createMockEvent({ name: 'Custom Event' });

// Suppress console errors in tests
const { restore } = mockConsoleError();
// ... test code that triggers errors
restore();

// Get form validation errors
const errors = getFormErrors(container);
expect(errors).toContain('Email is required');
```

### From `test-fixtures/mockData.js`

```javascript
import {
  mockUser,
  mockEvent,
  mockEvents,
  mockParticipants,
  mockProposedTimes,
  createMockUser,
  createMockEvent,
} from 'test-fixtures/mockData';

// Use predefined mocks
const user = mockUser;
const event = mockEvent;
const events = mockEvents;

// Create custom mocks
const customUser = createMockUser({ timezone: 'Europe/London' });
const customEvent = createMockEvent({ duration_minutes: 60 });
```

### From `test-mocks/axios.js`

```javascript
import axios from 'axios';

jest.mock('axios');

// Set successful response
axios.__setMockResponse('GET', '/api/events', { data: [...] });

// Set error response
axios.__setMockError('POST', '/api/events', 'Validation failed');

// Clear all mocks
axios.__clearMockResponses();
axios.__clearMockErrors();

// Full reset (clears responses, errors, and call history)
axios.__reset();
```

### From `test-mocks/supabase.js`

```javascript
import { createClient, mockSupabaseClient } from 'test-mocks/supabase';

jest.mock('@supabase/supabase-js', () => ({
  createClient: require('test-mocks/supabase').createClient,
}));

// Use the mock client
const supabase = createClient('url', 'key');

// Mock auth methods work out of the box
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'correct-password',
});
```

---

## 🎓 Best Practices

### 1. Test File Naming
- Use `.test.js` or `.test.jsx` suffix
- Name tests after the file they're testing: `EventCard.jsx` → `EventCard.test.jsx`

### 2. Test Organization
- Group related tests with `describe()` blocks
- Use clear, descriptive test names starting with "should"
- Follow Arrange-Act-Assert pattern

### 3. Mock Management
- Reset mocks in `beforeEach()` to ensure test isolation
- Use `axios.__reset()` to clear all axios mocks
- Don't mock what you're testing

### 4. Async Testing
- Use `waitFor()` for async operations
- Use `findBy*` queries which wait automatically
- Don't use arbitrary `setTimeout()` - use proper async utilities

### 5. Accessibility
- Use semantic queries: `getByRole()`, `getByLabelText()`
- Avoid `getByTestId()` unless necessary
- Test keyboard navigation and screen reader support

---

## ✅ Verification Checklist

- [x] `src/setupTests.js` exists and loads correctly
- [x] Verification test passes (4 tests)
- [x] jest-dom matchers available
- [x] Browser APIs mocked (IntersectionObserver, matchMedia, etc.)
- [x] Test fixtures accessible via symlinks
- [x] Mock implementations working
- [ ] Ready to write actual tests!

---

## 🚀 Next Steps

Now you're ready to create actual tests! Start with:

1. **Unit Tests for Services** - Test API calls, error handling
2. **Unit Tests for Hooks** - Test custom hooks in isolation
3. **Component Tests** - Test UI components and user interactions
4. **Integration Tests** - Test complete user flows

Refer to `frontend_testing_prompt.md` for detailed test scenarios.

---

## 📚 Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Chakra UI Testing](https://chakra-ui.com/getting-started/testing-library)
