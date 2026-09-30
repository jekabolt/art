// BIT: a 1/4" hex screwdriver bit whose drive is the logo, shown as a photograph would show it —
// bead-blasted grey tool steel on a warm off-white sweep, backlit by one bright lamp so the rim
// glows and the light blooms round the silhouette, shot on an action camera: a wide lens with a
// trace of barrel, the ISP's sharpening halos and its sensor noise. Drag to turn it; left alone it
// turns slowly by itself.
//
// The model is the OpenSCAD part (grbpwr-bit/bit.scad) exported to STL, z-up, normalised here to
// 1 unit tall. Its flat facets get creased normals (smooth across the turned surfaces, sharp at the
// hex edges and the logo's walls) and per-triangle distances to the sharp edges, which the shader
// turns into worn, slightly brighter edges. The surface detail is a packed micro-texture (normal,
// height, low-frequency variation) sampled triplanar in object space, so there is no UV seam.
//
// Rendering is linear HDR: no tone mapping in the scene, a half-float composer target, bloom on the
// HDR image, then one final pass does barrel + a trace of chromatic aberration, vignette, ACES,
// unsharp mask, sensor noise and sRGB.
//
// Textures (optional, procedural fallbacks if absent): see GRAIN_URL and ENV_URL.
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib'
import './bit.css'

// --- assets: drop-ins; each falls back to a procedural equivalent when missing -------------------------------
const GRAIN_URL = '/assets/bit/steel-grain.jpg' // tileable-ish grayscale bead-blasted steel micro-height
const ENV_URL = '/assets/bit/studio-env.jpg' // equirect-ish (21:9) bright studio for reflections

// --- the look: the numbers worth tuning ------------------------------------------------------------------------
const LOOK = {
  bitFraction: 0.38, // bit height as a fraction of the viewport height
  fov: 60, // action-cam vertical FOV (landscape); portrait uses a little less
  // the sweep behind everything: linear colour that tone-maps (ACES) to ≈ #f7f4ec, a hint of warmth
  backdrop: new THREE.Color(2.917, 2.293, 1.31),
  lamp: new THREE.Color(10, 8.2, 6), // the bright backlight's core, linear
  bloom: { threshold: 3.4, strength: 0.22, radius: 0.65 },
  steel: { color: 0x626a78, roughness: 0.52, envMapIntensity: 1.0 },
  detail: { scale: 1.0, normal: 0.6, roughVar: 0.5, albedoVar: 0.34, wearWidth: 0.012, wearAmount: 0.7, aniso: 0.25 },
  lens: { barrel: 0.05, ca: 0.0016, vignette: 0.07, sharpen: 0.6, sharpenClamp: 0.035 },
  noise: { shadows: 0.04, highlights: 0.011, chroma: 0.01, fixed: 0.15, hz: 30 },
  maxDpr: 1.5,
}

const canvas = document.getElementById('bit') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
renderer.outputEncoding = THREE.LinearEncoding // the final pass writes sRGB itself
renderer.toneMapping = THREE.NoToneMapping // linear HDR into the composer; ACES happens in the final pass
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
RectAreaLightUniformsLib.init()
const hdr = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'))
const narrow = window.innerWidth < 700

const scene = new THREE.Scene()
scene.background = LOOK.backdrop

