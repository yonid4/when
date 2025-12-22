/**
 * Custom render function with all required providers
 * Use this instead of RTL's render to include ChakraProvider, Router, and AuthContext
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Wrapper component with all providers
 */
function AllTheProviders({ children, initialAuthState = null }) {
  // Mock AuthContext Provider
  const MockAuthProvider = ({ children }) => {
    const mockAuthValue = initialAuthState || {
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    };

    // Create a simple context provider
    const AuthContext = React.createContext(mockAuthValue);
    return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>;
  };

  return (
    <ChakraProvider>
      <BrowserRouter>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

/**
 * Custom render function that wraps component with providers
 *
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.initialAuthState - Initial auth state for AuthContext
 * @param {Object} options.renderOptions - Additional options to pass to RTL's render
 * @returns {Object} RTL render result with rerender wrapped in providers
 */
function renderWithProviders(
  ui,
  {
    initialAuthState = null,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <AllTheProviders initialAuthState={initialAuthState}>
        {children}
      </AllTheProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Render with authenticated user
 */
export function renderWithAuth(ui, authState = {}, renderOptions = {}) {
  const defaultAuthState = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      full_name: 'Test User',
    },
    session: {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
    },
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    ...authState,
  };

  return renderWithProviders(ui, {
    initialAuthState: defaultAuthState,
    ...renderOptions,
  });
}

/**
 * Render without authentication (logged out)
 */
export function renderWithoutAuth(ui, renderOptions = {}) {
  return renderWithProviders(ui, {
    initialAuthState: {
      user: null,
      session: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
export { renderWithProviders };
export default renderWithProviders;
