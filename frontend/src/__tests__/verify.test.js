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
    // Check if matchMedia exists and is a function
    expect(window.matchMedia).toBeDefined();
    expect(typeof window.matchMedia).toBe('function');
  });

  it('should have IntersectionObserver mocked', () => {
    expect(window.IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeDefined();
    expect(typeof observer.observe).toBe('function');
  });
});