// --- the studio: a prefiltered room for reflections -------------------------------------------------------------
// The room is in "env space", where the backlight sits at −z. The steel's shader rotates its environment
// lookups by the camera's azimuth, so the lamp stays behind the bit however the camera orbits, and the
// light rig below turns with it.
const white = (k: number) => new THREE.Color(k, k, k)
function studio(envImage?: HTMLImageElement) {
  const env = new THREE.Scene()
  const sweep = new THREE.SphereGeometry(10, 48, 24)
  if (envImage) {
    // the 21:9 studio photo becomes a 2:1 equirect: a band round the horizon, poles filled from its edges
    const W = envImage.width
    const H = Math.round(W / 2)
    const band = Math.round((W / envImage.width) * envImage.height)
    const top = Math.round((H - band) / 2)
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    g.drawImage(envImage, 0, 0, envImage.width, 1, 0, 0, W, top + 1)
    g.drawImage(envImage, 0, envImage.height - 1, envImage.width, 1, 0, top + band - 1, W, H - top - band + 1)
    g.drawImage(envImage, 0, top, W, band)
    const map = new THREE.CanvasTexture(c)
    map.encoding = THREE.sRGBEncoding
    const m = new THREE.Mesh(sweep, new THREE.MeshBasicMaterial({ map, color: white(0.6), side: THREE.BackSide }))
    m.rotation.y = Math.PI / 2 // the image's centre (its backlight) to −z
    env.add(m)
  } else {
    const colours: number[] = []
    const p = sweep.getAttribute('position')
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 10 // −1 floor … 1 ceiling
      const back = Math.max(0, -p.getZ(i) / 10) // 1 straight behind
      const v = (y > 0 ? 0.55 + 0.2 * y : 0.55 + 0.25 * y) + 0.9 * back * back
      colours.push(v, v * 0.96, v * 0.88)
    }
    sweep.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
    env.add(new THREE.Mesh(sweep, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))
  }
  // analytic cards for true HDR range (the photo is LDR): the lamp behind, two strips, the softbox above
  const card = (w: number, h: number, colour: THREE.Color, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide }))
    m.position.set(x, y, z)
    m.lookAt(0, 0.5, 0)
    env.add(m)
  }
  card(3.2, 2.4, new THREE.Color(2.2, 2.05, 1.85), 0, 1.0, -6) // the backlight (the visible disc in the scene carries the bloom)
  card(0.9, 4, white(1.8), -4.5, 1.2, -4.5) // left strip
  card(0.9, 4, white(1.8), 4.5, 1.2, -4.5) // right strip
  card(6, 4, white(0.9), 0, 8, -1) // overhead softbox
  // the camera side is dark: the photographer, the room behind them. It is what keeps the faces toward
  // us mid grey instead of white, and gives the satin its soft broad gradients
  card(4, 3.2, white(0.05), 0, 1.0, 5)
  card(2.5, 6, white(0.04), -5, 1, 4.5)
  card(2.5, 6, white(0.04), 5, 1, 4.5)
  return env
}
// baked on the first frame, once the renderer has its size and context settled (baked at load, the
// first page in a fresh browser sometimes got an empty map and black steel); rebaked when the photo lands
let envBaked = false
let envImage: HTMLImageElement | undefined
let envDirty = false
function bakeEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const old = scene.environment
  scene.environment = pmrem.fromScene(studio(envImage), 0.02).texture
  old?.dispose()
  pmrem.dispose()
  envBaked = true
  envDirty = false
}
new THREE.ImageLoader().load(
  ENV_URL,
  (img) => {
    envImage = img
    envDirty = true
  },
  undefined,
  () => {}, // no photo: the procedural room stays
)

// --- the light rig: turns with the camera so the lamp is always behind the bit --------------------------------
// local frame: the camera is at +z, the lamp at −z
const rig = new THREE.Group()
scene.add(rig)
const rect = (w: number, h: number, colour: THREE.Color, intensity: number, x: number, y: number, z: number) => {
  const l = new THREE.RectAreaLight(colour, intensity, w, h)
  l.position.set(x, y, z)
  rig.add(l)
  l.lookAt(0, 0.5, 0)
  return l
}
rect(2.4, 1.8, new THREE.Color(1, 0.94, 0.86), 2.4, 0.7, 0.95, -1.3) // the lamp: rim from behind, high right
rect(1.4, 2.2, new THREE.Color(1, 0.95, 0.9), 1.5, -1.1, 0.55, -1.1) // second rim, low left
rect(1.6, 1.6, new THREE.Color(0.85, 0.92, 1.0), 0.45, -1.6, 1.4, 1.8) // cool front fill
rect(0.5, 2.0, white(1), 1.0, 1.7, 0.7, 0.2) // side strip, to reveal bevels

