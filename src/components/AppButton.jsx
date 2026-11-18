import { Button } from '@chakra-ui/react'

const tones = {
  primary: {
    bg: 'linear-gradient(135deg, #a65bc8, #71338f)',
    color: '#ffffff',
    borderColor: '#b36bd5',
    hover: { bg: 'linear-gradient(135deg, #b36bd5, #8e45b0)', borderColor: '#d8b4e8', color: 'white' },
  },
  secondary: {
    bg: 'rgba(25, 20, 28, .9)',
    color: 'var(--text)',
    borderColor: 'var(--control-border)',
    hover: { bg: 'var(--surface-hover)', borderColor: 'var(--accent)', color: '#f5eafa' },
  },
  success: {
    bg: 'rgba(6, 78, 59, .7)',
    color: '#a7f3d0',
    borderColor: '#10b981',
    hover: { bg: '#065f46', borderColor: '#6ee7b7', color: 'white' },
  },
  danger: {
    bg: 'rgba(127, 29, 29, .68)',
    color: '#fecaca',
    borderColor: '#ef4444',
    hover: { bg: '#991b1b', borderColor: '#fca5a5', color: 'white' },
  },
  pool: {
    bg: 'rgba(113, 51, 143, .8)',
    color: '#f5eafa',
    borderColor: '#a65bc8',
    hover: { bg: '#8e45b0', borderColor: '#d8b4e8', color: 'white' },
  },
  export: {
    bg: 'rgba(25, 20, 28, .9)',
    color: 'var(--text)',
    borderColor: 'var(--control-border)',
    hover: { bg: 'var(--surface-hover)', borderColor: 'var(--accent)', color: 'white' },
  },
  print: {
    bg: 'rgba(25, 20, 28, .9)',
    color: 'var(--text)',
    borderColor: 'var(--control-border)',
    hover: { bg: 'var(--surface-hover)', borderColor: 'var(--accent)', color: 'white' },
  },
}

export default function AppButton({ tone = 'secondary', ...props }) {
  const style = tones[tone] ?? tones.secondary
  return (
    <Button
      bg={style.bg}
      color={style.color}
      border="1px solid"
      borderColor={style.borderColor}
      _hover={style.hover}
      _active={{ ...style.hover, transform: 'translateY(1px)', filter: 'brightness(.92)' }}
      _focusVisible={{ outline: '3px solid var(--accent)', outlineOffset: '2px' }}
      _disabled={{ opacity: 0.55, cursor: 'not-allowed', bg: '#17121a', color: '#a89bad', borderColor: '#50305c' }}
      transition="background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 80ms ease"
      {...props}
    />
  )
}
