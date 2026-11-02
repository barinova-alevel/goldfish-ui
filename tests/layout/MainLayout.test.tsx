import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../../src/auth/context'
import { MainLayout } from '../../src/components/layout/MainLayout'

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user' | 'logout'> => ({
    user: null,
    logout: vi.fn(),
  }),
}))

function renderLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<h2>Home content</h2>} />
          <Route path="operations" element={<h2>Operations content</h2>} />
          <Route path="operation-types" element={<h2>Types content</h2>} />
          <Route path="daily-report" element={<h2>Daily content</h2>} />
          <Route path="period-report" element={<h2>Period content</h2>} />
          <Route path="login" element={<h2>Login content</h2>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function drawer() {
  const navigation = document.getElementById('mobile-navigation')
  expect(navigation).not.toBeNull()
  return navigation as HTMLElement
}

describe('MainLayout mobile navigation', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  it('keeps the drawer closed until the menu button is used', () => {
    renderLayout()

    const menu = screen.getByRole('button', { name: 'Open navigation menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(drawer()).toHaveAttribute('aria-hidden', 'true')
    expect(drawer().querySelector('aside')).toHaveClass('-translate-x-full')
    expect(screen.getByRole('heading', { name: 'Home content' })).toBeInTheDocument()
  })

  it('opens the drawer with every navigation item and the active page highlighted', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(document.body.style.overflow).toBe('hidden')

    const links = within(drawer()).getAllByRole('link')
    expect(links.map((link) => link.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'SFMB',
      'Operations',
      'Operation Types',
      'Daily Report',
      'Period Report',
    ])
    expect(links[0]).toHaveClass('bg-brown/15')
    expect(within(drawer()).getByRole('navigation')).toHaveClass('overflow-y-auto')
  })

  it('closes the drawer from Escape, the overlay, the close button, and a selected page', async () => {
    const user = userEvent.setup()
    renderLayout()

    const menu = screen.getByRole('button', { name: 'Open navigation menu' })

    await user.click(menu)
    await user.keyboard('{Escape}')
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')

    await user.click(menu)
    await user.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    await user.click(menu)
    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    await user.click(menu)
    await user.click(within(drawer()).getByRole('link', { name: 'Operations' }))
    expect(await screen.findByRole('heading', { name: 'Operations content' })).toBeInTheDocument()
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(drawer().querySelector('aside')).toHaveClass('-translate-x-full')
  })
})
