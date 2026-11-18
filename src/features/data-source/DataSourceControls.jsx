import { Box, Flex, Text } from '@chakra-ui/react'
import AppButton from '../../components/AppButton'

const mobileActionWidth = { base: '100%', md: 'auto' }

export default function DataSourceControls({ sourceStatus, source, configured, poolSize, loadedCount, hasSetlist, onLoadGoogle, onRefresh, onCsvFile, onOpenPool, onDownload, onPrint }) {
  const sourceMessage = sourceStatus.error || (!configured ? 'Public Google Sheet URL missing — CSV fallback is available.' : `Source: ${source.label}`)
  return (
    <Box className="no-print" minW={{ base: '100%', lg: '390px' }} maxW={{ lg: '620px' }}>
      <Flex direction={{ base: 'column', md: 'row' }} align="center" justify={{ base: 'stretch', lg: 'flex-end' }} gap="2" wrap={{ md: 'wrap' }}>
        {!sourceStatus.googleLoaded ? (
          <AppButton w={mobileActionWidth} tone="primary" size="sm" onClick={onLoadGoogle} disabled={!configured || sourceStatus.loading}>{sourceStatus.loading ? 'Loading…' : 'Load Google Sheet'}</AppButton>
        ) : (
          <AppButton w={mobileActionWidth} tone="primary" size="sm" onClick={onRefresh} disabled={sourceStatus.loading}>{sourceStatus.loading ? 'Refreshing…' : '↻ Refresh Songs'}</AppButton>
        )}
        <AppButton as="label" role="button" tabIndex="0" w={mobileActionWidth} tone="secondary" size="sm" cursor="pointer" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.querySelector('input')?.click() } }}>
          Load CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => { onCsvFile(event.target.files?.[0]); event.target.value = '' }} />
        </AppButton>
        <AppButton w={mobileActionWidth} tone="pool" size="sm" onClick={onOpenPool}>📋 Song Pool ({poolSize})</AppButton>
        <AppButton w={mobileActionWidth} tone="export" size="sm" disabled={!hasSetlist} onClick={onDownload}>⬇ Download CSV</AppButton>
        <AppButton w={mobileActionWidth} tone="print" size="sm" disabled={!hasSetlist} onClick={onPrint}>🖨 Print Stage Sheet</AppButton>
      </Flex>
      <Flex mt="1.5" minW="0" align="center" justify={{ base: 'space-between', lg: 'flex-end' }} gap="2">
        <Text minW="0" textAlign={{ base: 'left', lg: 'right' }} fontSize="xs" color={sourceStatus.error ? '#fca5a5' : 'var(--muted)'} whiteSpace={{ base: 'nowrap', md: 'normal' }} overflow="hidden" textOverflow="ellipsis" title={sourceMessage}>
          {sourceMessage}
        </Text>
        {loadedCount > 0 && <Text className="ready-status" role="status" aria-live="polite" aria-label={`Ready, ${loadedCount} songs loaded`} flexShrink="0" px="2" py="0.5" borderRadius="999px" border="1px solid rgba(52,211,153,.42)" bg="rgba(6,78,59,.26)" color="#86efac" fontSize="xs" fontWeight="800" lineHeight="1.2"><Text as="span" aria-hidden="true" mr="1" color="#34d399">●</Text>Ready ({loadedCount})</Text>}
      </Flex>
    </Box>
  )
}
