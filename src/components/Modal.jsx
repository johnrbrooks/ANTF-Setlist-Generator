import { Box, Flex, Heading } from '@chakra-ui/react'
import AppButton from './AppButton'

export default function Modal({ open, title, onClose, children, fixedHeight = false, compact = false }) {
  if (!open) return null
  return (
    <Box position="fixed" inset="0" zIndex="50" bg="rgba(0,0,0,.75)" p={compact ? 4 : { base: 0, md: 5 }} display="flex" alignItems={compact ? 'center' : { base: 'stretch', md: 'center' }} justifyContent="center" role="dialog" aria-modal="true" aria-label={title}>
      <Box className="app-modal" bg="var(--surface)" border="1px solid var(--border)" borderRadius={compact ? '12px' : { base: 0, md: '12px' }} w="100%" maxW={compact ? '380px' : '720px'} h={compact ? 'auto' : fixedHeight ? { base: '100dvh', md: '82vh' } : 'auto'} maxH={compact ? '80dvh' : { base: '100dvh', md: '82vh' }} display="flex" flexDirection="column" overflow="hidden">
        <Flex p="14px 18px" borderBottom="1px solid var(--border)" align="center" justify="space-between" gap="3">
          <Heading as="h2" size="md">{title}</Heading>
          <AppButton size="sm" onClick={onClose}>✕ Close</AppButton>
        </Flex>
        <Box className="modal-scroll" flex="1" minH="0" p="4" overflowY="auto">{children}</Box>
      </Box>
    </Box>
  )
}