// the lamp itself: a bright soft disc behind the bit, so bloom wraps the silhouette
const lamp = new THREE.Mesh(
  new THREE.PlaneGeometry(2.6, 2.6),
  new THREE.ShaderMaterial({
    uniforms: { color: { value: LOOK.lamp } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * 2.0;
        float r2 = dot(c, c);
        float a = exp(-r2 * 6.0) * (1.0 - smoothstep(0.7, 1.0, r2));
        gl_FragColor = vec4(color * a, 1.0);
      }`,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }),
)
lamp.position.set(0.25, 1.08, -1.7) // its core just above the tip, so the halo rims the top and falls off down the bit
lamp.renderOrder = -1
rig.add(lamp)

// the shadow: a spot aligned with the lamp, so the cast shadow falls toward the camera
const spot = new THREE.SpotLight(0xfff0dc, 3, 0, 0.5, 0.6, 2)
spot.position.set(0.35, 1.7, -1.9)
spot.castShadow = true
spot.shadow.mapSize.set(narrow ? 512 : 1024, narrow ? 512 : 1024)
spot.shadow.radius = 4
spot.shadow.blurSamples = 8
spot.shadow.bias = -0.0004
spot.shadow.camera.near = 0.5
spot.shadow.camera.far = 8
rig.add(spot)
spot.target.position.set(0, 0.25, 0)
rig.add(spot.target)

const camera = new THREE.PerspectiveCamera(LOOK.fov, 1, 0.01, 100)
const TARGET = new THREE.Vector3(0, 0.44, 0)
{
  // roughly 38% of the frame: distance so that 1 unit spans that fraction at the given FOV
  const d = 1 / (LOOK.bitFraction * 2 * Math.tan((LOOK.fov * Math.PI) / 360))
  const s = new THREE.Spherical(d, (68 * Math.PI) / 180, (22 * Math.PI) / 180)
  camera.position.setFromSpherical(s).add(TARGET)
}

// --- the steel -----------------------------------------------------------------------------------------------
// the micro-surface, packed: R,G = tangent normal xy; B = height (speckle); A = low-frequency variation
function packDetail(height: Float32Array, W: number, H: number) {
  // centre the height on 0.5
  let mean = 0
  for (let i = 0; i < height.length; i++) mean += height[i]
  mean /= height.length
  const h = height.map((v) => Math.min(1, Math.max(0, v - mean + 0.5)))
  // a wide box blur, separable and wrapping, for the low-frequency channel
  const R = 14
  const tmp = new Float32Array(W * H)
  const low = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    let acc = 0
    for (let k = -R; k <= R; k++) acc += h[y * W + ((k + W) % W)]
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = acc / (2 * R + 1)
      acc += h[y * W + ((x + R + 1) % W)] - h[y * W + ((x - R + W) % W)]
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0
    for (let k = -R; k <= R; k++) acc += tmp[((k + H) % H) * W + x]
    for (let y = 0; y < H; y++) {
      low[y * W + x] = acc / (2 * R + 1)
      acc += tmp[((y + R + 1) % H) * W + x] - tmp[((y - R + H) % H) * W + x]
    }
  }
  // stretch the low channel so its variation is usable
  let lmin = 1
  let lmax = 0
  for (let i = 0; i < low.length; i++) {
    if (low[i] < lmin) lmin = low[i]
    if (low[i] > lmax) lmax = low[i]
  }
  const data = new Uint8Array(W * H * 4)
  const K = 7 // height → slope
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const dx = h[y * W + ((x + 1) % W)] - h[y * W + ((x - 1 + W) % W)]
      const dy = h[((y + 1) % H) * W + x] - h[((y - 1 + H) % H) * W + x]
      const nx = -dx * K
      const ny = -dy * K
      const nl = Math.sqrt(nx * nx + ny * ny + 1)
      data[i * 4] = (nx / nl) * 127.5 + 127.5
      data[i * 4 + 1] = (ny / nl) * 127.5 + 127.5
      data[i * 4 + 2] = h[i] * 255
      data[i * 4 + 3] = ((low[i] - lmin) / (lmax - lmin || 1)) * 255
    }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat)
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping // the photo is not guaranteed seamless
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.generateMipmaps = true
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  t.needsUpdate = true
  return t
}
// procedural bead-blast: a dense fine speckle over soft value noise, with a faint lengthwise grain
function proceduralGrain(W: number) {
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const h = new Float32Array(W * W)
  const octave = (cells: number, amp: number) => {
    const g = new Float32Array(cells * cells)
    for (let i = 0; i < g.length; i++) g[i] = rnd()
    const sm = (t: number) => t * t * (3 - 2 * t)
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const fx = (x / W) * cells
        const fy = (y / W) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = sm(fx - x0)
        const ty = sm(fy - y0)
        const v = (xx: number, yy: number) => g[(yy % cells) * cells + (xx % cells)]
        const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * tx
        const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * tx
        h[y * W + x] += (a + (b - a) * ty - 0.5) * amp
      }
  }
  octave(8, 0.1)
  octave(32, 0.08)
  octave(128, 0.1)
  for (let i = 0; i < h.length; i++) h[i] += (rnd() - 0.5) * 0.22 + 0.5 // the speckle
  for (let y = 0; y < W; y++) {
    // faint vertical grain (along the bit's axis)
    seed = 5
  }
  const streak = new Float32Array(W)
  for (let x = 0; x < W; x++) streak[x] = (rnd() - 0.5) * 0.05
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) h[y * W + x] += streak[x]
  return packDetail(h, W, W)
}
let detail = proceduralGrain(512)
new THREE.ImageLoader().load(
  GRAIN_URL,
  (img) => {
    const W = img.width
    const H = img.height
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    g.drawImage(img, 0, 0)
    const px = g.getImageData(0, 0, W, H).data
    const h = new Float32Array(W * H)
    for (let i = 0; i < h.length; i++) h[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255
    const t = packDetail(h, W, H)
    detail.dispose()
    detail = t
    steelUniforms.detailMap.value = t
  },
  undefined,
  () => {}, // no photo: the procedural grain stays
)

const steel = new THREE.MeshStandardMaterial({
  color: LOOK.steel.color, // medium grey tool steel
  metalness: 1,
  roughness: LOOK.steel.roughness,
  envMapIntensity: LOOK.steel.envMapIntensity,
})
const steelUniforms = {
  detailMap: { value: detail as THREE.Texture },
  detailScale: { value: LOOK.detail.scale },
  detailNormal: { value: LOOK.detail.normal },
  roughVar: { value: LOOK.detail.roughVar },
  albedoVar: { value: LOOK.detail.albedoVar },
  wearWidth: { value: LOOK.detail.wearWidth },
  wearAmount: { value: LOOK.detail.wearAmount },
  aniso: { value: LOOK.detail.aniso },
  axisView: { value: new THREE.Vector3(0, 1, 0) },
  envRot: { value: new THREE.Matrix3() },
  objToView: { value: new THREE.Matrix3() },
}
steel.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, steelUniforms)
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`,
    )
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n vObjNormal = objectNormal;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>\n vObjPos = position; vEdgeDist = edgeDist;`)
  // the environment, rotated: the room turns with the camera so the lamp stays behind the bit
  const envChunk = THREE.ShaderChunk.envmap_physical_pars_fragment
    .replace('vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );', 'vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );')
    .replace('reflectVec = inverseTransformDirection( reflectVec, viewMatrix );', 'reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );')
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
      uniform sampler2D detailMap; uniform float detailScale, detailNormal, roughVar, albedoVar, wearWidth, wearAmount, aniso;
      uniform vec3 axisView;
      uniform mat3 envRot; uniform mat3 objToView;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`,
    )
    .replace('#include <envmap_physical_pars_fragment>', envChunk)
    .replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // triplanar micro-surface in object space: no seam, grain along the axis on the flats
      vec3 tw = abs(normalize(vObjNormal)); tw = tw * tw * tw * tw; tw /= (tw.x + tw.y + tw.z);
      vec4 dX = texture2D(detailMap, vObjPos.zy * detailScale + vec2(0.13, 0.0));
      vec4 dY = texture2D(detailMap, vObjPos.xz * detailScale + vec2(0.41, 0.37));
      vec4 dZ = texture2D(detailMap, vObjPos.xy * detailScale + vec2(0.77, 0.0));
      vec4 det = dX * tw.x + dY * tw.y + dZ * tw.z;
      // the same texture at a coarser scale: the mottling one can actually see at this distance
      float mottle = texture2D(detailMap, vObjPos.zy * detailScale * 0.21 + 0.5).a * tw.x + texture2D(detailMap, vObjPos.xz * detailScale * 0.21).a * tw.y + texture2D(detailMap, vObjPos.xy * detailScale * 0.21 + 0.25).a * tw.z;
      vec2 nX = dX.xy * 2.0 - 1.0, nY = dY.xy * 2.0 - 1.0, nZ = dZ.xy * 2.0 - 1.0;
      vec3 pert = tw.x * vec3(0.0, nX.y, nX.x) + tw.y * vec3(nY.x, 0.0, nY.y) + tw.z * vec3(nZ.x, nZ.y, 0.0);
      // wear: the sharp edges, worn smoother and brighter, patchily
      float edgeD = min(vEdgeDist.x, min(vEdgeDist.y, vEdgeDist.z));
      float wear = (1.0 - smoothstep(0.0, wearWidth, edgeD)) * smoothstep(0.25, 0.8, det.a + 0.25) * wearAmount;
      diffuseColor.rgb *= (1.0 + (det.a - 0.5) * albedoVar + (mottle - 0.5) * albedoVar * 0.8 + (det.b - 0.5) * albedoVar * 0.5) * (1.0 + 0.18 * wear);`,
    )
    .replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.12 - 0.06 * wear, 0.08, 1.0);`,
    )
    .replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      normal = normalize(normal + objToView * pert * detailNormal * (1.0 - 0.6 * wear));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`,
    )
}

// flat STL facets → creased normals: a vertex takes the average of the faces around it that lie within
// CREASE of its own face, so turned surfaces go smooth and real edges stay sharp
function faceNormals(pos: THREE.BufferAttribute) {
  const faceN: THREE.Vector3[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let f = 0; f < pos.count / 3; f++) {
    a.fromBufferAttribute(pos, f * 3)
    b.fromBufferAttribute(pos, f * 3 + 1)
    c.fromBufferAttribute(pos, f * 3 + 2)
    faceN.push(new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize())
  }
  return faceN
}
const vkey = (pos: THREE.BufferAttribute, i: number) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`

