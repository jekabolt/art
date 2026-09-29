// The emboss bundle is built once at /emboss/; its page is copied to /emboss-black/ and /emboss-white/,
// where the path picks the tone (src/parts/visual.ts). /emboss itself stays as the white one.
import fs from 'node:fs'
const out = new URL('../../public/', import.meta.url)
const page = fs.readFileSync(new URL('emboss/index.html', out), 'utf8')
for (const tone of ['black', 'white']) {
  const dir = new URL(`emboss-${tone}/`, out)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(new URL('index.html', dir), page.replace('<span>emboss</span>', `<span>emboss ${tone}</span>`))
}
console.log('✓ emboss-black / emboss-white pages')
