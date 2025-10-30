// Test setup file for Vitest
// This file runs before all tests

// Note: Testing library packages need to be installed:
// npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8

// When testing libraries are installed, uncomment the following:
// import '@testing-library/jest-dom';
// import { afterAll, afterEach, beforeAll } from 'vitest';
// import { setupServer } from 'msw/node';
// import { handlers } from '@/mocks/handlers';

// Mock server setup for API testing
// const server = setupServer(...handlers);

// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Global test configuration
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
