import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

// Built into the art site: served at /bayan/ (see ../../README of the sketches), output lands in
// ../../public/bayan and the root build copies it into dist.
export default defineConfig({
  plugins: [glsl()],
  base: '/bayan/',
  build: {
    outDir: '../../public/bayan',
    emptyOutDir: true,
  },
  server: {
    host: true
  }
})
