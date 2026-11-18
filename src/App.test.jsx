import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('renders the configuration and primary actions', () => {
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    expect(screen.getByText('ANTF Lighthorse 12-16-26')).toBeInTheDocument()
    expect(screen.getByText(/Load the public band Sheet or a CSV/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate Setlist/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Song Pool/ })).toHaveLength(2)
  })

  it('allows direct numeric entry and blocks generation while a setting is invalid', async () => {
    const user = userEvent.setup()
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    const targetLength = screen.getByLabelText(/Target Set Length/)

    await user.clear(targetLength)
    await user.type(targetLength, '91')
    expect(screen.getByRole('alert')).toHaveTextContent('20–90 whole minutes')
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Setlist/ })).toBeDisabled())

    await user.clear(targetLength)
    await user.type(targetLength, '90')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Setlist/ })).toBeEnabled())
  })

  it('opens mobile settings sections independently', async () => {
    const user = userEvent.setup()
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    const clustering = screen.getByRole('button', { name: /Clustering & Pool/ })
    const filters = screen.getByRole('button', { name: /Stage Sheet Filters/ })

    expect(clustering).toHaveAttribute('aria-expanded', 'false')
    expect(filters).toHaveAttribute('aria-expanded', 'false')
    await user.click(clustering)
    expect(clustering).toHaveAttribute('aria-expanded', 'true')
    expect(filters).toHaveAttribute('aria-expanded', 'false')
  })
})
