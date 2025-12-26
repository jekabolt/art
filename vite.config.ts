import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

const dist = path.join(__dirname, '.', 'dist')

// Plugin to copy index.html to 404.html for SPA routing support
const copy404Plugin = () => {
  return {
    name: 'copy-404',
    writeBundle() {
      const indexPath = path.join(dist, 'index.html')
      const errorPagePath = path.join(dist, '404.html')
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, errorPagePath)
        console.log('✓ Copied index.html to 404.html for SPA routing')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [glsl(), copy404Plugin()],
  base: './',
  server: {
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')),
    },
  },
  build: {
    outDir: dist
  },
  // Handle client-side routing - serve index.html for all routes
  preview: {
    port: 4173,
  }
})
