import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

const dist = path.join(__dirname, '.', 'dist')

// Every page is its own HTML entry, so each path gets a real 200 and only its own bundle:
// the gallery and the editor never pull three, the logo pages never pull jsPDF.
const pages = ['index.html', 'logo-black', 'logo-white', 'invert', 'punch-card', 'gyro', 'slit-scan', 'ink', 'flag', 'sticker', 'melt', 'droste', 'fourier', 'oneline', 'dots', 'vision', 'moire', 'timeslit', 'bit', 'extrude']
  .map((p) => path.resolve(__dirname, p.endsWith('.html') ? p : `${p}/index.html`))

// Unknown paths fall back to the black logo, as every path did before the gallery.
const copy404Plugin = () => {
  return {
    name: 'copy-404',
    writeBundle() {
      const logoPath = path.join(dist, 'logo-black', 'index.html')
      const errorPagePath = path.join(dist, '404.html')
      if (fs.existsSync(logoPath)) {
        fs.copyFileSync(logoPath, errorPagePath)
        console.log('✓ Copied logo-black/index.html to 404.html')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [glsl(), copy404Plugin()],
  // Absolute asset URLs: pages live in sub-folders (/logo-white/index.html …).
  base: '/',
  server: {
    host: true,
    // Local TLS certs are gitignored; serve plain http when they are absent.
    https: fs.existsSync(path.resolve(__dirname, 'localhost.key'))
      ? {
          key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')),
          cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')),
        }
      : false,
  },
  build: {
    outDir: dist,
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: pages,
    },
  },
  // Handle client-side routing - serve index.html for all routes
  preview: {
    port: 4173,
  }
})
