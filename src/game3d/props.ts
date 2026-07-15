import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// Procedural props — every mesh in the game is built from primitives + canvas
// textures. No external assets (works offline / behind strict CSP).
// ─────────────────────────────────────────────────────────────────────────────

const lambert = (color: number, opts: Partial<THREE.MeshLambertMaterialParameters> = {}) =>
  new THREE.MeshLambertMaterial({ color, ...opts })

// ── Canvas-texture helper ───────────────────────────────────────────────────
function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}

// ── Vehicles ────────────────────────────────────────────────────────────────
export type CarVariant = 'car' | 'kei' | 'taxi' | 'truck' | 'bus' | 'scooter' | 'player'

export interface VehicleDims { len: number; radius: number }

// Collision radii are width-biased rather than length-biased: a head-on pass
// in a 5.2 m narrow street must clear (player at t −1.3 vs kei at +1.3 is a
// 2.6 m gap), while junction T-bones are still caught by the circle overlap.
export const VEHICLE_DIMS: Record<CarVariant, VehicleDims> = {
  player:  { len: 4.2, radius: 1.0 },
  car:     { len: 4.2, radius: 1.1 },
  kei:     { len: 3.2, radius: 1.0 },
  taxi:    { len: 4.3, radius: 1.1 },
  truck:   { len: 6.2, radius: 1.5 },
  bus:     { len: 9.0, radius: 1.9 },
  scooter: { len: 1.9, radius: 0.6 },
}

function wheels(group: THREE.Group, len: number, width: number, r = 0.34) {
  const geo = new THREE.CylinderGeometry(r, r, 0.28, 10)
  const mat = lambert(0x1a1a1a)
  const dx = width / 2 - 0.02
  const dz = len / 2 - r * 1.9
  for (const [x, z] of [[-dx, -dz], [dx, -dz], [-dx, dz], [dx, dz]]) {
    const w = new THREE.Mesh(geo, mat)
    w.rotation.z = Math.PI / 2
    w.position.set(x, r, z)
    group.add(w)
  }
}

function blobShadow(group: THREE.Group, rx: number, rz: number) {
  const geo = new THREE.CircleGeometry(1, 18)
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  const m = new THREE.Mesh(geo, mat)
  m.rotation.x = -Math.PI / 2
  m.scale.set(rx, rz, 1)
  m.position.y = 0.02
  group.add(m)
}

// Builds a vehicle facing -Z (the engine's "forward").
export function buildVehicle(variant: CarVariant, color: number): THREE.Group {
  const g = new THREE.Group()

  if (variant === 'scooter') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 1.7), lambert(color))
    body.position.y = 0.55
    const rider = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.45), lambert(0x37474f))
    rider.position.set(0, 1.15, 0.15)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), lambert(0xefe0c9))
    head.position.set(0, 1.65, 0.15)
    g.add(body, rider, head)
    blobShadow(g, 0.5, 1.1)
    return g
  }

  if (variant === 'bus') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 9), lambert(color))
    body.position.y = 1.45
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.5, 9.02), lambert(0xf5f5f5))
    stripe.position.y = 1.85
    g.add(body, stripe)
    wheels(g, 9, 2.3, 0.42)
    blobShadow(g, 1.5, 4.8)
    return g
  }

  if (variant === 'truck') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.9, 1.8), lambert(color))
    cab.position.set(0, 1.2, -2.1)
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.05, 2.1, 4.0), lambert(0xdddddd))
    cargo.position.set(0, 1.4, 0.9)
    g.add(cab, cargo)
    wheels(g, 6.2, 2.0, 0.4)
    blobShadow(g, 1.3, 3.3)
    return g
  }

  // car / kei / taxi / player
  const len = variant === 'kei' ? 3.2 : 4.25
  const wid = variant === 'kei' ? 1.55 : 1.75
  const body = new THREE.Mesh(new THREE.BoxGeometry(wid, 0.62, len), lambert(color))
  body.position.y = 0.55
  const cabinLen = variant === 'kei' ? 1.7 : 2.0
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.22, 0.55, cabinLen), lambert(0x263238))
  cabin.position.set(0, 1.08, variant === 'kei' ? 0.05 : 0.15)
  g.add(body, cabin)

  // headlights / taillights
  const hl = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.3, 0.12, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xfff59d }))
  hl.position.set(0, 0.62, -len / 2 - 0.02)
  const tl = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.3, 0.1, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xd32f2f }))
  tl.position.set(0, 0.6, len / 2 + 0.02)
  g.add(hl, tl)

  if (variant === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.3), lambert(0xffeb3b, { emissive: 0x665500 }))
    sign.position.set(0, 1.48, 0.1)
    g.add(sign)
  }
  wheels(g, len, wid)
  blobShadow(g, wid * 0.62, len * 0.55)
  return g
}

