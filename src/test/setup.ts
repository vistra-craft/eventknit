import '@testing-library/jest-dom'

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

