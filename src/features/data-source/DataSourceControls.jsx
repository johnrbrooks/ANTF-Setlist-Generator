import { Box, Flex, Text } from '@chakra-ui/react'
import AppButton from '../../components/AppButton'

const mobileActionWidth = { base: '100%', md: 'auto' }

export default function DataSourceControls({ sourceStatus, source, configured, poolSize, hasSetlist, onLoadGoogle, onRefresh, onCsvFile, onOpenPool, onDownload, onPrint }) {
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
      <Text mt="1.5" textAlign={{ base: 'left', lg: 'right' }} fontSize="xs" color={sourceStatus.error ? '#fca5a5' : 'var(--muted)'} whiteSpace={{ base: 'nowrap', md: 'normal' }} overflow="hidden" textOverflow="ellipsis" title={sourceStatus.error || (!configured ? 'Public Google Sheet URL missing — CSV fallback is available.' : `Source: ${source.label}`)}>
        {sourceStatus.error || (!configured ? 'Public Google Sheet URL missing — CSV fallback is available.' : `Source: ${source.label}`)}
      </Text>
    </Box>
  )
}
