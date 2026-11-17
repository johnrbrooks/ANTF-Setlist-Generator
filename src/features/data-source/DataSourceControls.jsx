import { Box, Flex, Text } from '@chakra-ui/react'
import AppButton from '../../components/AppButton'

export default function DataSourceControls({ sourceStatus, source, configured, onLoadGoogle, onRefresh, onCsvFile }) {
  return (
    <Box className="no-print" minW={{ base: '100%', lg: '390px' }}>
      <Flex align="center" justify={{ base: 'flex-start', lg: 'flex-end' }} gap="2" wrap="wrap">
        {!sourceStatus.googleLoaded ? (
          <AppButton tone="primary" size="sm" onClick={onLoadGoogle} disabled={!configured || sourceStatus.loading}>{sourceStatus.loading ? 'Loading…' : 'Load Google Sheet'}</AppButton>
        ) : (
          <AppButton size="sm" onClick={onRefresh} disabled={sourceStatus.loading}>{sourceStatus.loading ? 'Refreshing…' : '↻ Refresh Songs'}</AppButton>
        )}
        <Box className="file-button" as="label" cursor="pointer" borderRadius="8px" px="3" py="1.5" fontSize="sm" fontWeight="700">
          Load CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => { onCsvFile(event.target.files?.[0]); event.target.value = '' }} />
        </Box>
      </Flex>
      <Text mt="1.5" textAlign={{ base: 'left', lg: 'right' }} fontSize="xs" color={sourceStatus.error ? '#fca5a5' : 'var(--muted)'}>
        {sourceStatus.error || (!configured ? 'Public Google Sheet URL missing — CSV fallback is available.' : `Source: ${source.label}`)}
      </Text>
    </Box>
  )
}
