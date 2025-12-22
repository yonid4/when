/**
 * Test Helper Utilities
 * Common utilities and helper functions for testing
 */

import { waitFor } from '@testing-library/react';
import { mockUser, mockEvent } from './mockData';

/**
 * Wait for loading spinner/indicator to disappear
 * @param {HTMLElement} container - Container to search in
 * @param {number} timeout - Max time to wait in ms
 */
export async function waitForLoadingToFinish(container = document.body, timeout = 3000) {
  await waitFor(
    () => {
      // Check for common loading indicators
      const loadingSpinner = container.querySelector('[data-testid="loading"]');
      const loadingText = container.querySelector('[aria-label="Loading"]');
      const spinner = container.querySelector('.chakra-spinner');

      if (loadingSpinner || loadingText || spinner) {
        throw new Error('Still loading');
      }
    },
    { timeout }
  );
}

/**
 * Wait for element to appear and become visible
 * @param {Function} queryFn - Query function from screen/container
 * @param {number} timeout - Max time to wait in ms
 */
export async function waitForElement(queryFn, timeout = 3000) {
  return await waitFor(() => {
    const element = queryFn();
    if (!element) {
      throw new Error('Element not found');
    }
    return element;
  }, { timeout });
}

/**
 * Mock console.error to suppress expected errors in tests
 * Returns a restore function to restore original console.error
 */
export function mockConsoleError() {
  const originalError = console.error;
  const mockError = jest.fn();

  console.error = mockError;

  return {
    restore: () => {
      console.error = originalError;
    },
    mockError,
  };
}

/**
 * Mock console.warn to suppress expected warnings in tests
 * Returns a restore function to restore original console.warn
 */
export function mockConsoleWarn() {
  const originalWarn = console.warn;
  const mockWarn = jest.fn();

  console.warn = mockWarn;

  return {
    restore: () => {
      console.warn = originalWarn;
    },
    mockWarn,
  };
}

/**
 * Create a mock user with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    ...mockUser,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

/**
 * Create a mock event with optional overrides
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock event object
 */
export function createMockEvent(overrides = {}) {
  return {
    ...mockEvent,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    uid: `evt_${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  };
}

/**
 * Create multiple mock events
 * @param {number} count - Number of events to create
 * @param {Object} baseOverrides - Base properties to apply to all events
 * @returns {Array} Array of mock events
 */
export function createMockEvents(count = 3, baseOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      ...baseOverrides,
      name: `${baseOverrides.name || 'Test Event'} ${i + 1}`,
    })
  );
}

/**
 * Simulate a delay (useful for testing loading states)
 * @param {number} ms - Milliseconds to delay
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock file for file upload testing
 * @param {string} name - File name
 * @param {number} size - File size in bytes
 * @param {string} type - MIME type
 */
export function createMockFile(name = 'test.pdf', size = 1024, type = 'application/pdf') {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/**
 * Mock window.matchMedia for responsive testing
 * @param {string} query - Media query to mock
 * @param {boolean} matches - Whether the query matches
 */
export function mockMatchMedia(query, matches = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((q) => ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store = {};

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
}

/**
 * Mock sessionStorage for testing
 */
export function mockSessionStorage() {
  return mockLocalStorage(); // Same implementation
}

/**
 * Simulate user typing with realistic delays
 * @param {HTMLElement} element - Input element
 * @param {string} text - Text to type
 * @param {Object} userEvent - userEvent from @testing-library/user-event
 */
export async function typeWithDelay(element, text, userEvent) {
  await userEvent.type(element, text, { delay: 10 });
}

/**
 * Get form validation errors from Chakra UI
 * @param {HTMLElement} container - Container to search in
 */
export function getFormErrors(container = document.body) {
  const errors = container.querySelectorAll('[role="alert"]');
  return Array.from(errors).map((error) => error.textContent);
}

/**
 * Check if an element is visible (not hidden by CSS)
 * @param {HTMLElement} element - Element to check
 */
export function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/**
 * Wait for API call to complete
 * Useful when testing components that make API calls on mount
 */
export async function waitForApiCall() {
  await waitFor(() => {}, { timeout: 100 });
}

/**
 * Flush all pending promises
 * Useful for ensuring all async operations complete
 */
export async function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create mock IntersectionObserver entries
 * @param {boolean} isIntersecting - Whether element is intersecting
 */
export function createMockIntersectionObserverEntry(isIntersecting = true) {
  return {
    isIntersecting,
    boundingClientRect: {},
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: {},
    rootBounds: {},
    target: {},
    time: Date.now(),
  };
}

/**
 * Mock Date.now() for consistent timestamps in tests
 * @param {number} timestamp - Timestamp to mock
 */
export function mockDateNow(timestamp) {
  const original = Date.now;
  Date.now = jest.fn(() => timestamp);

  return {
    restore: () => {
      Date.now = original;
    },
  };
}

/**
 * Create a mock timezone object for testing
 * @param {string} timezone - IANA timezone string
 */
export function mockTimezone(timezone = 'America/New_York') {
  const originalIntl = Intl.DateTimeFormat;

  Intl.DateTimeFormat = jest.fn(() => ({
    resolvedOptions: () => ({ timeZone: timezone }),
    format: originalIntl().format,
  }));

  return {
    restore: () => {
      Intl.DateTimeFormat = originalIntl;
    },
  };
}

export default {
  waitForLoadingToFinish,
  waitForElement,
  mockConsoleError,
  mockConsoleWarn,
  createMockUser,
  createMockEvent,
  createMockEvents,
  delay,
  createMockFile,
  mockMatchMedia,
  mockLocalStorage,
  mockSessionStorage,
  typeWithDelay,
  getFormErrors,
  isElementVisible,
  waitForApiCall,
  flushPromises,
  createMockIntersectionObserverEntry,
  mockDateNow,
  mockTimezone,
};
