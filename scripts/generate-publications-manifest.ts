import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'

// `xlsx` is a CJS module. Under ESM (and tsx), the functions are usually under `default`.
// This keeps the script working across runtimes.
const XLSXLib: typeof XLSX = ((XLSX as unknown as { default?: typeof XLSX }).default ?? XLSX) as typeof XLSX

type SeriesKey = 'GLM' | 'GPS' | 'GPT' | 'GRP' | 'PLURIPEN'

type PublicationAsset = {
  id: string
  series: Exclude<SeriesKey, 'PLURIPEN'>
  volume: string
  title: string
  authors?: string
  year?: number
  coverPdf: string
  abstractDocx: string
  textPdf?: string
}

type Manifest = {
  generatedAt: string
  volumes: PublicationAsset[]
}

function normalizeHeader(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

function parseVolumeFolderName(folderName: string): { series: string; volume: string } | null {
  const m = /^([A-Z]{3})_(.+)$/.exec(folderName)
  if (!m) return null
  return { series: m[1], volume: m[2] }
}

function padVolume(volume: string) {
  // Keep hyphenated volumes as-is (e.g. 14-15). Otherwise pad numeric ones.
  if (volume.includes('-')) return volume
  const n = Number(volume)
  if (!Number.isFinite(n)) return volume
  return String(n).padStart(2, '0')
}

function volumeSortKey(volume: string): number[] {
  // "14-15" -> [14,15], "06" -> [6], otherwise [].
  const parts = volume.split('-').map((p) => Number(p))
  if (parts.every((p) => Number.isFinite(p))) return parts as number[]
  const n = Number(volume)
  if (Number.isFinite(n)) return [n]
  return []
}

function compareVolumesDesc(a: PublicationAsset, b: PublicationAsset) {
  const ak = volumeSortKey(a.volume)
  const bk = volumeSortKey(b.volume)
  if (ak.length && bk.length) {
    const max = Math.max(ak.length, bk.length)
    for (let i = 0; i < max; i++) {
      const av = ak[i] ?? -Infinity
      const bv = bk[i] ?? -Infinity
      if (av !== bv) return bv - av
    }
    return 0
  }
  if (ak.length) return -1
  if (bk.length) return 1
  return b.volume.localeCompare(a.volume)
}

async function listDirs(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function listFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isFile()).map((e) => e.name)
}

function resolveTitleFromXlsx(
  titlesById: Map<string, { title?: string; authors?: string; year?: number }>,
  series: string,
  volume: string,
): { title?: string; authors?: string; year?: number } | undefined {
  const id = `${series}_${volume}`
  return titlesById.get(id)
}

function parseSeriesAndVolumeFromNummer(nummer: string): { series: string; volume: string } | null {
  const m = /^\s*([A-Z]{3})\s*([0-9]+(?:-[0-9]+)?)\s*$/.exec(nummer.toUpperCase())
  if (!m) return null
  return { series: m[1], volume: m[2] }
}

