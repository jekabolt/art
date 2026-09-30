// BIT: a 1/4" hex screwdriver bit whose drive is the logo, rendered as a photograph would show it —
// polished steel with a fine lengthwise grind, on white, lit by a soft studio and one faint warm
// lamp, with a lens's touch of softness, a little chromatic fringe, and film grain. Drag to turn it;
// left alone it turns slowly by itself.
//
// The model is the OpenSCAD part (grbpwr-bit/bit.scad) exported to STL. Its flat facets get creased
// normals here (smooth across the turned surfaces, sharp at the hex edges and the logo's walls),
// and cylindrical UVs for the grind. The reflections come from a prefiltered studio environment,
// which is what makes metal read as metal.
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import './bit.css'

const canvas = document.getElementById('bit') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
renderer.physicallyCorrectLights = true

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

// --- the studio: a prefiltered room for reflections, a key light, and the faint warm lamp -------------------
// a product-photo studio, built as a scene and prefiltered for reflections: a white cove, a big
// softbox overhead, two tall strip boxes left and right, a thin rim strip behind, a small warm lamp,
// and black flags
function studio() {
  const env = new THREE.Scene()
  const sweep = new THREE.SphereGeometry(10, 48, 24)
  const colours: number[] = []
  const p = sweep.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 10 // −1 floor … 1 ceiling
    const v = y > 0 ? 0.62 + 0.18 * y : 0.62 + 0.3 * y // a white cove: bright above, falling off below the horizon
    colours.push(v, v, v)
  }
  sweep.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  env.add(new THREE.Mesh(sweep, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))
  const panel = (w: number, h: number, colour: THREE.Color, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide }))
    m.position.set(x, y, z)
    m.lookAt(0, 0.5, 0)
    env.add(m)
  }
  const white = (k: number) => new THREE.Color(k, k, k)
  panel(7, 5, white(5), 0, 8, 1) // overhead softbox
  panel(1.4, 8, white(7), -6, 2, 3) // left strip
  panel(1.2, 8, white(4), 6.5, 2, -1.5) // right strip
  panel(8, 0.5, white(3), 0, 3, -7) // rim strip behind
  panel(1.2, 1.2, new THREE.Color(6, 4.6, 2.2), 5, 0.8, 4) // the faint warm lamp
  // black flags: what gives polished steel its dark, defining lines
  panel(2.2, 9, white(0.015), -3.5, 1, -6)
  panel(1.6, 9, white(0.02), 4.5, 1, 5.5)
  panel(9, 1.2, white(0.03), 0, -1.2, 6)
  return env
}
// baked on the first frame, once the renderer has its size and context settled (baked at load, the
// first page in a fresh browser sometimes got an empty map and black steel)
let envReady = false
function bakeEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(studio(), 0.015).texture
  pmrem.dispose()
  envReady = true
}

const key = new THREE.DirectionalLight(0xffffff, 1.2)
key.position.set(-3, 6, 4)
scene.add(key)
const warm = new THREE.PointLight(0xffc766, 18, 0, 2) // the faint yellow lamp, low and to the right
warm.position.set(2.6, 1.2, 1.6)
scene.add(warm)

const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100)
camera.position.set(1.5, 1.35, 2.2)

// --- the steel -----------------------------------------------------------------------------------------------
// the grind: fine lengthwise streaks, as a roughness map (bright = rougher) and a matching bump
function grindTexture() {
  const W = 1024
  const H = 8
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const img = g.createImageData(W, H)
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const row = new Float32Array(W)
  // streaks of many widths: summed random walks, smoothed
  for (let octave = 0; octave < 4; octave++) {
    const step = 1 << octave
    let v = 0
    for (let x = 0; x < W; x++) {
      if (x % step === 0) v = rnd()
      row[x] += (v - 0.5) / (octave + 1)
    }
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = Math.max(0, Math.min(255, 128 + row[x] * 110))
      const o = (y * W + x) * 4
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v
      img.data[o + 3] = 255
    }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return t
}
const grind = grindTexture()
grind.repeat.set(3, 1)

const steel = new THREE.MeshPhysicalMaterial({
  color: 0xd4d6d9, // chrome-vanadium: a cool, slightly blue-grey white
  metalness: 1,
  roughness: 0.3,
  roughnessMap: grind,
  clearcoat: 0.25,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1.15,
})

