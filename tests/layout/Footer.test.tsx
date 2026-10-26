import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from '../../src/components/layout/Footer'

describe('Footer', () => {
  it('shows the copyright line without the project links', () => {
    render(<Footer />)

    expect(
      screen.getByText(/© \d{4} Self Finance Manager\. Powered by React and \.NET Core/),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('blazor-ui-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('github-link')).not.toBeInTheDocument()
  })
})
