import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock URL for jsdom environment
Object.defineProperty(window, 'URL', {
  value: URL,
  writable: true,
})

// Mock global for Node.js compatibility
if (typeof global === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any) = globalThis
}

// Fix for webidl-conversions issue in GitHub Actions
if (typeof process !== 'undefined') {
  process.env.NODE_OPTIONS = '--max-old-space-size=4096'
}

// Mock URL constructor for better compatibility
if (typeof window !== 'undefined') {
  // Ensure URL is available
  if (!window.URL) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).URL = URL
  }
}

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Cleanup after each test to prevent DOM access after teardown
afterEach(() => {
  cleanup()
})