// flat STL facets → creased normals: a vertex takes the average of the faces around it that lie within
// CREASE of its own face, so turned surfaces go smooth and real edges stay sharp
function creased(geo: THREE.BufferGeometry, creaseDeg: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const faceN: THREE.Vector3[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let f = 0; f < n / 3; f++) {
    a.fromBufferAttribute(pos, f * 3)
    b.fromBufferAttribute(pos, f * 3 + 1)
    c.fromBufferAttribute(pos, f * 3 + 2)
    faceN.push(new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize())
  }
  const key = (i: number) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`
  const around = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    const k = key(i)
    const list = around.get(k)
    if (list) list.push(Math.floor(i / 3))
    else around.set(k, [Math.floor(i / 3)])
  }
  const cos = Math.cos((creaseDeg * Math.PI) / 180)
  const normals = new Float32Array(n * 3)
  const sum = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    const own = faceN[Math.floor(i / 3)]
    sum.set(0, 0, 0)
    for (const f of around.get(key(i))!) if (faceN[f].dot(own) >= cos) sum.add(faceN[f])
    sum.normalize()
    normals[i * 3] = sum.x
    normals[i * 3 + 1] = sum.y
    normals[i * 3 + 2] = sum.z
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
}

// cylindrical UVs round the bit's axis (y, after standing it up): u round, v along
function cylindricalUV(geo: THREE.BufferGeometry, length: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (Math.atan2(pos.getZ(i), pos.getX(i)) / (Math.PI * 2) + 0.5) * 1
    uv[i * 2 + 1] = pos.getY(i) / length
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

// --- the soft shadow under it, on the white -----------------------------------------------------------------------
function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(0,0,0,0.42)')
  grad.addColorStop(0.25, 'rgba(0,0,0,0.22)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.06)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

const group = new THREE.Group()
scene.add(group)
let bitHeight = 1

new STLLoader().load('/assets/models/bit.stl', (geo) => {
  // OpenSCAD is z-up in mm: stand it up (y-up), base on the floor, centred on its axis, 1 unit = 25 mm
  geo.rotateX(-Math.PI / 2)
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const size = new THREE.Vector3()
  bb.getSize(size)
  const s = 1 / size.y
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2)
  geo.scale(s, s, s)
  bitHeight = 1
  creased(geo, 32)
  cylindricalUV(geo, bitHeight)
  const mesh = new THREE.Mesh(geo, steel)
  group.add(mesh)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, toneMapped: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.0005
  group.add(shadow)
  controls.target.set(0, 0.45, 0)
  controls.update()
})

// --- turning it -----------------------------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas)
controls.enablePan = false
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.rotateSpeed = 0.7
controls.minDistance = 1.1
controls.maxDistance = 6
controls.minPolarAngle = 0.12
controls.maxPolarAngle = Math.PI / 2 - 0.04 // never below the floor it stands on
controls.autoRotate = true
controls.autoRotateSpeed = 0.6
let lastInput = -1e9
controls.addEventListener('start', () => {
  controls.autoRotate = false
  lastInput = performance.now()
})
controls.addEventListener('end', () => (lastInput = performance.now()))

// --- the lens: a touch of softness toward the edges, a faint colour fringe, grain, and the warm glow -----------------
const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 px = 1.0 / resolution;
      vec2 c = vUv - 0.5;
      float edge = dot(c, c) * 2.0; // 0 in the middle, ~1 in the corners

      // softness: a small blur everywhere, a little more toward the edges (a real lens is sharpest in the middle)
      float r = 0.6 + 1.6 * edge;
      vec3 col = texture2D(tDiffuse, vUv).rgb * 0.36;
      col += texture2D(tDiffuse, vUv + vec2( r, 0.0) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(-r, 0.0) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(0.0,  r) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(0.0, -r) * px).rgb * 0.16;

      // a faint colour fringe toward the corners
      vec2 ca = c * px * 2.2 * resolution.x * 0.0022;
      col.r = mix(col.r, texture2D(tDiffuse, vUv + ca).r, 0.5 * edge);
      col.b = mix(col.b, texture2D(tDiffuse, vUv - ca).b, 0.5 * edge);

      // the warm lamp's glow: barely there, from the lower right
      float glow = exp(-dot(vUv - vec2(0.86, 0.3), vUv - vec2(0.86, 0.3)) * 5.0);
      col = mix(col, col * vec3(1.0, 0.975, 0.9), 0.55 * glow);

      // grain: fine, changing every frame, strongest in the mid tones like film
      float g = hash(gl_FragCoord.xy + fract(time) * 173.0) - 0.5;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += g * 0.035 * (0.35 + 0.65 * (1.0 - abs(lum - 0.5) * 2.0));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

const target = new THREE.WebGLMultisampleRenderTarget(1, 1, { encoding: THREE.sRGBEncoding })
const composer = new EffectComposer(renderer, target)
composer.addPass(new RenderPass(scene, camera))
const lens = new ShaderPass(LensShader)
composer.addPass(lens)

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  composer.setPixelRatio(dpr)
  composer.setSize(w, h)
  lens.uniforms.resolution.value.set(w * dpr, h * dpr)
  camera.aspect = w / h
  // on a phone, step back so the whole bit fits the narrow frame
  camera.fov = w < h ? 40 : 28
  camera.updateProjectionMatrix()
}

function frame(t: number) {
  if (!envReady) bakeEnvironment()
  if (!controls.autoRotate && t - lastInput > 4000) controls.autoRotate = true
  controls.update()
  lens.uniforms.time.value = t / 1000
  composer.render()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
