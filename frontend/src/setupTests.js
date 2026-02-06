import "@testing-library/jest-dom";

const SUPPRESSED_ERRORS = [
  "Warning: ReactDOM.render",
  "Warning: useLayoutEffect",
  "Not implemented: HTMLFormElement.prototype.submit",
  "ReactDOMTestUtils.act is deprecated",
  "Warning: An update to",
  "Not wrapped in act",
  "Error sending invitations"
];

const SUPPRESSED_WARNINGS = [
  "Chakra",
  "componentWillReceiveProps",
  "React Router Future Flag Warning",
  "v7_startTransition",
  "v7_relativeSplatPath"
];

function shouldSuppressMessage(message, patterns) {
  return typeof message === "string" && patterns.some(pattern => message.includes(pattern));
}

function createMatchMediaMock() {
  return jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: createMatchMediaMock()
});

global.matchMedia = window.matchMedia;

global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
};

global.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
};

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (!shouldSuppressMessage(args[0], SUPPRESSED_ERRORS)) {
      originalError.call(console, ...args);
    }
  };

  console.warn = (...args) => {
    if (!shouldSuppressMessage(args[0], SUPPRESSED_WARNINGS)) {
      originalWarn.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