function creased(geo: THREE.BufferGeometry, creaseDeg: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const faceN = faceNormals(pos)
  const around = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    const k = vkey(pos, i)
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
    for (const f of around.get(vkey(pos, i))!) if (faceN[f].dot(own) >= cos) sum.add(faceN[f])
    sum.normalize()
    normals[i * 3] = sum.x
    normals[i * 3 + 1] = sum.y
    normals[i * 3 + 2] = sum.z
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
}

// per-triangle distances to its sharp edges (dihedral above SHARP): component e of the attribute is 0 on
// edge e's two vertices and the triangle's height on the third, so it interpolates to the distance from
// that edge; edges that are not sharp get a large constant. The shader takes the minimum.
function edgeDistances(geo: THREE.BufferGeometry, sharpDeg: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const faceN = faceNormals(pos)
  const across = new Map<string, number[]>()
  const ekey = (i: number, j: number) => {
    const a = vkey(pos, i)
    const b = vkey(pos, j)
    return a < b ? `${a}|${b}` : `${b}|${a}`
  }
  for (let f = 0; f < n / 3; f++)
    for (let e = 0; e < 3; e++) {
      const k = ekey(f * 3 + e, f * 3 + ((e + 1) % 3))
      const list = across.get(k)
      if (list) list.push(f)
      else across.set(k, [f])
    }
  const cos = Math.cos((sharpDeg * Math.PI) / 180)
  const out = new Float32Array(n * 3).fill(10)
  const p0 = new THREE.Vector3()
  const p1 = new THREE.Vector3()
  const p2 = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  for (let f = 0; f < n / 3; f++)
    for (let e = 0; e < 3; e++) {
      const i0 = f * 3 + e
      const i1 = f * 3 + ((e + 1) % 3)
      const i2 = f * 3 + ((e + 2) % 3)
      const others = across.get(ekey(i0, i1))!
      let sharp = false
      for (const g of others) if (g !== f && faceN[g].dot(faceN[f]) < cos) sharp = true
      if (!sharp) continue
      p0.fromBufferAttribute(pos, i0)
      p1.fromBufferAttribute(pos, i1)
      p2.fromBufferAttribute(pos, i2)
      ab.subVectors(p1, p0)
      ac.subVectors(p2, p0)
      const h = ab.clone().cross(ac).length() / (ab.length() || 1)
      out[i0 * 3 + e] = 0
      out[i1 * 3 + e] = 0
      out[i2 * 3 + e] = h
    }
  geo.setAttribute('edgeDist', new THREE.BufferAttribute(out, 3))
}

