import Phaser from 'phaser'
import { bridge, REACT_EVENTS, PHASER_EVENTS } from '../EventBridge'
import { inputState } from '../inputState'
import { canCrossLine } from '../../data/trafficRules'
import type {
  Scenario,
  TrafficLightState,
  ScenarioNPC,
  Maneuver,
  OutcomeReason,
} from '../../data/types'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'

// ---- Road / colour constants ----
const ROAD_COLOR = 0x4a4a4a
const ROAD_LINE = 0xffffff
const SIDEWALK_COLOR = 0x8a7c6a
const GRASS_COLOR = 0x3d7a30
const INTERSECTION_COLOR = 0x555555

// ---- Geometry ----
const CX = GAME_WIDTH / 2 // 400
const CY = GAME_HEIGHT / 2 // 225
const ROAD_W = 80
const INT = 80 // intersection size

// Japan = left-hand traffic. A northbound car keeps to the LEFT (west, smaller x).
const NB_LANE_X = CX - 20 // player (northbound)

const STOP_LINE_Y = CY + INT / 2 // 265 — player stops before (south of) this
const SPAWN_Y = GAME_HEIGHT - 22
const LIGHT_X = CX + INT / 2 + 18
const LIGHT_Y = CY - INT / 2 - 6

// Goal lines (reaching one resolves the maneuver)
const GOAL_STRAIGHT_Y = CY - 80
const GOAL_RIGHT_X = CX + 90
const GOAL_LEFT_X = CX - 90

// ---- Physics ----
const CRUISE_SPEED = 95 // px/s the car rolls at once driving begins
const MAX_SPEED = 240
const ACCEL = 165
const BRAKE_DECEL = 340
const COAST_FRICTION = 22
const TURN_RATE = 2.6 // rad/s at full effect
const STOP_EPS = 8 // below this speed the car counts as "stopped"

// ---- Collision radii ----
const CAR_R = 19
const NPC_CAR_R = 18
const NPC_PED_R = 11

type Phase = 'idle' | 'ready' | 'drive' | 'done'

interface NpcSprite {
  def: ScenarioNPC
  obj: Phaser.GameObjects.Container
}

export class ScenarioScene extends Phaser.Scene {
  private car!: Phaser.GameObjects.Container
  private roadGraphics!: Phaser.GameObjects.Graphics
  private lightContainer: Phaser.GameObjects.Container | null = null
  private lightLamp: Phaser.GameObjects.Graphics | null = null
  private npcs: NpcSprite[] = []
  private flashTimer: Phaser.Time.TimerEvent | null = null

  private scenario: Scenario | null = null
  private phase: Phase = 'idle'

  // car kinematic state
  private speed = 0
  private heading = 0 // radians, 0 = north (up)

