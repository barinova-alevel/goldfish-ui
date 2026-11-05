import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../../src/auth/context'
import { blazorUiUrl, githubUrl } from '../../src/auth/demoUser'
import { Header } from '../../src/components/layout/Header'

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user' | 'logout'> => ({
    user: null,
    logout: vi.fn(),
  }),
}))

describe('Header', () => {
  it('shows the Blazor and GitHub links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )

    const blazor = screen.getByTestId('blazor-ui-link')
    expect(blazor).toHaveTextContent('View Blazor UI')
    expect(blazor).toHaveAttribute('href', blazorUiUrl)
    expect(blazor).toHaveAttribute('target', '_blank')
    expect(blazor).toHaveClass('bg-transparent', 'border-brown', 'max-lg:underline!')

    const github = screen.getByTestId('github-link')
    expect(github).toHaveTextContent('View on GitHub')
    expect(github).toHaveAttribute('href', githubUrl)
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveClass('bg-transparent', 'border-brown', 'max-lg:underline!')

    const title = screen.getByRole('heading', { name: 'Self Finance Manager' })
    const login = screen.getByRole('link', { name: 'Login' })
    expect(login).toHaveClass('bg-brown', 'max-lg:underline!', 'max-lg:bg-transparent!')
    expect(title.compareDocumentPosition(blazor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(blazor.compareDocumentPosition(github) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(github.compareDocumentPosition(login) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
