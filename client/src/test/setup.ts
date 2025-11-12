import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
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

// Cleanup after each test to prevent DOM access after teardown
afterEach(() => {
  cleanup()
})