// ── Buildings & greenery ────────────────────────────────────────────────────
export type ZoneStyle = 'naha' | 'school' | 'oldtown' | 'route58' | 'expressway' | 'mihama'

const ZONE_PALETTES: Record<ZoneStyle, number[]> = {
  naha:       [0xcfd8dc, 0xb0bec5, 0xd7ccc8, 0xbcaaa4, 0xeceff1],
  school:     [0xfff3e0, 0xffe0b2, 0xf5f5f5],
  oldtown:    [0xefebe9, 0xd7ccc8, 0xf5f0e8],
  route58:    [0xb0bec5, 0x90a4ae, 0xcfd8dc, 0xa1887f],
  expressway: [],
  mihama:     [0xff8a65, 0x4dd0e1, 0xfff176, 0xaed581, 0xf48fb1, 0x9575cd],
}

export function buildBuilding(zone: ZoneStyle, rnd: () => number): THREE.Group {
  const g = new THREE.Group()
  const palette = ZONE_PALETTES[zone]
  if (palette.length === 0) return g
  const color = palette[Math.floor(rnd() * palette.length)]

  const w = 6 + rnd() * 8
  const d = 6 + rnd() * 8
  let h: number
  if (zone === 'naha') h = 8 + rnd() * 18
  else if (zone === 'route58') h = 7 + rnd() * 12
  else if (zone === 'mihama') h = 4 + rnd() * 5
  else h = 3.5 + rnd() * 4

  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color))
  box.position.y = h / 2
  g.add(box)

  // window strips for taller buildings
  if (h > 8) {
    const winMat = new THREE.MeshBasicMaterial({ color: 0x36474f })
    const floors = Math.floor(h / 3)
    for (let i = 1; i <= floors; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.8, d + 0.06), winMat)
      strip.position.y = i * (h / (floors + 1))
      g.add(strip)
    }
  }

  // Okinawan red-tile roof for the low old-town houses
  if (zone === 'oldtown' || (zone === 'school' && rnd() < 0.5)) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.8, 4), lambert(0xb5533c))
    roof.position.y = h + 0.9
    roof.rotation.y = Math.PI / 4
    g.add(roof)
  }
  return g
}

export function buildPalm(rnd: () => number): THREE.Group {
  const g = new THREE.Group()
  const h = 3.4 + rnd() * 2.2
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 6), lambert(0x8d6e63))
  trunk.position.y = h / 2
  g.add(trunk)
  const leafMat = lambert(0x2e7d32)
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.4, 5), leafMat)
    const a = (i / 6) * Math.PI * 2
    leaf.position.set(Math.cos(a) * 0.85, h + 0.15, Math.sin(a) * 0.85)
    leaf.rotation.z = Math.cos(a) * 1.25
    leaf.rotation.x = -Math.sin(a) * 1.25
    g.add(leaf)
  }
  return g
}

// ── Traffic signal (Japanese horizontal: 青・黄・赤 left→right) ──────────────
export interface SignalHandle {
  group: THREE.Group
  setState: (color: 'green' | 'yellow' | 'red' | 'off', arrowRight?: boolean) => void
}