// --- the floor: invisible, catches the cast shadow; plus a tight contact darkening under the base --------------
function contactTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.55)')
  grad.addColorStop(0.45, 'rgba(0,0,0,0.25)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ color: 0x1a1612, opacity: 0.5, depthWrite: false }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)
const contact = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false }))
contact.rotation.x = -Math.PI / 2
contact.position.y = 0.0005
scene.add(contact)

const group = new THREE.Group()
scene.add(group)

new STLLoader().load('/assets/models/bit.stl', (geo) => {
  // OpenSCAD is z-up in mm: stand it up (y-up), base on the floor, centred on its axis, 1 unit = its height
  geo.rotateX(-Math.PI / 2)
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  const size = new THREE.Vector3()
  bb.getSize(size)
  const s = 1 / size.y
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2)
  geo.scale(s, s, s)
  creased(geo, 32)
  edgeDistances(geo, 18)
  const mesh = new THREE.Mesh(geo, steel)
  mesh.castShadow = true
  steelUniforms.objToView.value = mesh.normalMatrix // kept current by the renderer each frame
  group.add(mesh)
  controls.target.copy(TARGET)
  controls.update()
})

// --- turning it -----------------------------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas)
controls.target.copy(TARGET)
controls.enablePan = false
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.rotateSpeed = 0.7
controls.minDistance = 1.3
controls.maxDistance = 4.5
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

