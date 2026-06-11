import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()
const isWindows = process.platform === 'win32'
const npmExecutable = isWindows ? 'npm.cmd' : 'npm'
// Node 18.20+/20.12+/22 refuses to spawn .cmd files without a shell
// (CVE-2024-27980), so Windows must go through the shell.
const spawnOptions = {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: isWindows,
}

function runNpm(args) {
  const result = spawnSync(npmExecutable, args, spawnOptions)

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
  spawnOptions,
)

process.exit(previewProcess.status ?? 0)