function readMetadataFromBooksXlsx(
  xlsxPath: string,
): Map<string, { title?: string; authors?: string; year?: number }> {
  const wb = XLSXLib.readFile(xlsxPath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return new Map()

  const rows = XLSXLib.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (!rows.length) return new Map()

  // Find columns heuristically (German/English variants)
  const headers = Object.keys(rows[0])
  const headerMap = new Map<string, string>()
  for (const h of headers) headerMap.set(normalizeHeader(h), h)

  const nummerHeader = headerMap.get('nummer') ?? headerMap.get('number') ?? headerMap.get('no') ?? headerMap.get('nr')
  const authorsHeader =
    headerMap.get('autorenbzwherausgebereds') ??
    headerMap.get('autor') ??
    headerMap.get('authors') ??
    headerMap.get('editor') ??
    headerMap.get('editors')
  const yearHeader = headerMap.get('jahr') ?? headerMap.get('year')
  const titleHeader =
    headerMap.get('buchtitel') ?? headerMap.get('titel') ?? headerMap.get('title') ?? headerMap.get('name')

  if (!nummerHeader) return new Map()

  const out = new Map<string, { title?: string; authors?: string; year?: number }>()
  for (const row of rows) {
    const nummerRaw = String(row[nummerHeader] ?? '').trim()
    if (!nummerRaw) continue
    const parsed = parseSeriesAndVolumeFromNummer(nummerRaw)
    if (!parsed) continue

    const series = parsed.series
    const volume = padVolume(parsed.volume)

    const titleRaw = titleHeader ? String(row[titleHeader] ?? '').trim() : ''
    const authorsRaw = authorsHeader ? String(row[authorsHeader] ?? '').trim() : ''
    const yearRaw = yearHeader ? Number(row[yearHeader]) : NaN

    out.set(`${series}_${volume}`, {
      title: titleRaw || undefined,
      authors: authorsRaw || undefined,
      year: Number.isFinite(yearRaw) ? yearRaw : undefined,
    })
  }
  return out
}

async function main() {
  const root = process.cwd()
  const assetsRoot = path.join(root, 'assets')
  const outPath = path.join(root, 'src', 'content', 'publications.generated.json')

  const titlesById = (() => {
    const booksXlsx = path.join(assetsRoot, 'books.xlsx')
    return fs
      .access(booksXlsx)
      .then(() => readMetadataFromBooksXlsx(booksXlsx))
      .catch(() => new Map<string, { title?: string; authors?: string; year?: number }>())
  })()

  const titles = await titlesById

  const seriesDirs = await listDirs(assetsRoot)
  const volumes: PublicationAsset[] = []

  for (const seriesDir of seriesDirs) {
    if (!/^(GLM|GPS|GPT|GRP)$/.test(seriesDir)) continue
    const seriesPath = path.join(assetsRoot, seriesDir)
    const volumeDirs = await listDirs(seriesPath)

    for (const volumeDir of volumeDirs) {
      const parsed = parseVolumeFolderName(volumeDir)
      if (!parsed) continue
      const series = parsed.series as PublicationAsset['series']
      const volume = parsed.volume

      const volumePath = path.join(seriesPath, volumeDir)
      const files = await listFiles(volumePath)

      const cover = files.find((f) => f.toLowerCase().endsWith('_titel.pdf'))
      if (!cover) continue

      const abstract =
        files.find((f) => f.toLowerCase().endsWith('_abstract.docx')) ??
        (files.find((f) => f.toLowerCase() === 'dglm_20_abstract.docx') ?? null)
      if (!abstract) continue

      const text =
        files.find((f) => f.toLowerCase().endsWith('_text.pdf')) ??
        files.find((f) => f.toLowerCase().endsWith('_kern.pdf')) ??
        files.find((f) => f.toLowerCase().endsWith('_ktext.pdf'))

      // Use relative paths so GitHub Pages (repo subpath) works.
      // HashRouter keeps the path stable, so `assets/...` resolves correctly.
      const urlBase = `assets/${seriesDir}/${volumeDir}`
      const volumePadded = padVolume(volume)
      const id = `${series}_${volumePadded}`
      const meta = resolveTitleFromXlsx(titles, series, volumePadded)
      const title = meta?.title ?? `${series} ${volumePadded}`

      volumes.push({
        id,
        series,
        volume: volumePadded,
        title,
        authors: meta?.authors,
        year: meta?.year,
        coverPdf: `${urlBase}/${cover}`,
        abstractDocx: `${urlBase}/${abstract}`,
        textPdf: text ? `${urlBase}/${text}` : undefined,
      })
    }
  }

  volumes.sort((a, b) => {
    if (a.series !== b.series) return a.series.localeCompare(b.series)
    return compareVolumesDesc(a, b)
  })

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    volumes,
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${volumes.length} volumes to ${path.relative(root, outPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