export function buildSignal(withArrow: boolean): SignalHandle {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.4, 8), lambert(0x9e9e9e))
  pole.position.y = 2.7
  g.add(pole)
  // horizontal arm over the road (toward -x in local space)
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), lambert(0x9e9e9e))
  arm.rotation.z = Math.PI / 2
  arm.position.set(-1.7, 5.15, 0)
  g.add(arm)

  const housing = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.6, 0.3), lambert(0x37474f))
  housing.position.set(-2.6, 4.85, 0)
  g.add(housing)

  const lampGeo = new THREE.CircleGeometry(0.2, 14)
  const mk = (offX: number, base: number) => {
    const m = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: base }))
    m.position.set(-2.6 + offX, 4.85, 0.16)
    g.add(m)
    return m
  }
  const gLamp = mk(-0.52, 0x0a3d24)
  const yLamp = mk(0, 0x4d3a00)
  const rLamp = mk(0.52, 0x4a0f0f)

  let aLamp: THREE.Mesh | null = null
  if (withArrow) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.28), lambert(0x263238))
    box.position.set(-2.08, 4.32, 0)
    g.add(box)
    const tex = canvasTexture(64, 64, (ctx) => {
      ctx.fillStyle = '#0f1a12'
      ctx.fillRect(0, 0, 64, 64)
      ctx.fillStyle = '#2eff6a'
      ctx.beginPath()
      ctx.moveTo(46, 32); ctx.lineTo(26, 16); ctx.lineTo(26, 26); ctx.lineTo(14, 26)
      ctx.lineTo(14, 38); ctx.lineTo(26, 38); ctx.lineTo(26, 48)
      ctx.closePath(); ctx.fill()
    })
    aLamp = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), new THREE.MeshBasicMaterial({ map: tex }))
    aLamp.position.set(-2.08, 4.32, 0.15)
    aLamp.visible = false
    g.add(aLamp)
  }

  const setState = (color: 'green' | 'yellow' | 'red' | 'off', arrowRight = false) => {
    ;(gLamp.material as THREE.MeshBasicMaterial).color.setHex(color === 'green' ? 0x2eff6a : 0x0a3d24)
    ;(yLamp.material as THREE.MeshBasicMaterial).color.setHex(color === 'yellow' ? 0xffd54f : 0x4d3a00)
    ;(rLamp.material as THREE.MeshBasicMaterial).color.setHex(color === 'red' ? 0xff5252 : 0x4a0f0f)
    if (aLamp) aLamp.visible = arrowRight
  }
  setState('off')
  return { group: g, setState }
}

// ── Road signs ──────────────────────────────────────────────────────────────
function signPole(height: number): THREE.Mesh {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, height, 6), lambert(0xbdbdbd))
  pole.position.y = height / 2
  return pole
}

export function buildStopSign(): THREE.Group {
  const g = new THREE.Group()
  g.add(signPole(2.2))
  const tex = canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128)
    ctx.fillStyle = '#c62828'
    ctx.beginPath()
    ctx.moveTo(64, 118); ctx.lineTo(6, 18); ctx.lineTo(122, 18)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('止まれ', 64, 52)
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }))
  face.position.y = 2.0
  g.add(face)
  return g
}

export function buildSpeedSign(limit: number): THREE.Group {
  const g = new THREE.Group()
  g.add(signPole(2.4))
  const tex = canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128)
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 12
    ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#1565c0'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(String(limit), 64, 68)
  })
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
  face.position.y = 2.25
  g.add(face)
  return g
}

export function buildNoEntrySign(): THREE.Group {
  const g = new THREE.Group()
  g.add(signPole(2.3))
  const tex = canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128)
    ctx.fillStyle = '#d32f2f'
    ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillRect(18, 52, 92, 24)
  })
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
  face.position.y = 2.15
  g.add(face)
  return g
}

export function buildOneWaySign(): THREE.Group {
  const g = new THREE.Group()
  g.add(signPole(2.3))
  const tex = canvasTexture(160, 80, (ctx) => {
    ctx.fillStyle = '#1565c0'
    ctx.fillRect(0, 0, 160, 80)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(140, 40); ctx.lineTo(96, 12); ctx.lineTo(96, 28); ctx.lineTo(20, 28)
    ctx.lineTo(20, 52); ctx.lineTo(96, 52); ctx.lineTo(96, 68)
    ctx.closePath(); ctx.fill()
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('一方通行', 80, 76)
  })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
  face.position.y = 2.1
  g.add(face)
  return g
}

