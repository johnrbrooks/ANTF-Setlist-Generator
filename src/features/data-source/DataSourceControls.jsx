import { Box, Button, Flex, Text } from '@chakra-ui/react'

export default function DataSourceControls({ authStatus, source, configured, onConnect, onRefresh, onDisconnect, onCsvFile }) {
  return (
    <Box className="no-print" minW={{ base: '100%', lg: '390px' }}>
      <Flex align="center" justify={{ base: 'flex-start', lg: 'flex-end' }} gap="2" wrap="wrap">
        {!authStatus.connected ? (
          <Button size="sm" bg="var(--accent)" color="var(--bg)" _hover={{ bg: 'var(--accent-hover)', color: 'white' }} onClick={onConnect} disabled={!configured || authStatus.loading}>{authStatus.loading ? 'Connecting…' : 'Connect Google Sheet'}</Button>
        ) : (
          <><Button size="sm" variant="outline" borderColor="var(--border)" onClick={onRefresh} disabled={authStatus.loading}>{authStatus.loading ? 'Refreshing…' : '↻ Refresh Songs'}</Button><Button size="sm" variant="ghost" color="var(--muted)" onClick={onDisconnect}>Disconnect</Button></>
        )}
        <Box as="label" cursor="pointer" border="1px solid var(--border)" borderRadius="8px" px="3" py="1.5" fontSize="sm" fontWeight="700" _hover={{ borderColor: 'var(--accent)' }}>
          Load CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => { onCsvFile(event.target.files?.[0]); event.target.value = '' }} />
        </Box>
      </Flex>
      <Text mt="1.5" textAlign={{ base: 'left', lg: 'right' }} fontSize="xs" color={authStatus.error ? '#fca5a5' : 'var(--muted)'}>
        {authStatus.error || (!configured ? 'Google configuration missing — CSV fallback is available.' : `Source: ${source.label}`)}
      </Text>
    </Box>
  )
}
