import type { EnclosingPricingOverrideValues } from './enclosing-pricing-overrides'

interface ParsedNumber {
  value: number
  source: string
}

export interface ParsedEnclosingPricingResult {
  values: Partial<EnclosingPricingOverrideValues>
  extractedFields: string[]
}

let isPdfWorkerConfigured = false

function parseRuNumber(raw: string): number {
  const normalized = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizePage(text: string): string[] {
  return text
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function findPageIndex(linesByPage: string[][], pattern: RegExp): number {
  return linesByPage.findIndex((lines) => lines.some((line) => pattern.test(line)))
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?/g) ?? []
  return matches
    .map(parseRuNumber)
    .filter((value) => Number.isFinite(value))
}

function parseLinePrice(
  lines: string[],
  linePattern: RegExp,
  parser: (line: string) => ParsedNumber | null,
): ParsedNumber | null {
  const line = lines.find((candidate) => linePattern.test(candidate))
  if (!line) {
    return null
  }
  return parser(line)
}

function parseAccessoryBasePrice(linesByPage: string[][]): ParsedNumber | null {
  const pageIndex = findPageIndex(linesByPage, /Прайс-лист\s*№\s*1\.7/i)
  if (pageIndex < 0) {
    return null
  }

  const candidatePages = [pageIndex, pageIndex + 1].filter((index) => index < linesByPage.length)
  for (const index of candidatePages) {
    const line = linesByPage[index].find((candidate) => /Плоский лист/i.test(candidate) && /м\.кв\./i.test(candidate))
    if (!line) {
      continue
    }
    const suffix = line.split(/м\.кв\./i)[1] ?? ''
    const numbers = extractNumbers(suffix)
    if (numbers.length > 0) {
      return { value: numbers[0], source: line }
    }
  }

  return null
}

function parseStarter2mmBasePrice(linesByPage: string[][]): ParsedNumber | null {
  const pageIndex = findPageIndex(linesByPage, /Прайс-лист\s*№\s*2\b/i)
  if (pageIndex < 0) {
    return null
  }

  const line = linesByPage[pageIndex].find((candidate) => /^1\s+Плоский лист/i.test(candidate))
  if (!line) {
    return null
  }

  const numbers = extractNumbers(line)
  if (numbers.length === 0) {
    return null
  }

  return { value: numbers[numbers.length - 1], source: line }
}

function parseHarpoonFasteners(linesByPage: string[][]): Record<number, number> {
  const pageIndex = findPageIndex(linesByPage, /Прайс-лист\s*№\s*12\.4/i)
  if (pageIndex < 0) {
    return {}
  }

  const result: Record<number, number> = {}
  for (const line of linesByPage[pageIndex]) {
    const match = line.match(
      /Саморез\s+5[.,]5х(\d+)[^\n]*?Гарпун\s+шт\.\s+\d+\s+(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/i,
    )
    if (!match) {
      continue
    }
    const lengthMm = Number(match[1])
    const priceRub = parseRuNumber(match[2])
    if (Number.isFinite(lengthMm) && Number.isFinite(priceRub)) {
      result[lengthMm] = priceRub
    }
  }
  return result
}

function parseAccessoryFastenerPrice(linesByPage: string[][]): ParsedNumber | null {
  const pageIndex = findPageIndex(linesByPage, /Прайс-лист\s*№\s*7\b/i)
  if (pageIndex < 0) {
    return null
  }

  const line = linesByPage[pageIndex].find(
    (candidate) =>
      /Саморез\s+4[.,]8х28\s+ROOFRetail/i.test(candidate) && !/\(цинк\)/i.test(candidate),
  )
  if (!line) {
    return null
  }

  const match = line.match(/шт\.\s+\d+\s+(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/i)
  if (!match) {
    return null
  }

  const value = parseRuNumber(match[1])
  if (!Number.isFinite(value)) {
    return null
  }
  return { value, source: line }
}

function parseRoofProfileGasketPrice(linesByPage: string[][]): ParsedNumber | null {
  for (const lines of linesByPage) {
    const parsed = parseLinePrice(lines, /Уплотнитель МП ТСП-К-А/i, (line) => {
      const match = line.match(/шт\.\s+(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/i)
      if (!match) {
        return null
      }
      const value = parseRuNumber(match[1])
      return Number.isFinite(value) ? { value, source: line } : null
    })
    if (parsed) {
      return parsed
    }
  }
  return null
}

function parseLockGasketPrice(linesByPage: string[][]): ParsedNumber | null {
  for (const lines of linesByPage) {
    const parsed = parseLinePrice(lines, /Уплотнитель замкового соединения ТСП/i, (line) => {
      const match = line.match(/уп\.\s+(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/i)
      if (!match) {
        return null
      }
      const value = parseRuNumber(match[1])
      return Number.isFinite(value) ? { value, source: line } : null
    })
    if (parsed) {
      return parsed
    }
  }
  return null
}

function parseSocleDripPrice(linesByPage: string[][]): ParsedNumber | null {
  for (const lines of linesByPage) {
    const line = lines.find((candidate) => /Планка отлива цоколя 50х20х2000/i.test(candidate))
    if (!line) {
      continue
    }
    const suffix = (line.split(/шт\./i)[1] ?? line).replace('-', ' ')
    const tokenMatch = suffix.match(/\d{1,3}(?:[.,]\d+)?/)
    if (tokenMatch) {
      const value = parseRuNumber(tokenMatch[0])
      if (Number.isFinite(value)) {
        return { value, source: line }
      }
    }
  }
  return null
}

function parseSocleAnchorPrice(linesByPage: string[][]): ParsedNumber | null {
  for (const lines of linesByPage) {
    const parsed = parseLinePrice(lines, /Анкер фасадный Стандарт 10х100/i, (line) => {
      const match = line.match(/шт\.\s+\d+\s+(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)/i)
      if (!match) {
        return null
      }
      const value = parseRuNumber(match[1])
      return Number.isFinite(value) ? { value, source: line } : null
    })
    if (parsed) {
      return parsed
    }
  }
  return null
}

export function parseEnclosingPricingValuesFromPages(pages: string[]): ParsedEnclosingPricingResult {
  const linesByPage = pages.map(normalizePage)
  const values: Partial<EnclosingPricingOverrideValues> = {}
  const extractedFields: string[] = []

  const accessoryBase = parseAccessoryBasePrice(linesByPage)
  if (accessoryBase) {
    values.accessoryBaseFlatSheetPriceRubPerM2 = accessoryBase.value
    extractedFields.push('accessoryBaseFlatSheetPriceRubPerM2')
  }

  const starterBase = parseStarter2mmBasePrice(linesByPage)
  if (starterBase) {
    values.starterBaseFlatSheet2mmPriceRubPerM2 = starterBase.value
    extractedFields.push('starterBaseFlatSheet2mmPriceRubPerM2')
  }

  const harpoonMap = parseHarpoonFasteners(linesByPage)
  if (Object.keys(harpoonMap).length > 0) {
    values.harpoonPanelFastenerPriceRubByLengthMm = harpoonMap
    extractedFields.push('harpoonPanelFastenerPriceRubByLengthMm')
  }

  const accessoryFastener = parseAccessoryFastenerPrice(linesByPage)
  if (accessoryFastener) {
    values.accessoryFastenerPriceRub = accessoryFastener.value
    extractedFields.push('accessoryFastenerPriceRub')
  }

  const lockGasket = parseLockGasketPrice(linesByPage)
  if (lockGasket) {
    values.lockGasketPackPriceRub = lockGasket.value
    extractedFields.push('lockGasketPackPriceRub')
  }

  const roofProfileGasket = parseRoofProfileGasketPrice(linesByPage)
  if (roofProfileGasket) {
    values.roofProfileGasketPriceRub = roofProfileGasket.value
    extractedFields.push('roofProfileGasketPriceRub')
  }

  const socleDrip = parseSocleDripPrice(linesByPage)
  if (socleDrip) {
    values.wallSocleDripPriceRubPerPiece = socleDrip.value
    extractedFields.push('wallSocleDripPriceRubPerPiece')
  }

  const socleAnchor = parseSocleAnchorPrice(linesByPage)
  if (socleAnchor) {
    values.socleAnchorBoltPriceRub = socleAnchor.value
    extractedFields.push('socleAnchorBoltPriceRub')
  }

  return { values, extractedFields }
}

function extractTextLinesFromPdfPage(pageItems: Array<{ str?: string; transform?: number[] }>): string {
  const groups: Array<{ y: number; items: Array<{ x: number; text: string }> }> = []
  for (const item of pageItems) {
    if (!item.str || !item.transform || item.transform.length < 6) {
      continue
    }
    const y = item.transform[5]
    const x = item.transform[4]
    const group = groups.find((candidate) => Math.abs(candidate.y - y) <= 2)
    if (group) {
      group.items.push({ x, text: item.str })
    } else {
      groups.push({ y, items: [{ x, text: item.str }] })
    }
  }

  return groups
    .sort((left, right) => right.y - left.y)
    .map((group) =>
      group.items
        .sort((left, right) => left.x - right.x)
        .map((item) => item.text.trim())
        .filter((text) => text.length > 0)
        .join(' '),
    )
    .filter((line) => line.length > 0)
    .join('\n')
}

export async function parseEnclosingPricingValuesFromPdfFile(file: File): Promise<ParsedEnclosingPricingResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  if (!isPdfWorkerConfigured) {
    try {
      const workerUrlModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')
      if (typeof workerUrlModule.default === 'string' && workerUrlModule.default.length > 0) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrlModule.default
      }
    } catch {
      // Keep fallback below: getDocument with disableWorker in environments where worker URL import is unavailable.
    }
    isPdfWorkerConfigured = true
  }

  const document = await pdfjs
    .getDocument({
      data: bytes,
      ...(pdfjs.GlobalWorkerOptions.workerSrc
        ? {}
        : ({
            // Runtime option supported by PDF.js; type is missing in current package typings.
            disableWorker: true,
          } as Record<string, unknown>)),
    } as Record<string, unknown>)
    .promise

  const pages: string[] = []
  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex)
    const textContent = await page.getTextContent()
    pages.push(extractTextLinesFromPdfPage(textContent.items as Array<{ str?: string; transform?: number[] }>))
  }

  return parseEnclosingPricingValuesFromPages(pages)
}