// ── ETC toll gate ───────────────────────────────────────────────────────────
export interface TollHandle {
  group: THREE.Group
  bar: THREE.Group // rotate .rotation.z: 0 = closed (horizontal), -π/2 ≈ open
}

export function buildTollGate(roadHalf: number): TollHandle {
  const g = new THREE.Group()
  const pillarGeo = new THREE.BoxGeometry(0.7, 5.2, 0.9)
  const pl = new THREE.Mesh(pillarGeo, lambert(0x546e7a))
  pl.position.set(-roadHalf - 0.8, 2.6, 0)
  const pr = new THREE.Mesh(pillarGeo, lambert(0x546e7a))
  pr.position.set(roadHalf + 0.8, 2.6, 0)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(roadHalf * 2 + 3.2, 0.7, 2.2), lambert(0x455a64))
  roof.position.y = 5.2
  const tex = canvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = '#1b5e20'; ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('ETC 20', 128, 34)
  })
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshBasicMaterial({ map: tex }))
  board.position.set(0, 4.4, -1.15)
  g.add(pl, pr, roof, board)

  // pivoted bar on the left pillar
  const bar = new THREE.Group()
  const stick = new THREE.Mesh(new THREE.BoxGeometry(roadHalf * 2 + 1.0, 0.14, 0.14),
    new THREE.MeshBasicMaterial({ color: 0xffeb3b }))
  stick.position.x = roadHalf + 0.5 // extends to the right from the pivot
  bar.add(stick)
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.15), new THREE.MeshBasicMaterial({ color: 0xd32f2f }))
    s.position.x = 0.8 + i * 1.8
    bar.add(s)
  }
  bar.position.set(-roadHalf - 0.4, 1.15, 0)
  g.add(bar)
  return { group: g, bar }
}

// ── Goal gate & Ferris wheel ───────────────────────────────────────────────
export function buildGoalGate(roadHalf: number): THREE.Group {
  const g = new THREE.Group()
  const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.6, 10)
  const p1 = new THREE.Mesh(postGeo, lambert(0xffffff))
  p1.position.set(-roadHalf - 0.6, 2.8, 0)
  const p2 = new THREE.Mesh(postGeo, lambert(0xffffff))
  p2.position.set(roadHalf + 0.6, 2.8, 0)
  const tex = canvasTexture(512, 96, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 512, 0)
    grad.addColorStop(0, '#FF6B35'); grad.addColorStop(1, '#1A4E8C')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 96)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 52px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('GOAL ゴール', 256, 50)
  })
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(roadHalf * 2 + 1.2, 1.35),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
  banner.position.y = 4.9
  g.add(p1, p2, banner)
  return g
}

export function buildFerrisWheel(): { group: THREE.Group; wheel: THREE.Group } {
  const g = new THREE.Group()
  const legMat = lambert(0x90a4ae)
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 20, 8), legMat)
    leg.position.set(side * 4, 10, 0)
    leg.rotation.z = side * 0.32
    g.add(leg)
  }
  const wheel = new THREE.Group()
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.35, 10, 36), lambert(0xff7043))
  wheel.add(rim)
  const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 22, 6)
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(spokeGeo, legMat)
    s.rotation.z = (i / 6) * Math.PI
    wheel.add(s)
  }
  const cabColors = [0xef5350, 0xffca28, 0x66bb6a, 0x42a5f5, 0xab47bc, 0xff7043]
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.5), lambert(cabColors[i % 6]))
    cab.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0)
    wheel.add(cab)
  }
  wheel.position.y = 19
  g.add(wheel)
  return { group: g, wheel }
}

// ── Street light (highway) ─────────────────────────────────────────────────
export function buildStreetLight(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 7.5, 6), lambert(0x9e9e9e))
  pole.position.y = 3.75
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), lambert(0x9e9e9e))
  arm.rotation.z = Math.PI / 2
  arm.position.set(-1.3, 7.4, 0)
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.35), new THREE.MeshBasicMaterial({ color: 0xfff9c4 }))
  lamp.position.set(-2.4, 7.3, 0)
  g.add(pole, arm, lamp)
  return g
}
