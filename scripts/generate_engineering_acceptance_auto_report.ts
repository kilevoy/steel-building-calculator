import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CASES_PATH = resolve(process.cwd(), 'docs/ENGINEERING_ACCEPTANCE_CASES.md')
const REPORT_PATH = resolve(process.cwd(), 'docs/ENGINEERING_ACCEPTANCE_AUTO_REPORT.md')
const TODAY = '2026-03-22'

type MetricRow = {
  metric: string
  excel: string
  app: string
  tolerance: string
  status: string
}

type CaseReport = {
  id: string
  title: string
  workbook: string
  rows: MetricRow[]
}

function stripCode(value: string): string {
  return value.trim().replace(/^`|`$/g, '').trim()
}

function parseCases(markdown: string): CaseReport[] {
  const sections = markdown.split(/^###\s+/m).slice(1)

  return sections.map((section) => {
    const lines = section.split(/\r?\n/)
    const title = lines[0]?.trim() ?? ''
    const id = title.split(/\s+/)[0] ?? title
    const workbookLine = lines.find((line) => line.startsWith('- Workbook:')) ?? ''
    const workbook = stripCode(workbookLine.replace('- Workbook:', '').trim())
    const tableStart = lines.findIndex((line) => line.trim() === '| Metric | Excel | App | Tolerance | Status |')

    const rows: MetricRow[] = []
    if (tableStart !== -1) {
      for (let index = tableStart + 2; index < lines.length; index += 1) {
        const line = lines[index].trim()
        if (!line.startsWith('|')) {
          break
        }

        const cells = line
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim())

        if (cells.length !== 5) {
          continue
        }

        rows.push({
          metric: cells[0],
          excel: stripCode(cells[1]),
          app: stripCode(cells[2]),
          tolerance: cells[3],
          status: cells[4],
        })
      }
    }

    return {
      id,
      title,
      workbook,
      rows,
    }
  })
}

function isUnsupported(row: MetricRow): boolean {
  return row.excel.startsWith('unsupported:')
}

function isOpaque(row: MetricRow): boolean {
  return row.excel === 'n/a' || row.excel === ''
}

function isMatch(row: MetricRow): boolean {
  if (isUnsupported(row) || isOpaque(row)) {
    return false
  }

  return row.excel === row.app
}

function renderMetricList(rows: MetricRow[]): string {
  return rows.map((row) => `- ${row.metric}: Excel=${row.excel || '<empty>'}, App=${row.app || '<empty>'}, tolerance=${row.tolerance}`).join('\n')
}

const markdown = readFileSync(CASES_PATH, 'utf8')
const cases = parseCases(markdown)
const allRows = cases.flatMap((item) => item.rows)
const comparableRows = allRows.filter((row) => !isUnsupported(row) && !isOpaque(row))
const matchedRows = comparableRows.filter(isMatch)
const mismatchedCases = cases
  .map((item) => ({
    ...item,
    mismatches: item.rows.filter((row) => !isUnsupported(row) && !isOpaque(row) && row.excel !== row.app),
    unsupported: item.rows.filter(isUnsupported),
    opaque: item.rows.filter(isOpaque),
  }))
  .filter((item) => item.mismatches.length > 0 || item.unsupported.length > 0 || item.opaque.length > 0)

const casesWithNoComparableMismatches = cases.filter((item) =>
  item.rows.every((row) => isUnsupported(row) || isOpaque(row) || isMatch(row)),
)
const fullyComparableCases = cases.filter((item) =>
  item.rows.length > 0 && item.rows.every((row) => !isUnsupported(row) && !isOpaque(row) && isMatch(row)),
)

const report = `# Engineering Acceptance Auto Report

Generated from [ENGINEERING_ACCEPTANCE_CASES.md](/C:/v2_1/docs/ENGINEERING_ACCEPTANCE_CASES.md) on ${TODAY}.

## Summary

- Cases parsed: **${cases.length}**
- Comparable metrics: **${comparableRows.length}**
- Exact metric matches: **${matchedRows.length}/${comparableRows.length}**
- Cases with no comparable mismatches: **${casesWithNoComparableMismatches.length}/${cases.length}**
- Fully comparable cases with exact matches: **${fullyComparableCases.length}/${cases.length}**
- Unsupported metrics: **${allRows.filter(isUnsupported).length}**
- Workbook-opaque metrics (\`n/a\` or empty Excel): **${allRows.filter(isOpaque).length}**

## Fully Comparable And Matched Cases

${fullyComparableCases.map((item) => `- ${item.id}`).join('\n') || '- none'}

## Cases Requiring Manual Attention

${mismatchedCases.map((item) => {
  const blocks = [`### ${item.id}`]
  if (item.mismatches.length > 0) {
    blocks.push('Mismatches:')
    blocks.push(renderMetricList(item.mismatches))
  }
  if (item.unsupported.length > 0) {
    blocks.push('Unsupported in workbook snapshot:')
    blocks.push(renderMetricList(item.unsupported))
  }
  if (item.opaque.length > 0) {
    blocks.push('Workbook-opaque metrics:')
    blocks.push(renderMetricList(item.opaque))
  }
  return blocks.join('\n\n')
}).join('\n\n') || 'All cases are either matched or explicitly unsupported.'}
`

writeFileSync(REPORT_PATH, report, 'utf8')
console.log(`Updated ${REPORT_PATH}`)

