import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Since App is currently empty, we just check it renders
    expect(document.body).toBeInTheDocument()
  })

  it('renders the main div', () => {
    render(<App />)
    const appDiv = document.querySelector('div')
    expect(appDiv).toBeInTheDocument()
  })
})

