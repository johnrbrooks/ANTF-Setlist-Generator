import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('renders the configuration and empty state', () => {
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    expect(screen.getByText('ANTF Lighthorse 12-16-26')).toBeInTheDocument()
    expect(screen.getByText(/Load the public band Sheet or a CSV/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate New Setlist/ })).toBeInTheDocument()
  })

  it('allows direct numeric entry and blocks generation while a setting is invalid', async () => {
    const user = userEvent.setup()
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    const targetLength = screen.getByLabelText(/Target Set Length/)
    const generate = screen.getByRole('button', { name: /Generate New Setlist/ })

    await user.clear(targetLength)
    await user.type(targetLength, '61')
    expect(screen.getByRole('alert')).toHaveTextContent('20–60 whole minutes')
    await waitFor(() => expect(generate).toBeDisabled())

    await user.clear(targetLength)
    await user.type(targetLength, '50')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await waitFor(() => expect(generate).toBeEnabled())
  })
})
