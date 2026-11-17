import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import App from './App'

describe('App', () => {
  it('renders the configuration and empty state', () => {
    render(<ChakraProvider value={defaultSystem}><App /></ChakraProvider>)
    expect(screen.getByText('ANTF Lighthorse 12-16-26')).toBeInTheDocument()
    expect(screen.getByText(/Connect the band Sheet or load a CSV/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate New Setlist/ })).toBeInTheDocument()
  })
})
