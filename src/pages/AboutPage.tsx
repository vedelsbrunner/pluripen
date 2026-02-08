import { Box, Text, useMediaQuery } from '@chakra-ui/react'

import { DocxViewer } from '../components/DocxViewer'

export function AboutPage() {
  const [isMobile] = useMediaQuery('(max-width: 966px)')

  return (
    <Box>
      <Text
        fontSize={isMobile ? 'var(--page-title-size-mobile)' : 'var(--page-title-size)'}
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
        marginY={isMobile ? 10 : 40}
      >
        About
      </Text>
      <Box
        marginLeft={isMobile ? 'var(--content-margin-left-mobile)' : 'var(--content-margin-left)'}
        marginRight={isMobile ? 'var(--page-padding-mobile)' : 'var(--page-padding-right)'}
        paddingBottom="var(--page-padding-bottom)"
        maxWidth="900px"
      >
        <DocxViewer docxUrl="assets/PLURIPEN_about.docx" downloadLabel="About (DOCX) herunterladen" />
      </Box>
    </Box>
  )
}

