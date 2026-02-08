import { Box, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'

import { PublicationVolumeAccordion } from '../components/PublicationVolumeAccordion'
import { publicationsManifest, type PublicationVolume } from '../publications/manifest'
import { SERIES, type SeriesKey } from '../publications/series'

function volumeSortKey(v: PublicationVolume): number {
  const raw = v.volume || ''
  const m = raw.match(/\d+/)
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY
}

export function SeriesPage() {
  const [isMobile] = useMediaQuery('(max-width: 966px)')
  const params = useParams()
  const seriesKey = (params.series || '').toUpperCase() as SeriesKey
  const series = SERIES[seriesKey]

  if (!series) {
    return (
      <Box px={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-left)'} py={10}>
        <Text>Unbekannte Reihe.</Text>
      </Box>
    )
  }

  const volumes: PublicationVolume[] =
    seriesKey === 'PLURIPEN' ? [] : publicationsManifest.volumes.filter((v) => v.series === seriesKey).slice()
  volumes.sort((a, b) => {
    const n = volumeSortKey(a) - volumeSortKey(b)
    return n !== 0 ? n : a.id.localeCompare(b.id)
  })

  return (
    <Box>
      <Box
        backgroundImage={`linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${series.coverImage})`}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        minH={isMobile ? '220px' : '280px'}
        py={isMobile ? 6 : 10}
        display="flex"
        alignItems="center"
        sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.65)' }}
      >
        <Box
          marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
          marginRight={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-right)'}
          maxWidth="980px"
          px={isMobile ? 4 : 6}
          py={isMobile ? 4 : 6}
        >
          <Flex
            direction={isMobile ? 'column' : 'row'}
            align={isMobile ? 'flex-start' : 'baseline'}
            justify="space-between"
            marginTop={0}
            marginBottom={isMobile ? 2 : 3}
            gap={isMobile ? 1 : 6}
          >
            <Text fontSize={isMobile ? '34px' : '42px'} color="white" lineHeight="1.05" m={0}>
              {series.title}
            </Text>
            {!isMobile ? (
              <Text fontSize="42px" lineHeight="1.05" m={0} color="white">
                {series.shortName}
              </Text>
            ) : null}
          </Flex>

          <Text
            fontSize={isMobile ? '14px' : '16px'}
            maxWidth="900px"
            lineHeight="1.4"
            m={0}
            color="whiteAlpha.900"
          >
            {series.description}
          </Text>
        </Box>
      </Box>

      <Box borderBottom="1px solid black" pt={0} pb={6}>
        <PublicationVolumeAccordion volumes={volumes} />
      </Box>
    </Box>
  )
}

