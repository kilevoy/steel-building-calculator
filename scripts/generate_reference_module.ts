import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type SupportedDomain = 'column' | 'purlin' | 'truss'

const REFERENCE_PATH_BY_DOMAIN: Record<SupportedDomain, string> = {
  column: path.resolve(__dirname, '../src/domain/column/model/column-reference.generated.ts'),
  purlin: path.resolve(__dirname, '../src/domain/purlin/model/purlin-reference.generated.ts'),
  truss: path.resolve(__dirname, '../src/domain/truss/model/truss-reference.generated.ts'),
}

export function serializeReferenceValue(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function renderReferenceModule(exportsMap: Record<string, unknown>, domain: SupportedDomain): string {
  const lines = [
    `// Rebuilt from the checked-in ${domain} reference snapshot.`,
    '// This generator keeps reference-data regeneration deterministic inside the repo.',
    '',
  ]

  for (const [exportName, value] of Object.entries(exportsMap)) {
    lines.push(`export const ${exportName} = ${serializeReferenceValue(value)} as const;`, '')
  }

  return `${lines.join('\n').trimEnd()}\n`
}

async function loadReferenceExports(domain: SupportedDomain): Promise<Record<string, unknown>> {
  const moduleUrl = pathToFileURL(REFERENCE_PATH_BY_DOMAIN[domain]).href
  const module = (await import(moduleUrl)) as Record<string, unknown>

  return Object.fromEntries(Object.entries(module).filter(([exportName]) => exportName !== 'default'))
}

export async function main() {
  const domainArg = process.argv[2]

  if (domainArg !== 'column' && domainArg !== 'purlin' && domainArg !== 'truss') {
    throw new Error('Usage: tsx scripts/generate_reference_module.ts <column|purlin|truss>')
  }

  const domain = domainArg as SupportedDomain
  const filePath = REFERENCE_PATH_BY_DOMAIN[domain]
  const exportsMap = await loadReferenceExports(domain)
  const renderedModule = renderReferenceModule(exportsMap, domain)

  fs.writeFileSync(filePath, renderedModule, 'utf8')
  console.log(`Rebuilt ${path.relative(path.resolve(__dirname, '..'), filePath)}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
