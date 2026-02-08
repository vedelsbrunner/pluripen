import { Box, Flex, Link, Text, useMediaQuery } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

import { publicationsManifest } from '../publications/manifest'
import { routes } from '../routes'
import { SERIES, type SeriesKey } from '../publications/series'

export function PublicationsIndexPage() {
  const [isMobile] = useMediaQuery('(max-width: 966px)')

  return (
    <Box>
      <Text
        fontSize={isMobile ? '34px' : '42px'}
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
        marginTop={isMobile ? 8 : 10}
        marginBottom={isMobile ? 3 : 4}
        lineHeight="1.05"
      >
        Publikationen
      </Text>

      <Text
        fontSize={isMobile ? '14px' : '16px'}
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
        maxWidth="900px"
        paddingRight="40px"
        paddingBottom={isMobile ? 4 : 6}
        lineHeight="1.4"
      >
        Wählen Sie eine Reihe, um die verfügbaren Bände mit Cover, Abstract und Download-Links zu sehen.
      </Text>

      <Flex direction="column" borderTop="1px solid black" borderBottom="1px solid black">
        {Object.keys(SERIES).map((key) => {
          const series = SERIES[key as SeriesKey]
          const countVolumes =
            key === 'PLURIPEN' ? 0 : publicationsManifest.volumes.filter((v) => v.series === key).length
          const countDownloads =
            key === 'PLURIPEN'
              ? 0
              : publicationsManifest.volumes.filter((v) => v.series === key && Boolean(v.textPdf)).length
          const isLast = key === Object.keys(SERIES)[Object.keys(SERIES).length - 1]
          return (
            <Link
              key={key}
              as={RouterLink}
              to={routes.series(key)}
              color="black"
              _hover={{ textDecoration: 'none' }}
            >
              <Box
                backgroundImage={`linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22)), url(${series.coverImage})`}
                backgroundSize="cover"
                backgroundPosition="center"
                backgroundRepeat="no-repeat"
                minH={isMobile ? '180px' : '260px'}
                py={isMobile ? 5 : 7}
                px={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-left)'}
                borderBottom={isLast ? '0' : '1px solid black'}
                transition="filter 180ms ease, transform 180ms ease"
                _hover={{
                  filter: 'brightness(1.03)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.75)',
                }}
                sx={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.65)',
                }}
              >
                <Flex direction="column" justify="center" minH={isMobile ? '180px' : '260px'}>
                  <Text fontSize={isMobile ? '22px' : '32px'} m={0} lineHeight="1.15" color="white">
                    {series.title} ({series.shortName})
                  </Text>
                  <Text
                    fontSize={isMobile ? '15px' : '16px'}
                    color="whiteAlpha.900"
                    m={0}
                    mt={2}
                  >
                    {countVolumes} {countVolumes === 1 ? 'Band' : 'Bände'} · {countDownloads}{' '}
                    {countDownloads === 1 ? 'Download' : 'Downloads'}
                  </Text>
                  <Text fontSize={isMobile ? '14px' : '16px'} m={0} mt={3} maxWidth="900px" color="white">
                    {series.description}
                  </Text>
                </Flex>
              </Box>
            </Link>
          )
        })}
      </Flex>
    </Box>
  )
}

