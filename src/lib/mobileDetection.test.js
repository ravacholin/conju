import { isMobile, isTablet, isDesktop } from './mobileDetection.js';

// Mock window object for testing
const mockWindow = (width, userAgent) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
};

// Test cases
describe('Mobile Detection', () => {
  test('should detect mobile devices by screen size', () => {
    mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    expect(isMobile()).toBe(true);
  });

  test('should detect mobile devices by user agent', () => {
    mockWindow(1024, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
    expect(isMobile()).toBe(true);
  });

  test('should detect tablet devices', () => {
    mockWindow(768, 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)');
    expect(isTablet()).toBe(true);
  });

  test('should detect desktop devices', () => {
    mockWindow(1200, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    expect(isDesktop()).toBe(true);
  });
}); 