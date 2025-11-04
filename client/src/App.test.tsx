import { render } from '@testing-library/react'
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
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    // Since App is currently empty, we just check it renders
    expect(document.body).toBeInTheDocument()
  })

  it('renders the main div', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    const appDiv = document.querySelector('div')
    expect(appDiv).toBeInTheDocument()
  })
})

