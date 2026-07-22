import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../components/ErrorBoundary'

const Bomber = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) throw new Error('test error')
  return <div>ok</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>hello</div></ErrorBoundary>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders fallback on error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Bomber shouldThrow /></ErrorBoundary>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('test error')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
