import * as THREE from 'three'
import { COURSE } from '../course/route'
import {
  buildFrames, localOf, worldOf, totalLength,
  PLAYER_T, JUNCTION, type LegFrame,
} from '../course/geometry'
import { DEDUCTIONS, START_POINTS, type CourseNpc, type ViolationCode, type ViolationRecord } from '../course/types'
import type { TrafficLightState } from '../data/types'
import { canCrossLine } from '../data/trafficRules'
import { inputState } from '../game/inputState'
import { bridge } from '../game/EventBridge'
import { buildWorld, type WorldHandles } from './world'
import { buildVehicle, VEHICLE_DIMS, type CarVariant } from './props'

// ── Bridge events ───────────────────────────────────────────────────────────
export const COURSE_EVENTS = {
  READY: 'course3d:ready',        // world built; payload { gps, legIndex, zone }
  STARTED: 'course3d:started',    // first throttle press — the exam clock runs
  TICK: 'course3d:tick',          // { kmh, points, progress, limit }
  GPS: 'course3d:gps',            // leg changed; { gps, legIndex, zone }
  VIOLATION: 'course3d:violation',// ViolationRecord
  COMPLETE: 'course3d:complete',  // { timeMs }
} as const

// ── Physics (metres, seconds) ───────────────────────────────────────────────
const CRUISE = 13.9      // 50 km/h
const MAX_SPEED = 22.3   // 80 km/h
const ACCEL = 8
const BRAKE = 10.5
const COAST = 1.8
const TURN_RATE = 2.5
const STOP_EPS = 0.35
const YIELD_CREEP = 7.5  // ~27 km/h — under this you're "carefully creeping"
const SPEED_TOL = 15     // km/h over the limit before it counts
const SPEED_GRACE = 2.4  // seconds of sustained speeding
const RAIN_BRAKE = 0.55
const RAIN_TURN = 0.78

interface LiveNpc {
  def: CourseNpc
  legIndex: number
  frame: LegFrame
  mesh: THREE.Group
  radius: number
  startedAt: number // engine clock ms at activation
  pathLen: number
  done: boolean
  lastPos: THREE.Vector3
  moving: boolean
  dir: THREE.Vector3
}

interface LegState {
  activated: boolean
  activatedAt: number
  crossedLine: boolean
  fullStopDone: boolean
  sAtYellow: number | null
  guards: Set<ViolationCode>
  speedingSince: number | null
  speedingCooldownUntil: number
  slowSince: number | null
  offRoadCooldownUntil: number
  pendingPhases: { at: number; state: TrafficLightState }[]
}

const freshLegState = (): LegState => ({
  activated: false,
  activatedAt: 0,
  crossedLine: false,
  fullStopDone: false,
  sAtYellow: null,
  guards: new Set(),
  speedingSince: null,
  speedingCooldownUntil: 0,
  slowSince: null,
  offRoadCooldownUntil: 0,
  pendingPhases: [],
})

export class CourseEngine {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private world: WorldHandles
  private frames: LegFrame[]
  private total: number

  private car = new THREE.Group()
  private carPos = new THREE.Vector3()
  private heading = 0
  private speed = 0

  private currentLeg = 0
  private legState: LegState = freshLegState()
  private lights = new Map<number, TrafficLightState | null>()
  private npcs: LiveNpc[] = []

  private clockMs = 0          // runs while the engine is mounted
  private examStartMs: number | null = null
  private pointsLost = 0
  private finished = false
  private prevS = 0

  private rainActive = false
  private rainFromLeg: number
  private rain: THREE.Points | null = null
  private hemi: THREE.HemisphereLight

  private tollOpen = false
  private tollDone = false

