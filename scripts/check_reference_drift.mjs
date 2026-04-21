import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const repoRoot = process.cwd()

const referenceFiles = [
  resolve(repoRoot, 'src/domain/purlin/model/purlin-reference.generated.ts'),
  resolve(repoRoot, 'src/domain/column/model/column-reference.generated.ts'),
  resolve(repoRoot, 'src/domain/truss/model/truss-reference.generated.ts'),
]

function readReferences() {
  return new Map(referenceFiles.map((path) => [path, readFileSync(path, 'utf8')]))
}

function run(command) {
  execSync(command, {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}

const before = readReferences()

run('npm run generate:purlin-ref')
run('npm run generate:column-ref')
run('npm run generate:truss-ref')

const after = readReferences()
const changedFiles = referenceFiles.filter((path) => before.get(path) !== after.get(path))

if (changedFiles.length > 0) {
  console.error('Reference drift detected in generated modules:')
  for (const file of changedFiles) {
    console.error(`- ${file}`)
  }
  process.exit(1)
}

console.log('Reference data is stable after regeneration.')
