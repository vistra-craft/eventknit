import { render, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AuthProvider } from './contexts/AuthContext'
import type { ReactNode } from 'react'
import App from './App'

// Test wrapper component that provides AuthProvider
// Note: App already includes BrowserRouter and RoleViewProvider internally
const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('App', () => {
  it('renders without crashing', async () => {
    const { container } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    // Wait for React to finish rendering to avoid DOM access after teardown
    await waitFor(() => {
      expect(container).toBeInTheDocument()
    })
  })

  it('renders the main div', async () => {
    const { container } = render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    // Wait for React to finish rendering
    await waitFor(() => {
      const appDiv = container.querySelector('div')
      expect(appDiv).toBeInTheDocument()
    })
  })
})

