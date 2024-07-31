import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

const dist = path.join(__dirname, '.', 'docs')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [glsl()],
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
  }
})