// --- the camera's pipeline: barrel + CA, vignette, ACES, unsharp mask, sensor noise, sRGB ------------------------
const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    shake: { value: new THREE.Vector2() },
    barrel: { value: LOOK.lens.barrel },
    ca: { value: LOOK.lens.ca },
    vignette: { value: LOOK.lens.vignette },
    sharpen: { value: LOOK.lens.sharpen },
    sharpenClamp: { value: LOOK.lens.sharpenClamp },
    noise: { value: new THREE.Vector4(LOOK.noise.shadows, LOOK.noise.highlights, LOOK.noise.chroma, LOOK.noise.fixed) },
    noiseHz: { value: LOOK.noise.hz },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tBloom;
    uniform vec2 resolution, shake;
    uniform float time, barrel, ca, vignette, sharpen, sharpenClamp, noiseHz;
    uniform vec4 noise; // shadows, highlights, chroma, fixed-pattern share
    varying vec2 vUv;

    // ACES filmic as three.js has it (Stephen Hill's fit), exposure folded in
    vec3 aces(vec3 c) {
      c *= 1.0 / 0.6;
      c = vec3(0.59719 * c.r + 0.35458 * c.g + 0.04823 * c.b,
               0.07600 * c.r + 0.90834 * c.g + 0.01566 * c.b,
               0.02840 * c.r + 0.13383 * c.g + 0.83777 * c.b);
      c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
      c = vec3(1.60475 * c.r - 0.53108 * c.g - 0.07367 * c.b,
              -0.10208 * c.r + 1.10813 * c.g - 0.00605 * c.b,
              -0.00327 * c.r - 0.07276 * c.g + 1.07602 * c.b);
      return clamp(c, 0.0, 1.0);
    }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    // hash without sine (Dave Hoskins): behaves on low-precision GPUs
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

    float aspect() { return resolution.x / resolution.y; }
    // a trace of barrel: the source is sampled a little further out toward the corners, the whole
    // rescaled so the corners stay inside the frame
    vec2 distort(vec2 uv) {
      vec2 c = (uv - 0.5) * vec2(aspect(), 1.0);
      float corner = 0.25 * (aspect() * aspect() + 1.0);
      c *= (1.0 + barrel * dot(c, c)) / (1.0 + barrel * corner);
      return c / vec2(aspect(), 1.0) + 0.5;
    }
    vec3 hdr(vec2 uv) { return texture2D(tDiffuse, uv).rgb + texture2D(tBloom, uv).rgb; }
    vec3 tap(vec2 uv) { return aces(hdr(distort(uv) + shake)); }

    void main() {
      vec2 px = 1.0 / resolution;
      vec2 c = (vUv - 0.5) * vec2(aspect(), 1.0);
      float corner = 0.25 * (aspect() * aspect() + 1.0);
      float r2 = dot(c, c) / corner; // 0 centre … 1 corners

      // centre tap with radial chromatic aberration, tiny
      vec2 duv = distort(vUv) + shake;
      vec2 off = (duv - 0.5) * ca * (0.3 + r2);
      vec3 col = aces(vec3(hdr(duv + off).r, hdr(duv).g, hdr(duv - off).b));

      // ISP sharpening: a 1 px unsharp mask on luma, clamped so the halos stay thin
      float lc = luma(col);
      float ln = (luma(tap(vUv + vec2(px.x, 0.0))) + luma(tap(vUv - vec2(px.x, 0.0))) + luma(tap(vUv + vec2(0.0, px.y))) + luma(tap(vUv - vec2(0.0, px.y)))) * 0.25;
      col += clamp((lc - ln) * sharpen, -sharpenClamp, sharpenClamp);

      // vignette
      col *= 1.0 - vignette * smoothstep(0.15, 1.0, r2);

      col = srgb(col);

      // sensor noise: luma, heavier in the shadows; a little chroma; mostly temporal at noiseHz, a fixed
      // pattern underneath
      float tick = floor(time * noiseHz);
      vec2 fp = gl_FragCoord.xy;
      vec2 seed = fp + vec2(tick * 13.37, tick * 7.91);
      float nT = hash(seed) + hash(seed + 41.0) - 1.0; // triangular, RMS 0.408
      float nF = hash(fp) + hash(fp + 17.0) - 1.0;
      float n = ((1.0 - noise.w) * nT + noise.w * nF) / 0.408;
      float sigma = mix(noise.x, noise.y, smoothstep(0.05, 0.9, luma(col)));
      vec2 cell = floor(fp / 3.0) + tick * 5.3; // chroma in 3 px blotches, as denoised video has it
      vec3 chroma = (vec3(hash(cell + 3.0), hash(cell + 5.0), hash(cell + 9.0)) - 0.5) / 0.29;
      col += n * sigma + chroma * noise.z;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

// UnrealBloomPass, forked: it only produces its bloom texture (half-float, at 60% of the frame) and the
// lens pass adds it before tone mapping. r137's own pass blends additively back into the read buffer,
// which is our multisampled target, whose colour buffer r137 invalidates after every resolve.
class BloomTexturePass extends UnrealBloomPass {
  constructor(strength: number, radius: number, threshold: number) {
    super(new THREE.Vector2(2, 2), strength, radius, threshold)
    this.needsSwap = false
    // the bright pass keeps what is ABOVE the threshold, not everything brighter than it: a 14-unit lamp
    // over a 3-unit backdrop should bloom by 11, and the backdrop itself not at all
    const hp = (this as any).materialHighPassFilter as THREE.ShaderMaterial
    hp.fragmentShader = /* glsl */ `
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`
    hp.needsUpdate = true
    if (hdr) for (const rt of [this.renderTargetBright, ...this.renderTargetsHorizontal, ...this.renderTargetsVertical]) rt.texture.type = THREE.HalfFloatType
  }
  get texture() {
    return this.renderTargetsHorizontal[0].texture
  }
  setSize(width: number, height: number) {
    super.setSize(Math.round(width * 0.6), Math.round(height * 0.6))
  }
  render(renderer: THREE.WebGLRenderer, _writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    // r137's typings leave most of the pass's internals as `object`
    const me = this as any
    renderer.getClearColor(me._oldClearColor)
    me.oldClearAlpha = renderer.getClearAlpha()
    const oldAutoClear = renderer.autoClear
    renderer.autoClear = false
    renderer.setClearColor(this.clearColor, 0)
    // 1. the bright parts
    me.highPassUniforms['tDiffuse'].value = readBuffer.texture
    me.highPassUniforms['luminosityThreshold'].value = this.threshold
    me.fsQuad.material = me.materialHighPassFilter
    renderer.setRenderTarget(this.renderTargetBright)
    renderer.clear()
    me.fsQuad.render(renderer)
    // 2. blurred down the mip chain
    let input: THREE.WebGLRenderTarget = this.renderTargetBright
    for (let i = 0; i < this.nMips; i++) {
      me.fsQuad.material = this.separableBlurMaterials[i]
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = input.texture
      this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(1, 0)
      renderer.setRenderTarget(this.renderTargetsHorizontal[i])
      renderer.clear()
      me.fsQuad.render(renderer)
      this.separableBlurMaterials[i].uniforms['colorTexture'].value = this.renderTargetsHorizontal[i].texture
      this.separableBlurMaterials[i].uniforms['direction'].value = new THREE.Vector2(0, 1)
      renderer.setRenderTarget(this.renderTargetsVertical[i])
      renderer.clear()
      me.fsQuad.render(renderer)
      input = this.renderTargetsVertical[i]
    }
    // 3. composited into renderTargetsHorizontal[0]
    me.fsQuad.material = this.compositeMaterial
    this.compositeMaterial.uniforms['bloomStrength'].value = this.strength
    this.compositeMaterial.uniforms['bloomRadius'].value = this.radius
    this.compositeMaterial.uniforms['bloomTintColors'].value = this.bloomTintColors
    renderer.setRenderTarget(this.renderTargetsHorizontal[0])
    renderer.clear()
    me.fsQuad.render(renderer)
    renderer.setClearColor(me._oldClearColor, me.oldClearAlpha)
    renderer.autoClear = oldAutoClear
  }
}

const target = new THREE.WebGLMultisampleRenderTarget(1, 1, {
  type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
  encoding: THREE.LinearEncoding,
})
target.samples = narrow ? 2 : 4
const composer = new EffectComposer(renderer, target)
composer.addPass(new RenderPass(scene, camera))
const bloom = new BloomTexturePass(LOOK.bloom.strength, LOOK.bloom.radius, LOOK.bloom.threshold)
composer.addPass(bloom)
const lens = new ShaderPass(LensShader)
lens.uniforms.tBloom.value = bloom.texture
composer.addPass(lens)

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, LOOK.maxDpr)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  composer.setPixelRatio(dpr)
  composer.setSize(w, h)
  lens.uniforms.resolution.value.set(w * dpr, h * dpr)
  camera.aspect = w / h
  camera.fov = w < h ? LOOK.fov - 5 : LOOK.fov // portrait: a touch tighter, the bit a little larger
  camera.updateProjectionMatrix()
}

const envRotM4 = new THREE.Matrix4()
function frame(t: number) {
  if (!envBaked || envDirty) bakeEnvironment()
  if (!controls.autoRotate && t - lastInput > 4000) controls.autoRotate = true
  controls.update()
  // the lamp, the rig and the room follow the camera's azimuth: the light stays behind the bit
  const az = controls.getAzimuthalAngle()
  rig.rotation.y = az
  steelUniforms.envRot.value.setFromMatrix4(envRotM4.makeRotationY(-az))
  camera.updateMatrixWorld()
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
  steelUniforms.axisView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse)
  const s = t / 1000
  lens.uniforms.time.value = s
  // handheld: a slow sub-pixel wander
  lens.uniforms.shake.value.set(0.0009 * Math.sin(s * 1.7) + 0.0005 * Math.sin(s * 4.3 + 1.0), 0.0007 * Math.sin(s * 1.1 + 2.0) + 0.0004 * Math.sin(s * 5.1))
  composer.render()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
;(window as any).__bit = { // a handle for poking at it from the console
   scene, renderer, composer, bloom, lens, steel, steelUniforms, lamp, rig, floor, contact, camera, controls, LOOK, THREE }
