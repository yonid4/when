/**
 * Verification test to ensure Jest setup is working correctly
 */

describe('Test Setup Verification', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have jest-dom matchers available', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    expect(div).toHaveTextContent('Hello World');
  });

  it('should have window.matchMedia mocked', () => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    expect(mediaQuery).toBeDefined();
    expect(typeof mediaQuery.matches).toBe('boolean');
  });

  it('should have IntersectionObserver mocked', () => {
    expect(window.IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeDefined();
    expect(typeof observer.observe).toBe('function');
  });
});
