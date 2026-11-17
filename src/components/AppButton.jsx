import { Button } from '@chakra-ui/react'

const tones = {
  primary: {
    bg: 'var(--accent)',
    color: '#082f49',
    borderColor: 'var(--accent)',
    hover: { bg: 'var(--accent-hover)', borderColor: '#7dd3fc', color: 'white' },
  },
  secondary: {
    bg: 'rgba(15, 23, 42, .72)',
    color: 'var(--text)',
    borderColor: '#64748b',
    hover: { bg: 'var(--surface-hover)', borderColor: 'var(--accent)', color: '#e0f2fe' },
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
      _focusVisible={{ outline: '3px solid var(--accent)', outlineOffset: '2px' }}
      _disabled={{ opacity: 0.55, cursor: 'not-allowed', bg: '#1e293b', color: '#cbd5e1', borderColor: '#475569' }}
      {...props}
    />
  )
}
