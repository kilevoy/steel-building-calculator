import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runNpm(args) {
  const result = spawnSync(npmExecutable, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const distPath = path.join(repoRoot, 'dist')
if (!existsSync(distPath)) {
  runNpm(['run', 'build'])
}

const previewProcess = spawnSync(
  npmExecutable,
  ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174'],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  },
)

process.exit(previewProcess.status ?? 0)
