import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

// Built into the art site: served at /emboss/ (see ../../README of the sketches), output lands in
// ../../public/emboss and the root build copies it into dist.
export default defineConfig({
  plugins: [glsl()],
  base: '/emboss/',
  build: {
    outDir: '../../public/emboss',
    emptyOutDir: true,
  },
  server: {
    host: true
  }
})
