/**
 * Mock for @chakra-ui/utils/context
 * Provides the createContext functionality needed by Chakra UI components in tests
 */

export function createContext(options = {}) {
  const Context = require('react').createContext(options.defaultValue);

  return [
    ({ children, value }) => {
      const React = require('react');
      return React.createElement(Context.Provider, { value }, children);
    },
    () => {
      const React = require('react');
      return React.useContext(Context);
    },
    Context
  ];
}
