import type { Leg, JunctionKind, TurnDir } from './types'

// ── World constants (metres) ────────────────────────────────────────────────
export const LANE_W = 3.5
export const ROAD_W = 7            // two 3.5 m lanes
export const NARROW_W = 5.2        // Okinawa back street
export const BUS_LANE_W = 3.5      // extra bus lane on the left
export const JUNCTION = 10         // junction box edge length
export const PLAYER_T = -LANE_W / 2 // -1.75 — left-hand traffic lane centre
export const ONCOMING_T = LANE_W / 2

// Stop line sits this far before the junction edge; the near-side crosswalk is
// between the stop line and the junction (Japanese layout: 停止線 → 横断歩道 → 交差点).
export const STOP_BEFORE = 5
export const NEAR_XWALK = 2.4      // near crosswalk centre: junction edge - 2.4
export const FAR_XWALK = 2.4       // far crosswalk centre: junction far edge + 2.4

export interface Vec2 { x: number; z: number }

export interface LegFrame {
  index: number
  spec: Leg
  origin: Vec2       // centreline point at s = 0
  heading: number    // radians, 0 = north (-z), +right turn = +π/2
  fwd: Vec2
  right: Vec2
  length: number     // approach (+ junction size when there is one)
  stopLineS: number  // -1 when the leg has no junction
  junctionS: number  // s of the junction centre (-1 when none)
  triggerS: number   // event activates when the player's s passes this
  // Tarmac extent in t (right positive). Asymmetric for bus-lane legs.
  tMin: number
  tMax: number
}

const dirOf = (heading: number): Vec2 => ({ x: Math.sin(heading), z: -Math.cos(heading) })
const rightOf = (heading: number): Vec2 => dirOf(heading + Math.PI / 2)

function turnDelta(turn: TurnDir): number {
  if (turn === 'left') return -Math.PI / 2
  if (turn === 'right') return Math.PI / 2
  return 0
}

export function buildFrames(legs: Leg[]): LegFrame[] {
  const frames: LegFrame[] = []
  let pos: Vec2 = { x: 0, z: 0 }
  let heading = 0

  legs.forEach((spec, index) => {
    const fwd = dirOf(heading)
    const right = rightOf(heading)
    const hasJunction = spec.junction !== 'none'
    const length = spec.approach + (hasJunction ? JUNCTION : 0)

    const halfRoad = (spec.narrow ? NARROW_W : ROAD_W) / 2
    const tMin = spec.busLane ? -(halfRoad + BUS_LANE_W) : -halfRoad
    const tMax = halfRoad

    frames.push({
      index,
      spec,
      origin: pos,
      heading,
      fwd,
      right,
      length,
      stopLineS: hasJunction ? spec.approach - STOP_BEFORE : -1,
      junctionS: hasJunction ? spec.approach + JUNCTION / 2 : -1,
      triggerS: hasJunction ? Math.max(8, spec.approach - 45) : 8,
      tMin,
      tMax,
    })

    // Advance the walker to the next leg's origin.
    if (!hasJunction || spec.turn === 'straight') {
      pos = { x: pos.x + fwd.x * length, z: pos.z + fwd.z * length }
      // heading unchanged
    } else {
      const centre = {
        x: pos.x + fwd.x * (spec.approach + JUNCTION / 2),
        z: pos.z + fwd.z * (spec.approach + JUNCTION / 2),
      }
      heading += turnDelta(spec.turn)
      const nf = dirOf(heading)
      pos = { x: centre.x + nf.x * (JUNCTION / 2), z: centre.z + nf.z * (JUNCTION / 2) }
    }
  })

  return frames
}

export function worldOf(f: LegFrame, s: number, t: number): Vec2 {
  return {
    x: f.origin.x + f.fwd.x * s + f.right.x * t,
    z: f.origin.z + f.fwd.z * s + f.right.z * t,
  }
}

export function localOf(f: LegFrame, x: number, z: number): { s: number; t: number } {
  const dx = x - f.origin.x
  const dz = z - f.origin.z
  return {
    s: dx * f.fwd.x + dz * f.fwd.z,
    t: dx * f.right.x + dz * f.right.z,
  }
}

// Heading the route requires when EXITING leg i's junction.
export function exitHeading(f: LegFrame): number {
  return f.heading + turnDelta(f.spec.turn)
}

// Total course length (for the HUD progress bar).
export function totalLength(frames: LegFrame[]): number {
  return frames.reduce((sum, f) => sum + f.length, 0)
}

export type { JunctionKind }
