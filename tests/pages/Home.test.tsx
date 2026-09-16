import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Home } from '../../src/pages/Home'

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/operations" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('renders the welcome heading and product copy', () => {
    renderHome()

    expect(
      screen.getByRole('heading', { name: 'Self Finance Manager' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Take control of your everyday finances/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Track your income and expenses/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/daily and period-based reports/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Built with: React, TypeScript, Tailwind CSS, and .NET Core REST API.'),
    ).toBeInTheDocument()
  })

  it('links to the operations page', () => {
    renderHome()

    expect(screen.getByTestId('home-operations-link')).toHaveAttribute(
      'href',
      '/operations',
    )
  })

  it('navigates to operations when the call to action is clicked', async () => {
    renderHome()

    await userEvent.click(screen.getByRole('link', { name: 'Go to Operations' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/operations')
    expect(
      screen.queryByRole('heading', { name: 'Self Finance Manager' }),
    ).not.toBeInTheDocument()
  })
})
