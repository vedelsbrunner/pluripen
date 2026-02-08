import { Box, Flex, Link, Text, useMediaQuery } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

import { routes } from '../routes'
import { publicationsManifest } from '../publications/manifest'
import { SERIES, type SeriesKey } from '../publications/series'

export function HomePage() {
  const [isMobile] = useMediaQuery('(max-width: 966px)')

  return (
    <Box>

      <Text
        fontSize={isMobile ? 'var(--page-title-size-mobile)' : 'var(--page-title-size)'}
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
      >
        PLURIPEN
      </Text>

        <Text
            fontSize={isMobile ? '15px' : '18px'}
            marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
            marginRight={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-right)'}
            lineHeight="1.4"
        >
            PLURIPEN ist ein Online-Open-Access-Verlag in Kooperation mit der Akademie Graz.{' '}
            <Link as={RouterLink} to={routes.publications} color="var(--romani-blue)" _hover={{ textDecoration: 'none' }}>
                Zu den Publikationen
            </Link>
        </Text>

      {/* Simple vertical series list (natural scroll down) */}
      <Flex direction="column" borderTop="1px solid black" borderBottom="1px solid black" mt={6}>
        {(['GLM', 'GPS', 'GPT', 'GRP', 'PLURIPEN'] as SeriesKey[]).map((key) => {
          const series = SERIES[key]
          const isLast = key === 'PLURIPEN'
          const countVolumes = key === 'PLURIPEN' ? 0 : publicationsManifest.volumes.filter((v) => v.series === key).length
          const countDownloads =
            key === 'PLURIPEN'
              ? 0
              : publicationsManifest.volumes.filter((v) => v.series === key && Boolean(v.textPdf)).length
          return (
            <Link
              key={key}
              as={RouterLink}
              to={routes.series(key)}
              _hover={{ textDecoration: 'none' }}
            >
              <Box
                backgroundImage={`linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.16)), url(${series.coverImage})`}
                backgroundSize="cover"
                backgroundPosition="center"
                backgroundRepeat="no-repeat"
                minH={isMobile ? '180px' : '260px'}
                px={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-left)'}
                borderBottom={isLast ? '0' : '1px solid black'}
                transition="filter 180ms ease, transform 180ms ease"
                _hover={{
                  filter: 'brightness(1.03)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.75)',
                }}
                sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.65)' }}
              >
                <Flex direction="column" justify="center" minH={isMobile ? '180px' : '260px'}>
                  <Text fontSize={isMobile ? '22px' : '32px'} m={0} lineHeight="1.15" color="white">
                    {series.title} ({series.shortName})
                  </Text>
                  <Text fontSize={isMobile ? '15px' : '16px'} color="whiteAlpha.900" m={0} mt={2}>
                    {countVolumes} {countVolumes === 1 ? 'Band' : 'Bände'} · {countDownloads}{' '}
                    {countDownloads === 1 ? 'Download' : 'Downloads'}
                  </Text>
                </Flex>
              </Box>
            </Link>
          )
        })}
      </Flex>

      <Text
        fontSize={isMobile ? 'var(--font-size)' : 'var(--font-size-page-text)'}
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
        maxWidth="900px"
        paddingRight="40px"
        paddingBottom="var(--page-padding-bottom)"
      >
      </Text>
    </Box>
  )
}

