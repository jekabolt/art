import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

// Built into the art site: served at /portrait/ (see ../../README of the sketches), output lands in
// ../../public/portrait and the root build copies it into dist.
export default defineConfig({
  plugins: [glsl()],
  base: '/portrait/',
  build: {
    outDir: '../../public/portrait',
    emptyOutDir: true,
  },
  server: {
    host: true
  }
})