  private raf = 0
  private lastT = 0
  private tickAccum = 0
  private disposed = false
  private container: HTMLElement
  private resizeObs: ResizeObserver

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      62, container.clientWidth / Math.max(1, container.clientHeight), 0.3, 520,
    )

    this.frames = buildFrames(COURSE)
    this.total = totalLength(this.frames)
    this.rainFromLeg = this.frames.findIndex((f) => f.spec.rainFrom)

    // Lighting & sky
    this.scene.background = new THREE.Color(0x8ecdf0)
    this.scene.fog = new THREE.FogExp2(0x9cc8e8, 0.0042)
    this.hemi = new THREE.HemisphereLight(0xe8f4ff, 0x50654a, 1.0)
    this.scene.add(this.hemi)
    const sun = new THREE.DirectionalLight(0xffffff, 1.15)
    sun.position.set(60, 95, 40)
    this.scene.add(sun)

    // Static world
    this.world = buildWorld(this.frames)
    this.scene.add(this.world.root)

    // Initial signal states
    this.frames.forEach((f) => {
      this.lights.set(f.index, f.spec.event.light ?? null)
    })
    this.refreshSignals(true)

    // Player car
    const carMesh = buildVehicle('player', 0x1e88e5)
    this.car.add(carMesh)
    this.scene.add(this.car)
    const f0 = this.frames[0]
    const start = worldOf(f0, 6, PLAYER_T)
    this.carPos.set(start.x, 0, start.z)
    this.heading = f0.heading
    this.syncCarMesh()

    // Keyboard
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)

    this.resizeObs = new ResizeObserver(() => this.onResize())
    this.resizeObs.observe(container)

    // Debug/test hook (dev builds only)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__course = {
        teleport: (leg: number) => this.teleportTo(leg),
        state: () => {
          const f = this.frames[this.currentLeg]
          const loc = localOf(f, this.carPos.x, this.carPos.z)
          const light = this.lights.get(f.index) ?? null
          return {
            leg: this.currentLeg,
            kmh: Math.round(this.speed * 3.6),
            points: START_POINTS - this.pointsLost,
            s: Math.round(loc.s * 10) / 10,
            t: Math.round(loc.t * 10) / 10,
            headingDeg: Math.round((this.heading * 180) / Math.PI),
            legHeadingDeg: Math.round((f.heading * 180) / Math.PI),
            turn: f.spec.turn,
            junction: f.spec.junction,
            approach: f.spec.approach,
            stopLineS: f.stopLineS,
            length: f.length,
            limit: f.spec.event.speedLimit,
            canGo: canCrossLine(light, f.spec.turn),
            mustStop: !!f.spec.event.rules.mustStop,
            finished: this.finished,
            lastViolation: this.lastViolation,
          }
        },
      }
    }

    this.lastT = performance.now()
    this.raf = requestAnimationFrame(this.loop)

    const gps = this.frames[0].spec.event.gps
    bridge.emit(COURSE_EVENTS.READY, { gps, legIndex: 0, zone: this.frames[0].spec.event.zone })
    this.updateCamera(1) // settle instantly behind the car
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKey)
    this.resizeObs.disconnect()
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
    if (import.meta.env.DEV) {
      delete (window as unknown as Record<string, unknown>).__course
    }
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown'
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': inputState.throttle = down; break
      case 'ArrowDown': case 's': case 'S': inputState.brake = down; break
      case 'ArrowLeft': case 'a': case 'A': inputState.left = down; break
      case 'ArrowRight': case 'd': case 'D': inputState.right = down; break
      default: return
    }
    e.preventDefault()
  }

  private onResize() {
    const w = this.container.clientWidth
    const h = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  // ── Main loop ─────────────────────────────────────────────────────────────
  private loop = (t: number) => {
    if (this.disposed) return
    const dt = Math.min(0.05, (t - this.lastT) / 1000)
    this.lastT = t
    this.clockMs += dt * 1000

    this.updateCar(dt)
    this.updateLegs()
    this.updateEvents()
    this.updateNpcs()
    this.evaluate()
    this.updateToll()
    this.updateRain(dt)
    this.updateCamera(dt)
    this.refreshSignals(false)

    if (this.world.ferrisWheel) this.world.ferrisWheel.rotation.z += dt * 0.12

    this.tickAccum += dt
    if (this.tickAccum > 0.12) {
      this.tickAccum = 0
      const f = this.frames[this.currentLeg]
      const { s } = localOf(f, this.carPos.x, this.carPos.z)
      const done = this.frames.slice(0, this.currentLeg).reduce((a, fr) => a + fr.length, 0)
      bridge.emit(COURSE_EVENTS.TICK, {
        kmh: Math.round(this.speed * 3.6),
        points: Math.max(0, START_POINTS - this.pointsLost),
        progress: Math.min(1, (done + Math.max(0, Math.min(f.length, s))) / this.total),
        limit: f.spec.event.speedLimit,
      })
    }

    this.renderer.render(this.scene, this.camera)
    this.raf = requestAnimationFrame(this.loop)
  }

  // ── Car physics ───────────────────────────────────────────────────────────
  private updateCar(dt: number) {
    const { throttle, brake, left, right } = inputState

    if (this.finished) {
      this.speed = Math.max(0, this.speed - BRAKE * dt)
    } else {
      if (throttle && this.examStartMs === null) {
        this.examStartMs = this.clockMs
        bridge.emit(COURSE_EVENTS.STARTED)
      }
      const brakeDecel = this.rainActive ? BRAKE * RAIN_BRAKE : BRAKE
      if (brake) this.speed = Math.max(0, this.speed - brakeDecel * dt)
      else if (throttle) this.speed = Math.min(MAX_SPEED, this.speed + ACCEL * dt)
      else this.speed = Math.max(0, this.speed - COAST * dt)

      if (this.speed > STOP_EPS) {
        const steer = (right ? 1 : 0) - (left ? 1 : 0)
        const speedFactor = Math.min(1, this.speed / CRUISE)
        const rate = this.rainActive ? TURN_RATE * RAIN_TURN : TURN_RATE
        this.heading += steer * rate * speedFactor * dt
      }
    }

    this.carPos.x += Math.sin(this.heading) * this.speed * dt
    this.carPos.z += -Math.cos(this.heading) * this.speed * dt
    this.syncCarMesh()
  }

  private syncCarMesh() {
    this.car.position.copy(this.carPos)
    this.car.rotation.y = -this.heading + Math.PI
  }

  // ── Leg transitions / wrong way / off road ──────────────────────────────
  private updateLegs() {
    if (this.finished) return
    const f = this.frames[this.currentLeg]
    const { s, t } = localOf(f, this.carPos.x, this.carPos.z)
    const spec = f.spec
    const A = spec.approach
    const hasJunction = spec.junction !== 'none'

    // Goal?
    if (this.currentLeg === this.frames.length - 1 && s > f.length - 5) {
      this.finished = true
      bridge.emit(COURSE_EVENTS.COMPLETE, {
        timeMs: this.examStartMs === null ? 0 : this.clockMs - this.examStartMs,
      })
      return
    }

    // Advance into the next leg?
    const next = this.frames[this.currentLeg + 1]
    if (next) {
      const loc = localOf(next, this.carPos.x, this.carPos.z)
      if (loc.s > 1.2 && loc.s < 40 && Math.abs(loc.t) < next.tMax + 3) {
        this.currentLeg += 1
        this.prevS = loc.s
        this.legState = freshLegState()
        this.tollOpen = false
        this.tollDone = false
        const nf = this.frames[this.currentLeg]
        bridge.emit(COURSE_EVENTS.GPS, {
          gps: nf.spec.event.gps, legIndex: nf.index, zone: nf.spec.event.zone,
        })
        return
      }
    }

    // Wrong way through a junction
    if (hasJunction) {
      const jc = f.junctionS
      const wentSideways = Math.abs(t) > JUNCTION / 2 + 6 && Math.abs(s - jc) < 6
      const wentAhead = spec.turn !== 'straight' && s > A + JUNCTION + 5 && Math.abs(t) < 6
      const reversed = s < -4
      if (wentSideways || wentAhead || reversed) {
        this.punish('wrong_way')
        this.respawn()
        return
      }
    }

    // Off the tarmac (outside the junction sweep zone, and past the first few
    // metres of the leg so a wide-but-recovering turn exit isn't punished)
    const inJunctionZone = hasJunction && s > A - 3
    if (!inJunctionZone && s > 6 && this.clockMs > this.legState.offRoadCooldownUntil) {
      if (t > f.tMax + 1.1 || t < f.tMin - 1.1) {
        this.punish('off_road')
        this.legState.offRoadCooldownUntil = this.clockMs + 3000
        const p = worldOf(f, s, Math.max(f.tMin + 1.2, Math.min(f.tMax - 1.2, t)))
        this.carPos.set(p.x, 0, p.z)
        this.heading = f.heading
        this.speed *= 0.35
      }
    }
  }

  // ── Event activation & light phases ──────────────────────────────────────
  private updateEvents() {
    const f = this.frames[this.currentLeg]
    const st = this.legState
    const { s } = localOf(f, this.carPos.x, this.carPos.z)

    if (!st.activated && s >= f.triggerS) {
      st.activated = true
      st.activatedAt = this.clockMs
      st.pendingPhases = (f.spec.event.lightPhases ?? []).map((p) => ({
        at: this.clockMs + p.atMs, state: p.state,
      }))
      // Spawn NPCs
      for (const def of f.spec.event.npcs ?? []) {
        this.spawnNpc(def, f)
      }
    }

    if (st.activated && st.pendingPhases.length) {
      const due = st.pendingPhases.filter((p) => p.at <= this.clockMs)
      if (due.length) {
        st.pendingPhases = st.pendingPhases.filter((p) => p.at > this.clockMs)
        const newState = due[due.length - 1].state
        const old = this.lights.get(f.index)
        this.lights.set(f.index, newState)
        // Yellow-onset leniency bookkeeping
        if (newState.type === 'standard' && newState.color === 'yellow' &&
            (!old || old.type !== 'standard' || old.color !== 'yellow')) {
          st.sAtYellow = s
        }
      }
    }
  }

  private spawnNpc(def: CourseNpc, f: LegFrame) {
    const variant: CarVariant = def.kind === 'pedestrian' ? 'car' : (def.variant ?? 'car')
    let mesh: THREE.Group
    let radius: number
    if (def.kind === 'pedestrian') {
      mesh = new THREE.Group()
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.22, 0.75, 3, 8),
        new THREE.MeshLambertMaterial({ color: def.color ?? 0xffd54f }),
      )
      body.position.y = 0.85
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        new THREE.MeshLambertMaterial({ color: 0xefe0c9 }),
      )
      head.position.y = 1.55
      mesh.add(body, head)
      radius = 0.5
    } else {
      mesh = buildVehicle(variant, def.color ?? 0x888888)
      radius = VEHICLE_DIMS[variant].radius
    }

    const from = worldOf(f, def.from.s, def.from.t)
    const to = worldOf(f, def.to.s, def.to.t)
    const fromV = new THREE.Vector3(from.x, 0, from.z)
    const toV = new THREE.Vector3(to.x, 0, to.z)
    const pathLen = fromV.distanceTo(toV)
    const dir = pathLen > 0.01 ? toV.clone().sub(fromV).normalize()
      // Parked: face along the lane (oncoming side faces the player)
      : new THREE.Vector3(f.fwd.x, 0, f.fwd.z).multiplyScalar(def.from.t < 0 ? 1 : -1)

    mesh.position.copy(fromV)
    mesh.rotation.y = Math.atan2(-dir.x, -dir.z)
    this.scene.add(mesh)

    this.npcs.push({
      def, legIndex: f.index, frame: f, mesh, radius,
      startedAt: this.clockMs, pathLen,
      done: false, lastPos: fromV.clone(), moving: false, dir,
    })
  }

  private updateNpcs() {
    for (const n of this.npcs) {
      if (n.done) continue
      const elapsed = this.clockMs - n.startedAt - n.def.delayMs
      if (elapsed <= 0 || n.def.speed <= 0 || n.pathLen < 0.01) {
        n.moving = false
        continue
      }
      const durMs = (n.pathLen / n.def.speed) * 1000
      let p = elapsed / durMs
      if (p >= 1) {
        if (n.def.loop) p %= 1
        else {
          n.done = true
          n.moving = false
          this.scene.remove(n.mesh)
          continue
        }
      }
      const from = worldOf(n.frame, n.def.from.s, n.def.from.t)
      const to = worldOf(n.frame, n.def.to.s, n.def.to.t)
      n.mesh.position.set(from.x + (to.x - from.x) * p, 0, from.z + (to.z - from.z) * p)
      n.moving = true
      n.lastPos.copy(n.mesh.position)
    }
    this.npcs = this.npcs.filter((n) => !n.done)
  }

  // ── Evaluation (減点法) ───────────────────────────────────────────────────
  private lastViolation: string = ''

  private punish(code: ViolationCode, kmh?: number) {
    const st = this.legState
    if (st.guards.has(code)) return
    st.guards.add(code)
    const f = this.frames[this.currentLeg]
    const rec: ViolationRecord = {
      code,
      legIndex: this.currentLeg,
      eventId: f.spec.event.id,
      deduction: DEDUCTIONS[code],
      atMs: this.examStartMs === null ? 0 : this.clockMs - this.examStartMs,
      kmh,
    }
    this.pointsLost += rec.deduction
    if (import.meta.env.DEV) {
      const loc = localOf(f, this.carPos.x, this.carPos.z)
      this.lastViolation = `${code}@leg${this.currentLeg} s=${loc.s.toFixed(1)} t=${loc.t.toFixed(1)} kmh=${Math.round(this.speed * 3.6)}`
    }
    bridge.emit(COURSE_EVENTS.VIOLATION, rec)
  }

  private respawn() {
    const f = this.frames[this.currentLeg]
    const p = worldOf(f, Math.max(3, f.triggerS - 18), PLAYER_T)
    this.carPos.set(p.x, 0, p.z)
    this.heading = f.heading
    this.speed = 0
    this.prevS = Math.max(3, f.triggerS - 18)
    // Remove this leg's NPCs and re-arm the event
    for (const n of this.npcs) {
      if (n.legIndex === f.index) {
        this.scene.remove(n.mesh)
        n.done = true
      }
    }
    this.npcs = this.npcs.filter((n) => !n.done)
    this.legState = freshLegState()
    this.lights.set(f.index, f.spec.event.light ?? null)
    this.tollOpen = false
    this.tollDone = false
    this.syncCarMesh()
  }

  private evaluate() {
    if (this.finished) return
    const f = this.frames[this.currentLeg]
    const spec = f.spec
    const st = this.legState
    const { s, t } = localOf(f, this.carPos.x, this.carPos.z)
    const kmh = this.speed * 3.6
    const rules = spec.event.rules
    const light = this.lights.get(f.index) ?? null
    const A = spec.approach
    const hasJunction = spec.junction !== 'none'

    // 1) Collision
    const carR = VEHICLE_DIMS.player.radius
    for (const n of this.npcs) {
      if (n.def.kind === 'pedestrian' && this.speed <= STOP_EPS) continue
      const d = this.carPos.distanceTo(n.mesh.position)
      if (d < carR + n.radius) {
        this.punish('collision', Math.round(kmh))
        this.respawn()
        return
      }
    }

    // 2) Full-stop tracking before the line
    if (hasJunction && rules.mustStop && !st.crossedLine) {
      if (this.speed < STOP_EPS && s > f.stopLineS - 9 && s < f.stopLineS + 0.6) {
        st.fullStopDone = true
      }
    }

    // 3) Crossing the stop line
    if (hasJunction && !st.crossedLine && this.prevS < f.stopLineS && s >= f.stopLineS) {
      st.crossedLine = true
      if (rules.waitForGo && !canCrossLine(light, spec.turn)) {
        const isYellow = light?.type === 'standard' && light.color === 'yellow'
        const closeAtYellow = isYellow && st.sAtYellow !== null && (f.stopLineS - st.sAtYellow) < 14
        if (!closeAtYellow) this.punish('ran_red', Math.round(kmh))
      }
      if (rules.mustStop && !st.fullStopDone) {
        this.punish('no_full_stop', Math.round(kmh))
      }
    }

    // 4) Yielding inside the conflict zone
    const inConflict = hasJunction && s > f.stopLineS - 0.5 && s < A + JUNCTION + 4
    if ((inConflict || !hasJunction) && this.speed > YIELD_CREEP) {
      const carFwd = new THREE.Vector3(Math.sin(this.heading), 0, -Math.cos(this.heading))
      for (const n of this.npcs) {
        const toN = n.mesh.position.clone().sub(this.carPos)
        const dist = toN.length()

        if (rules.yieldPed && n.def.kind === 'pedestrian') {
          const pl = localOf(f, n.mesh.position.x, n.mesh.position.z)
          const inMain = Math.abs(pl.t) < f.tMax + 0.6
          const inArm = hasJunction && Math.abs(pl.s - f.junctionS) < 4.1
          if ((inMain || inArm) && dist < 7 && toN.normalize().dot(carFwd) > 0.25) {
            this.punish('fail_yield_ped', Math.round(kmh))
          }
        }

        if (rules.yieldVeh && n.def.kind === 'vehicle' && n.moving && inConflict) {
          const sameDir = n.dir.dot(carFwd) > 0.6
          if (!sameDir && dist < 11) {
            const nl = localOf(f, n.mesh.position.x, n.mesh.position.z)
            const nearJunction = Math.abs(nl.s - f.junctionS) < 16 && Math.abs(nl.t) < 16
            if (nearJunction) this.punish('fail_yield_veh', Math.round(kmh))
          }
        }
      }
    }

    // 5) Speeding / minimum speed
    const limit = spec.event.speedLimit
    if (kmh > limit + SPEED_TOL && this.clockMs > st.speedingCooldownUntil) {
      st.speedingSince ??= this.clockMs
      if (this.clockMs - st.speedingSince > SPEED_GRACE * 1000) {
        st.guards.delete('speeding') // repeated sustained speeding deducts again
        this.punish('speeding', Math.round(kmh))
        st.speedingSince = null
        st.speedingCooldownUntil = this.clockMs + 9000
      }
    } else if (kmh <= limit + 2) {
      st.speedingSince = null
    }

    if (spec.event.minSpeed && this.examStartMs !== null && s > 20 && s < f.length - 20) {
      if (kmh < spec.event.minSpeed - 12) {
        st.slowSince ??= this.clockMs
        if (this.clockMs - st.slowSince > 4000) {
          this.punish('too_slow', Math.round(kmh))
          st.slowSince = null
        }
      } else {
        st.slowSince = null
      }
    }

    // 6) Bus lane
    if (spec.busLane && s > 4 && s < A - 6 && t < f.tMin + 3.4) {
      this.punish('bus_lane')
    }

    // 7) ETC gate
    if (spec.tollGate && !this.tollDone) {
      const toll = this.world.tolls.find((x) => x.legIndex === f.index)
      if (toll && this.prevS < toll.gateS && s >= toll.gateS) {
        this.tollDone = true
        if (kmh > 25) {
          this.punish('toll_crash', Math.round(kmh))
          this.speed = 1.2
        }
      }
    }

    this.prevS = s
  }

  // ── Toll bar animation ────────────────────────────────────────────────────
  private updateToll() {
    const f = this.frames[this.currentLeg]
    const toll = this.world.tolls.find((x) => x.legIndex === f.index)
    if (!toll) return
    const { s } = localOf(f, this.carPos.x, this.carPos.z)
    const kmh = this.speed * 3.6
    if (!this.tollOpen && s > toll.gateS - 20 && s < toll.gateS && kmh <= 25) {
      this.tollOpen = true
    }
    const target = this.tollOpen || this.tollDone ? -1.25 : 0
    toll.handle.bar.rotation.z += (target - toll.handle.bar.rotation.z) * 0.12
  }

  // ── Signals ───────────────────────────────────────────────────────────────
  private refreshSignals(force: boolean) {
    const blinkOn = Math.floor(this.clockMs / 450) % 2 === 0
    this.world.signals.forEach((sig, legIndex) => {
      const state = this.lights.get(legIndex)
      if (!state) { if (force) sig.setState('off'); return }
      if (state.type === 'standard') {
        sig.setState(state.color)
      } else if (state.type === 'arrow') {
        sig.setState(state.mainColor, state.activeArrows.includes('right'))
      } else if (state.type === 'flashing') {
        sig.setState(blinkOn ? state.color : 'off')
      }
    })
  }

  // ── Rain ──────────────────────────────────────────────────────────────────
  private updateRain(dt: number) {
    const shouldRain = this.rainFromLeg >= 0 && this.currentLeg >= this.rainFromLeg
    if (shouldRain && !this.rainActive) {
      this.rainActive = true
      this.scene.background = new THREE.Color(0x5d7789)
      this.scene.fog = new THREE.FogExp2(0x6b8296, 0.0105)
      this.hemi.intensity = 0.62

      const N = 1400
      const pos = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 70
        pos[i * 3 + 1] = Math.random() * 30
        pos[i * 3 + 2] = (Math.random() - 0.5) * 70
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      this.rain = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xbcd4e4, size: 0.13, transparent: true, opacity: 0.65,
      }))
      this.scene.add(this.rain)
    }
    if (this.rain) {
      const attr = (this.rain.geometry.getAttribute('position') as THREE.BufferAttribute)
      const arr = attr.array as Float32Array
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= 22 * dt
        if (arr[i] < 0) arr[i] += 30
      }
      attr.needsUpdate = true
      this.rain.position.set(this.carPos.x, 0, this.carPos.z)
    }
  }

  // ── Chase camera ──────────────────────────────────────────────────────────
  private updateCamera(dt: number) {
    const fwd = new THREE.Vector3(Math.sin(this.heading), 0, -Math.cos(this.heading))
    const dist = 8.0 + this.speed * 0.24
    const height = 3.6 + this.speed * 0.06
    const target = new THREE.Vector3()
      .copy(this.carPos)
      .addScaledVector(fwd, -dist)
      .setY(height)
    const k = 1 - Math.exp(-dt * 4.5)
    this.camera.position.lerp(target, Math.min(1, k))
    const look = new THREE.Vector3().copy(this.carPos).addScaledVector(fwd, 7).setY(1.3)
    this.camera.lookAt(look)

    const wantFov = 62 + this.speed * 0.55
    if (Math.abs(this.camera.fov - wantFov) > 0.3) {
      this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, dt * 5)
      this.camera.updateProjectionMatrix()
    }
  }

  // Dev helper — jump to a leg start.
  private teleportTo(leg: number) {
    this.currentLeg = Math.max(0, Math.min(this.frames.length - 1, leg))
    const f = this.frames[this.currentLeg]
    const p = worldOf(f, 4, PLAYER_T)
    this.carPos.set(p.x, 0, p.z)
    this.heading = f.heading
    this.speed = 0
    this.prevS = 4
    this.legState = freshLegState()
    this.tollOpen = false
    this.tollDone = false
    bridge.emit(COURSE_EVENTS.GPS, {
      gps: f.spec.event.gps, legIndex: f.index, zone: f.spec.event.zone,
    })
    this.syncCarMesh()
    this.updateCamera(1)
  }
}
