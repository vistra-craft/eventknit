import { render, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import type { ReactNode } from 'react'
import App from './App'

// Test wrapper component that provides AuthProvider and ThemeProvider
// Note: App already includes BrowserRouter and RoleViewProvider internally
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('App', () => {
  afterEach(() => {
    // Cleanup after each test to ensure no async operations continue
    cleanup()
    // Give time for any pending async operations to complete
    return new Promise(resolve => setTimeout(resolve, 100))
  })

  it('renders without crashing', async () => {
    const { container, unmount } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    // Wait for React to finish rendering to avoid DOM access after teardown
    await waitFor(() => {
      expect(container).toBeInTheDocument()
    }, { timeout: 3000 })
    // Unmount to trigger cleanup
    unmount()
    // Wait a bit for async operations to settle
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  it('renders the main div', async () => {
    const { container, unmount } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    // Wait for React to finish rendering
    await waitFor(() => {
      const appDiv = container.querySelector('div')
      expect(appDiv).toBeInTheDocument()
    }, { timeout: 3000 })
    // Unmount to trigger cleanup
    unmount()
    // Wait a bit for async operations to settle
    await new Promise(resolve => setTimeout(resolve, 100))
  })
})