  // evaluation state
  private driveStart = 0
  private currentLight: TrafficLightState | null = null
  private hasStopped = false
  private crossedLine = false
  private resolved = false

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW?: Phaser.Input.Keyboard.Key
  private keyA?: Phaser.Input.Keyboard.Key
  private keyS?: Phaser.Input.Keyboard.Key
  private keyD?: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'ScenarioScene' })
  }

  create() {
    this.buildRoad()
    this.car = this.createCar()
    this.resetCarToSpawn()

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.keyW = this.input.keyboard.addKey('W')
      this.keyA = this.input.keyboard.addKey('A')
      this.keyS = this.input.keyboard.addKey('S')
      this.keyD = this.input.keyboard.addKey('D')
    }

    bridge.on(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
    bridge.on(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)

    bridge.emit(PHASER_EVENTS.SCENE_READY)
  }

  destroy() {
    bridge.off(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
    bridge.off(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)
    this.flashTimer?.destroy()
  }

  // ================= Road =================

  private buildRoad() {
    if (this.roadGraphics) this.roadGraphics.destroy()
    this.roadGraphics = this.add.graphics()
    const g = this.roadGraphics

    g.fillStyle(GRASS_COLOR)
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Sidewalks
    g.fillStyle(SIDEWALK_COLOR)
    g.fillRect(CX - ROAD_W / 2 - 8, 0, ROAD_W + 16, GAME_HEIGHT)
    g.fillRect(0, CY - ROAD_W / 2 - 8, GAME_WIDTH, ROAD_W + 16)

    // Road surface
    g.fillStyle(ROAD_COLOR)
    g.fillRect(CX - ROAD_W / 2, 0, ROAD_W, GAME_HEIGHT)
    g.fillRect(0, CY - ROAD_W / 2, GAME_WIDTH, ROAD_W)

    // Intersection
    g.fillStyle(INTERSECTION_COLOR)
    g.fillRect(CX - INT / 2, CY - INT / 2, INT, INT)

    // Centre dashes
    g.fillStyle(ROAD_LINE)
    for (let y = 0; y < CY - INT / 2; y += 30) g.fillRect(CX - 2, y, 4, 18)
    for (let y = CY + INT / 2 + 12; y < GAME_HEIGHT; y += 30) g.fillRect(CX - 2, y, 4, 18)
    for (let x = 0; x < CX - INT / 2; x += 30) g.fillRect(x, CY - 2, 18, 4)
    for (let x = CX + INT / 2 + 12; x < GAME_WIDTH; x += 30) g.fillRect(x, CY - 2, 18, 4)

    // Stop lines (all four approaches)
    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - ROAD_W / 2, CY + INT / 2, ROAD_W, 4) // player approach (south)
    g.fillRect(CX - ROAD_W / 2, CY - INT / 2 - 4, ROAD_W, 4)
    g.fillRect(CX - INT / 2 - 4, CY - ROAD_W / 2, 4, ROAD_W)
    g.fillRect(CX + INT / 2, CY - ROAD_W / 2, 4, ROAD_W)

    // Zebra crossing on the player's approach (south of the intersection)
    g.fillStyle(ROAD_LINE)
    for (let i = 0; i < 5; i++) {
      g.fillRect(CX - ROAD_W / 2 + i * 16, CY + INT / 2 + 26, 10, 16)
    }
    // Player's physical stop line, south of the crosswalk
    g.fillRect(CX - ROAD_W / 2, CY + INT / 2 + 50, ROAD_W, 4)
  }

  // ================= Car =================

  private createCar(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(0x1565c0)
    g.fillRoundedRect(-16, -26, 32, 52, 6)
    g.fillStyle(0x90caf9)
    g.fillRect(-11, -19, 22, 14) // windshield
    g.fillStyle(0x90caf9)
    g.fillRect(-11, 9, 22, 10) // rear window
    g.fillStyle(0x111111)
    g.fillRect(-19, -21, 6, 12)
    g.fillRect(13, -21, 6, 12)
    g.fillRect(-19, 11, 6, 12)
    g.fillRect(13, 11, 6, 12)
    g.fillStyle(0xfff176)
    g.fillRect(-12, -25, 9, 5)
    g.fillRect(3, -25, 9, 5)

    const c = this.add.container(0, 0, [g])
    c.setDepth(10)
    return c
  }

  private resetCarToSpawn() {
    this.speed = 0
    this.heading = 0
    this.car.setPosition(NB_LANE_X, SPAWN_Y)
    this.car.setRotation(0)
  }

  // ================= Traffic light =================

  private clearLight() {
    this.flashTimer?.destroy()
    this.flashTimer = null
    this.lightContainer?.destroy()
    this.lightContainer = null
    this.lightLamp = null
  }

  private drawLight(state: TrafficLightState) {
    this.clearLight()
    const g = this.add.graphics()
    g.fillStyle(0x222222)
    g.fillRoundedRect(-13, -40, 26, 74, 4)
    const lamp = this.add.graphics()
    this.renderLamp(g, lamp, state)

    const c = this.add.container(LIGHT_X, LIGHT_Y, [g, lamp])
    c.setDepth(6)
    this.lightContainer = c
    this.lightLamp = lamp

    if (state.type === 'flashing') {
      let on = true
      this.flashTimer = this.time.addEvent({
        delay: 480,
        loop: true,
        callback: () => {
          on = !on
          lamp.setVisible(on)
        },
      })
    }
  }

  // redraw lamp colours for the current state on an existing container
  private renderLamp(
    housing: Phaser.GameObjects.Graphics,
    lamp: Phaser.GameObjects.Graphics,
    state: TrafficLightState
  ) {
    housing.clear()
    housing.fillStyle(0x222222)
    housing.fillRoundedRect(-13, -40, 26, 74, 4)
    lamp.clear()
    lamp.setVisible(true)

    if (state.type === 'standard') {
      const colors: Record<string, number> = { red: 0xff2222, yellow: 0xffcc00, green: 0x00cc44 }
      const dim: Record<string, number> = { red: 0x551111, yellow: 0x554400, green: 0x114422 }
      const yo: Record<string, number> = { red: -24, yellow: -2, green: 20 }
      ;(['red', 'yellow', 'green'] as const).forEach((col) => {
        housing.fillStyle(dim[col])
        housing.fillCircle(0, yo[col], 9)
      })
      lamp.fillStyle(colors[state.color])
      lamp.fillCircle(0, yo[state.color], 9)
      lamp.fillStyle(colors[state.color], 0.3)
      lamp.fillCircle(0, yo[state.color], 15)
    } else if (state.type === 'arrow') {
      const mainDim = state.mainColor === 'red' ? 0x551111 : state.mainColor === 'yellow' ? 0x554400 : 0x114422
      const mainLit = state.mainColor === 'red' ? 0xff2222 : state.mainColor === 'yellow' ? 0xffcc00 : 0x00cc44
      housing.fillStyle(mainDim)
      housing.fillCircle(0, -22, 9)
      lamp.fillStyle(mainLit)
      lamp.fillCircle(0, -22, 9)
      housing.fillStyle(0x333333)
      housing.fillRect(-12, -6, 24, 34)
      lamp.fillStyle(0x33ddff)
      state.activeArrows.forEach((arrow, i) => {
        const ay = 2 + i * 11
        this.drawArrowGlyph(lamp, 0, ay, arrow)
      })
    } else if (state.type === 'flashing') {
      const lit = state.color === 'red' ? 0xff2222 : 0xffcc00
      const dim = state.color === 'red' ? 0x551111 : 0x554400
      housing.fillStyle(dim)
      housing.fillCircle(0, -4, 11)
      lamp.fillStyle(lit)
      lamp.fillCircle(0, -4, 11)
      lamp.fillStyle(lit, 0.3)
      lamp.fillCircle(0, -4, 17)
    } else {
      // pedestrian
      const col = state.phase === 'stop' ? 0xff2222 : 0x00cc44
      housing.fillStyle(0x111111)
      housing.fillRoundedRect(-12, -32, 24, 64, 4)
      lamp.fillStyle(col)
      lamp.fillCircle(0, -16, 5)
      lamp.fillRect(-5, -11, 10, 13)
      if (state.phase === 'walk') {
        lamp.fillRect(-7, 3, 4, 13)
        lamp.fillRect(3, 3, 4, 13)
      } else {
        lamp.fillRect(-5, 3, 10, 11)
      }
    }
  }

  private drawArrowGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number, dir: string) {
    if (dir === 'straight') {
      g.fillTriangle(x - 5, y + 2, x + 5, y + 2, x, y - 6)
      g.fillRect(x - 2, y + 2, 4, 6)
    } else if (dir === 'left') {
      g.fillTriangle(x - 6, y, x + 2, y - 5, x + 2, y + 5)
      g.fillRect(x + 2, y - 2, 6, 4)
    } else if (dir === 'right') {
      g.fillTriangle(x + 6, y, x - 2, y - 5, x - 2, y + 5)
      g.fillRect(x - 8, y - 2, 6, 4)
    }
  }

  private applyLightState(state: TrafficLightState) {
    this.currentLight = state
    if (state.type === 'flashing') {
      // redraw + restart flashing
      this.drawLight(state)
    } else if (this.lightContainer && this.lightLamp) {
      this.flashTimer?.destroy()
      this.flashTimer = null
      const housing = this.lightContainer.getAt(0) as Phaser.GameObjects.Graphics
      this.renderLamp(housing, this.lightLamp, state)
    } else {
      this.drawLight(state)
    }
  }

  // ================= NPCs =================

  private clearNPCs() {
    this.npcs.forEach((n) => n.obj.destroy())
    this.npcs = []
  }

  private spawnNPCs(scenario: Scenario) {
    this.clearNPCs()
    scenario.npcs?.forEach((def) => {
      const obj = def.type === 'pedestrian' ? this.createPedestrian(def.color) : this.createNPCCar(def.color)
      obj.setPosition(def.startX, def.startY)
      obj.setDepth(8)
      obj.setVisible(false) // appears when its startAtMs elapses
      this.npcs.push({ def, obj })
    })
  }

  private createPedestrian(color = 0xffd54f): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(color)
    g.fillCircle(0, -14, 6)
    g.fillRect(-5, -8, 10, 13)
    g.fillRect(-6, 5, 4, 11)
    g.fillRect(2, 5, 4, 11)
    return this.add.container(0, 0, [g])
  }

  private createNPCCar(color = 0xcc2222): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(color)
    g.fillRoundedRect(-15, -24, 30, 48, 5)
    g.fillStyle(0x90caf9)
    g.fillRect(-10, -16, 20, 11)
    g.fillStyle(0x111111)
    g.fillRect(-18, -18, 5, 11)
    g.fillRect(13, -18, 5, 11)
    g.fillRect(-18, 10, 5, 11)
    g.fillRect(13, 10, 5, 11)
    return this.add.container(0, 0, [g])
  }

  // ================= Scenario lifecycle =================

  private onStartScenario = (raw: unknown) => {
    const scenario = raw as Scenario
    this.scenario = scenario
    this.phase = 'ready'
    this.resolved = false
    this.hasStopped = false
    this.crossedLine = false

    this.tweens.killTweensOf(this.car)
    this.buildRoad()
    this.resetCarToSpawn()

    this.clearLight()
    this.currentLight = scenario.light
    if (scenario.light) this.drawLight(scenario.light)

    this.spawnNPCs(scenario)

    bridge.emit(PHASER_EVENTS.SCENARIO_READY, {
      instruction: scenario.instruction,
      maneuver: scenario.maneuver,
    })

    // brief "get ready" pause, then the car starts rolling
    this.time.delayedCall(1700, () => {
      if (this.phase !== 'ready') return
      this.phase = 'drive'
      this.speed = CRUISE_SPEED
      this.driveStart = this.time.now

      // schedule light changes relative to drive start
      scenario.lightChanges?.forEach((ch) => {
        this.time.delayedCall(ch.atMs, () => {
          if (this.phase === 'drive') this.applyLightState(ch.state)
        })
      })

      bridge.emit(PHASER_EVENTS.DRIVE_START)
    })
  }

  private onNextScenario = () => {
    this.phase = 'idle'
    this.tweens.killTweensOf(this.car)
    this.clearLight()
    this.clearNPCs()
    this.resetCarToSpawn()
  }

  // ================= Main loop =================

  update(_time: number, delta: number) {
    if (this.phase !== 'drive' || !this.scenario) return
    const dt = Math.min(delta, 50) / 1000
    const elapsed = this.time.now - this.driveStart

    this.updateCar(dt)
    this.updateNPCs(elapsed)

    if (this.resolved) return
    this.evaluate(elapsed)
  }

  private readInput() {
    const left = inputState.left || this.cursors?.left.isDown || this.keyA?.isDown || false
    const right = inputState.right || this.cursors?.right.isDown || this.keyD?.isDown || false
    const throttle = inputState.throttle || this.cursors?.up.isDown || this.keyW?.isDown || false
    const brake = inputState.brake || this.cursors?.down.isDown || this.keyS?.isDown || false
    return { left, right, throttle, brake }
  }

  private updateCar(dt: number) {
    const { left, right, throttle, brake } = this.readInput()

    if (brake) {
      this.speed = Math.max(0, this.speed - BRAKE_DECEL * dt)
    } else if (throttle) {
      this.speed = Math.min(MAX_SPEED, this.speed + ACCEL * dt)
    } else {
      this.speed = Math.max(0, this.speed - COAST_FRICTION * dt)
    }

    // steering only has effect while moving
    if (this.speed > STOP_EPS) {
      const steer = (right ? 1 : 0) - (left ? 1 : 0)
      const speedFactor = Math.min(1, this.speed / 120)
      this.heading += steer * TURN_RATE * speedFactor * dt
    }

    const fx = Math.sin(this.heading)
    const fy = -Math.cos(this.heading)
    this.car.x += fx * this.speed * dt
    this.car.y += fy * this.speed * dt
    this.car.setRotation(this.heading)
  }

  private updateNPCs(elapsed: number) {
    this.npcs.forEach(({ def, obj }) => {
      const t = elapsed - def.startAtMs
      if (t < 0) {
        obj.setVisible(false)
        return
      }
      obj.setVisible(true)
      const dx = def.endX - def.startX
      const dy = def.endY - def.startY
      const dist = Math.hypot(dx, dy)
      const travelled = (def.speed * t) / 1000
      const progress = dist === 0 ? 1 : Math.min(1, travelled / dist)
      obj.x = def.startX + dx * progress
      obj.y = def.startY + dy * progress
    })
  }

  private evaluate(elapsed: number) {
    const ev = this.scenario!.evaluation
    const maneuver = this.scenario!.maneuver

    // 1) Collision with any active NPC
    for (const { def, obj } of this.npcs) {
      if (!obj.visible) continue
      const r = def.type === 'pedestrian' ? NPC_PED_R : NPC_CAR_R
      if (Math.hypot(this.car.x - obj.x, this.car.y - obj.y) < CAR_R + r) {
        return this.resolve('collision')
      }
    }

    // 2) Full-stop detection (before the line)
    if (!this.crossedLine && this.speed < STOP_EPS && this.car.y > STOP_LINE_Y) {
      this.hasStopped = true
    }

    // 3) Crossing the stop line
    if (!this.crossedLine && this.car.y <= STOP_LINE_Y) {
      this.crossedLine = true
      if (ev.mustStop && !this.hasStopped) {
        return this.resolve('no_full_stop')
      }
      if (ev.waitForGo && !canCrossLine(this.currentLight, maneuver)) {
        return this.resolve('ran_red')
      }
      if (!canCrossLine(this.currentLight, maneuver)) {
        // signal forbids this maneuver (e.g. straight on a right-arrow-only signal)
        return this.resolve('ran_red')
      }
    }

    // 4) Reaching a goal zone = maneuver complete
    const done = this.reachedGoal()
    if (done) {
      if (ev.allowedManeuvers && !ev.allowedManeuvers.includes(done)) {
        return this.resolve('wrong_way')
      }
      return this.resolve('success')
    }

    // 5) Off-road
    if (elapsed > 250 && this.isOffRoad()) {
      return this.resolve('off_road')
    }

    // 6) Timeout safety net
    if (elapsed > 18000) {
      return this.resolve('timeout')
    }
  }

  private reachedGoal(): Maneuver | null {
    if (this.car.y < GOAL_STRAIGHT_Y && Math.abs(this.car.x - CX) < 44) return 'straight'
    if (this.car.x > GOAL_RIGHT_X && Math.abs(this.car.y - CY) < 44) return 'right'
    if (this.car.x < GOAL_LEFT_X && Math.abs(this.car.y - CY) < 44) return 'left'
    return null
  }

  private isOffRoad(): boolean {
    const onVertical = Math.abs(this.car.x - CX) <= ROAD_W / 2 + 6
    const onHorizontal = Math.abs(this.car.y - CY) <= ROAD_W / 2 + 6
    return !onVertical && !onHorizontal
  }

  private resolve(reason: OutcomeReason) {
    if (this.resolved) return
    this.resolved = true
    this.phase = 'done'
    const isCorrect = reason === 'success'
    const timeMs = this.time.now - this.driveStart

    if (reason === 'collision') {
      const overlay = this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.35).setDepth(20)
      this.cameras.main.shake(350, 0.018)
      this.time.delayedCall(550, () => {
        overlay.destroy()
        bridge.emit(PHASER_EVENTS.OUTCOME, { isCorrect, reason, timeMs })
      })
      return
    }

    if (isCorrect) {
      const overlay = this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x00cc44, 0.25).setDepth(20)
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 650,
        onComplete: () => {
          overlay.destroy()
          bridge.emit(PHASER_EVENTS.OUTCOME, { isCorrect, reason, timeMs })
        },
      })
      return
    }

    // other violations: brief shake
    this.cameras.main.shake(220, 0.01)
    this.time.delayedCall(420, () => {
      bridge.emit(PHASER_EVENTS.OUTCOME, { isCorrect, reason, timeMs })
    })
  }
}
