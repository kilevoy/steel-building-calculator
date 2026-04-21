import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolveBasePath(): string {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return '/'
  }

  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repoName || repoName.endsWith('.github.io')) {
    return '/'
  }

  return `/${repoName}/`
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor'
            }

            if (id.includes('node_modules/zod')) {
              return 'zod-vendor'
            }

            return 'vendor'
          }

          if (id.includes('column-reference.generated.ts')) {
            return 'reference-column'
          }

          if (id.includes('purlin-reference.generated.ts')) {
            return 'reference-purlin'
          }

          return undefined
        },
      },
    },
  },
})
