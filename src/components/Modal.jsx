import { Box, Button, Flex, Heading } from '@chakra-ui/react'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <Box position="fixed" inset="0" zIndex="50" bg="rgba(0,0,0,.75)" p={{ base: 0, md: 5 }} display="flex" alignItems={{ base: 'stretch', md: 'center' }} justifyContent="center" role="dialog" aria-modal="true" aria-label={title}>
      <Box bg="var(--surface)" border="1px solid var(--border)" borderRadius={{ base: 0, md: '12px' }} w="100%" maxW="720px" maxH={{ base: '100dvh', md: '82vh' }} display="flex" flexDirection="column" overflow="hidden">
        <Flex p="14px 18px" borderBottom="1px solid var(--border)" align="center" justify="space-between" gap="3">
          <Heading as="h2" size="md">{title}</Heading>
          <Button size="sm" variant="outline" borderColor="var(--border)" onClick={onClose}>✕ Close</Button>
        </Flex>
        <Box className="modal-scroll" p="4" overflowY="auto">{children}</Box>
      </Box>
    </Box>
  )
}
