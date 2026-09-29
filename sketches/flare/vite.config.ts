import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

// Built into the art site: served at /flare/ (see ../../README of the sketches), output lands in
// ../../public/flare and the root build copies it into dist.
export default defineConfig({
  plugins: [glsl()],
  base: '/flare/',
  build: {
    outDir: '../../public/flare',
    emptyOutDir: true,
  },
  server: {
    host: true
  }
})
