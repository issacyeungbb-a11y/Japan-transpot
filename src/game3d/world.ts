import * as THREE from 'three'
import type { LegFrame } from '../course/geometry'
import { JUNCTION, STOP_BEFORE, worldOf } from '../course/geometry'
import {
  buildBuilding, buildPalm, buildSignal, buildStopSign, buildSpeedSign,
  buildNoEntrySign, buildOneWaySign, buildTollGate, buildGoalGate,
  buildFerrisWheel, buildStreetLight,
  type SignalHandle, type TollHandle, type ZoneStyle,
} from './props'

export interface TollInfo {
  legIndex: number
  gateS: number
  handle: TollHandle
}

export interface WorldHandles {
  root: THREE.Group
  signals: Map<number, SignalHandle>
  tolls: TollInfo[]
  ferrisWheel: THREE.Group | null
}

// Deterministic PRNG so the world looks the same on every run.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ROAD_COLOR = 0x3c4043
const JUNCTION_COLOR = 0x43474b
const LINE_WHITE = 0xe8e8e8

export function buildWorld(frames: LegFrame[]): WorldHandles {
  const root = new THREE.Group()
  const signals = new Map<number, SignalHandle>()
  const tolls: TollInfo[] = []
  let ferrisWheel: THREE.Group | null = null
  const rnd = mulberry32(20260715)

  // ── Ground ────────────────────────────────────────────────────────────────
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshLambertMaterial({ color: 0x6ba368 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(150, -0.02, -450)
  root.add(ground)

  // Flat rectangle in LEG-LOCAL coordinates.
  const rect = (f: LegFrame, s0: number, s1: number, t0: number, t1: number, color: number, y: number) => {
    const w = Math.abs(t1 - t0)
    const l = Math.abs(s1 - s0)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshLambertMaterial({ color }))
    m.rotation.x = -Math.PI / 2
    m.rotation.z = -f.heading
    const c = worldOf(f, (s0 + s1) / 2, (t0 + t1) / 2)
    m.position.set(c.x, y, c.z)
    root.add(m)
    return m
  }

  // Place an object at leg-local (s, t) with its local -x pointing across the
  // road from the right and its +z face toward the approaching driver.
  const place = (obj: THREE.Object3D, f: LegFrame, s: number, t: number, yawOffset = 0) => {
    const p = worldOf(f, s, t)
    obj.position.set(p.x, 0, p.z)
    obj.rotation.y = -f.heading + yawOffset
    root.add(obj)
  }

  const zebra = (f: LegFrame, sCentre: number, t0: number, t1: number) => {
    for (let t = t0 + 0.25; t < t1 - 0.2; t += 1.0) {
      rect(f, sCentre - 1.2, sCentre + 1.2, t, t + 0.5, LINE_WHITE, 0.045)
    }
  }

  frames.forEach((f) => {
    const spec = f.spec
    const A = spec.approach
    const hasJunction = spec.junction !== 'none'
    const zone = spec.event.zone as ZoneStyle

    // ── Tarmac ──────────────────────────────────────────────────────────────
    rect(f, -2, hasJunction ? A : f.length + 2, f.tMin, f.tMax, ROAD_COLOR, 0.0)

    if (hasJunction) {
      // Junction pad + crossing-road arms
      rect(f, A, A + JUNCTION, -JUNCTION / 2, JUNCTION / 2, JUNCTION_COLOR, 0.0)
      const jc = f.junctionS
      rect(f, jc - 3.5, jc + 3.5, -50, -JUNCTION / 2, ROAD_COLOR, 0.0)
      rect(f, jc - 3.5, jc + 3.5, JUNCTION / 2, 50, ROAD_COLOR, 0.0)
      // Cross-road centre dashes
      for (let t = -46; t < -JUNCTION / 2 - 1; t += 4) rect(f, jc - 0.07, jc + 0.07, t, t + 2, LINE_WHITE, 0.04)
      for (let t = JUNCTION / 2 + 1; t < 46; t += 4) rect(f, jc - 0.07, jc + 0.07, t, t + 2, LINE_WHITE, 0.04)

      if (spec.junction === 'cross' && spec.turn !== 'straight') {
        // The ahead arm exists but is not the route.
        rect(f, A + JUNCTION, A + JUNCTION + 28, -3.5, 3.5, ROAD_COLOR, 0.0)
      }
      if (spec.junction === 't-junction') {
        // No through road: face the driver with a building.
        const b = buildBuilding(zone, rnd)
        place(b, f, A + JUNCTION + 11, 0)
      }
      // Crosswalks near & far
      zebra(f, A - 3, f.tMin, f.tMax)
      zebra(f, A + JUNCTION + 3, -3.5, 3.5)
      // Stop line (player half)
      rect(f, f.stopLineS - 0.25, f.stopLineS + 0.25, f.tMin + 0.25, -0.15, LINE_WHITE, 0.05)
    }

    // ── Lane markings on the approach ───────────────────────────────────────
    const markEnd = hasJunction ? A - STOP_BEFORE - 1 : f.length
    if (!spec.narrow) {
      for (let s = 2; s < markEnd - 2; s += 5) {
        rect(f, s, s + 2.4, -0.08, 0.08, LINE_WHITE, 0.04)
      }
    }
    rect(f, 0, markEnd, f.tMin + 0.12, f.tMin + 0.27, LINE_WHITE, 0.04)
    rect(f, 0, markEnd, f.tMax - 0.27, f.tMax - 0.12, LINE_WHITE, 0.04)

    // Bus lane paint
    if (spec.busLane) {
      rect(f, 2, A - STOP_BEFORE - 1, f.tMin + 0.3, f.tMin + 3.3, 0x2f6ea5, 0.03)
      rect(f, 2, A - STOP_BEFORE - 1, f.tMin + 3.3, f.tMin + 3.48, LINE_WHITE, 0.04)
    }

    // Mid-leg unsignalised crosswalk
    if (spec.crosswalkAtS !== undefined) {
      zebra(f, spec.crosswalkAtS, f.tMin, f.tMax)
      // advance-warning diamond (◇) before the crossing
      rect(f, spec.crosswalkAtS - 14, spec.crosswalkAtS - 11, -0.5, 0.5, LINE_WHITE, 0.04)
    }

    // ── Signals & signs ─────────────────────────────────────────────────────
    const light = spec.event.light
    if (light) {
      const sig = buildSignal(light.type === 'arrow')
      place(sig.group, f, f.stopLineS + 0.8, f.tMax + 1.1)
      signals.set(f.index, sig)
    }
    if (spec.event.stopSign) {
      place(buildStopSign(), f, f.stopLineS + 0.2, f.tMin - 1.3)
    }
    place(buildSpeedSign(spec.event.speedLimit), f, Math.min(16, f.length * 0.2), f.tMin - 1.3)

    if (spec.event.id === 'oneway-right' && hasJunction) {
      place(buildNoEntrySign(), f, f.junctionS - 1.2, -JUNCTION / 2 - 1.8, Math.PI / 2)
      place(buildOneWaySign(), f, f.stopLineS - 2, f.tMin - 1.3)
    }

    // ── Toll gate ───────────────────────────────────────────────────────────
    if (spec.tollGate) {
      const gateS = A * 0.55
      const handle = buildTollGate((f.tMax - f.tMin) / 2)
      place(handle.group, f, gateS, (f.tMin + f.tMax) / 2)
      tolls.push({ legIndex: f.index, gateS, handle })
    }

    // ── Scenery ─────────────────────────────────────────────────────────────
    if (spec.highway) {
      // guard rails + street lights, no buildings
      rect(f, 0, f.length, f.tMin - 0.75, f.tMin - 0.35, 0xb0bec5, 0.35)
      rect(f, 0, f.length, f.tMax + 0.35, f.tMax + 0.75, 0xb0bec5, 0.35)
      for (let s = 15; s < f.length - 10; s += 34) {
        place(buildStreetLight(), f, s, f.tMax + 1.4)
      }
    } else {
      const bEnd = hasJunction ? A - 15 : f.length - 6
      for (let s = 10; s < bEnd; s += 13 + rnd() * 7) {
        if (rnd() < 0.82) {
          const b = buildBuilding(zone, rnd)
          place(b, f, s, f.tMax + 6.5 + rnd() * 8, rnd() * 0.2 - 0.1)
        }
        if (rnd() < 0.82) {
          const b = buildBuilding(zone, rnd)
          place(b, f, s + 5, f.tMin - 6.5 - rnd() * 8, rnd() * 0.2 - 0.1)
        }
      }
      if (zone === 'naha' || zone === 'mihama' || zone === 'school') {
        for (let s = 6; s < bEnd; s += 15 + rnd() * 9) {
          place(buildPalm(rnd), f, s, rnd() < 0.5 ? f.tMax + 2.3 : f.tMin - 2.3)
        }
      }
    }
  })

  // ── Finale: goal gate, sea, Ferris wheel ────────────────────────────────
  const last = frames[frames.length - 1]
  place(buildGoalGate((last.tMax - last.tMin) / 2 + 0.5), last, last.length - 4, 0)

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 300),
    new THREE.MeshLambertMaterial({ color: 0x2196d0 }),
  )
  sea.rotation.x = -Math.PI / 2
  const seaC = worldOf(last, last.length * 0.55, -190)
  sea.position.set(seaC.x, -0.01, seaC.z)
  root.add(sea)
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 34),
    new THREE.MeshLambertMaterial({ color: 0xe8d8a8 }),
  )
  beach.rotation.x = -Math.PI / 2
  const beachC = worldOf(last, last.length * 0.55, -32)
  beach.position.set(beachC.x, 0.0, beachC.z)
  beach.rotation.z = -last.heading
  root.add(beach)

  const fw = buildFerrisWheel()
  const fwPos = worldOf(last, last.length - 26, -44)
  fw.group.position.set(fwPos.x, 0, fwPos.z)
  fw.group.rotation.y = -last.heading + Math.PI / 2
  root.add(fw.group)
  ferrisWheel = fw.wheel

  return { root, signals, tolls, ferrisWheel }
}
