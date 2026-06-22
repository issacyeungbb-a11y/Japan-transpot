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
  RoadType,
} from '../../data/types'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'

// ---- Colours ----
const ROAD_COLOR       = 0x4a4a4a
const ROAD_LINE        = 0xffffff
const SIDEWALK_COLOR   = 0x8a7c6a
const GRASS_COLOR      = 0x3d7a30
const INTERSECTION_COLOR = 0x555555
const HIGHWAY_SHOULDER = 0x888888  // concrete barrier strip
const HIGHWAY_ASPHALT  = 0x383838  // darker expressway surface

// ---- World geometry ----
// The world is taller than the camera viewport; the camera follows the car.
export const WORLD_HEIGHT = 1000
const CX = GAME_WIDTH / 2 // 400
const CY = 520             // intersection centre in world coords

const ROAD_W = 80
const INT = 80  // intersection square half-side * 2

// Japan left-hand traffic: player (northbound) keeps LEFT lane.
const NB_LANE_X = CX - 20 // 380  (city roads)

// Highway has two lanes per direction; player in left-half of left carriageway.
const HIGHWAY_W      = 160  // total road width
const HIGHWAY_NB_X   = CX - 40 // 360 — player's lane centre on highway

// Stop line is south of the pedestrian crossing, south of the intersection.
const STOP_LINE_Y = CY + INT / 2 + 50 // 610

// Player spawns near the bottom of the world.
const SPAWN_Y = WORLD_HEIGHT - 60 // 940

// Traffic light pole position (NE corner of intersection).
const LIGHT_X = CX + INT / 2 + 18 // 458
const LIGHT_Y = CY - INT / 2 - 6  // 474

// Goal zones – reaching one of these resolves the maneuver.
const GOAL_STRAIGHT_Y = CY - 220  // 300
const GOAL_RIGHT_X  = CX + 160    // 560
const GOAL_LEFT_X   = CX - 160    // 240

// ---- Physics ----
const CRUISE_SPEED = 90
const MAX_SPEED = 220
const ACCEL = 150
const BRAKE_DECEL = 320
const COAST_FRICTION = 20
const TURN_RATE = 2.5  // rad/s at full steering
const STOP_EPS = 8

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
  private goalGraphics!: Phaser.GameObjects.Graphics
  private lightContainer: Phaser.GameObjects.Container | null = null
  private lightLamp: Phaser.GameObjects.Graphics | null = null
  private npcs: NpcSprite[] = []
  private flashTimer: Phaser.Time.TimerEvent | null = null

  private scenario: Scenario | null = null
  private phase: Phase = 'idle'
  private currentRoadType: RoadType = 'cross'

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
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, WORLD_HEIGHT)

    this.roadGraphics = this.add.graphics()
    this.goalGraphics = this.add.graphics()
    this.buildRoad('cross', 'straight')

    this.car = this.createCar()
    this.resetCarToSpawn()

    // offsetY = -80 → camera shows 305 px of road AHEAD (north) and 145 px behind.
    this.cameras.main.startFollow(this.car, true, 1, 1, 0, -80)

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

  private buildRoad(roadType: RoadType, maneuver: Maneuver) {
    this.currentRoadType = roadType
    const g = this.roadGraphics
    g.clear()

    // Grass background (full world height)
    g.fillStyle(GRASS_COLOR)
    g.fillRect(0, 0, GAME_WIDTH, WORLD_HEIGHT)

    if (roadType === 'highway') {
      this.drawHighwayRoad(g)
    } else if (roadType === 'straight') {
      this.drawStraightRoad(g)
    } else {
      this.drawCrossRoad(g, roadType)
    }

    this.drawGoalMarker(maneuver)
  }

  private drawHighwayRoad(g: Phaser.GameObjects.Graphics) {
    const hw = HIGHWAY_W / 2  // 80

    // Concrete shoulder / barrier strips (wider than road)
    g.fillStyle(HIGHWAY_SHOULDER)
    g.fillRect(CX - hw - 14, 0, HIGHWAY_W + 28, WORLD_HEIGHT)

    // Expressway surface (two carriageways, 80 px each)
    g.fillStyle(HIGHWAY_ASPHALT)
    g.fillRect(CX - hw, 0, HIGHWAY_W, WORLD_HEIGHT)

    // Yellow centre divider line
    g.fillStyle(0xffcc00)
    g.fillRect(CX - 2, 0, 4, WORLD_HEIGHT)

    // White edge lines
    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - hw, 0, 4, WORLD_HEIGHT)  // left edge
    g.fillRect(CX + hw - 4, 0, 4, WORLD_HEIGHT)  // right edge

    // Dashed lane dividers inside each carriageway
    for (let y = 20; y < WORLD_HEIGHT; y += 40) {
      g.fillRect(CX - hw / 2 - 2, y, 4, 22)  // NB inner dash
      g.fillRect(CX + hw / 2 - 2, y, 4, 22)  // SB inner dash
    }

    // Guard-rail dots along the shoulder edges
    g.fillStyle(0xaaaaaa)
    for (let y = 10; y < WORLD_HEIGHT; y += 50) {
      g.fillRect(CX - hw - 11, y, 6, 6)
      g.fillRect(CX + hw + 5,  y, 6, 6)
    }

    // Distance markers every ~200 px
    g.fillStyle(0xffffff, 0.4)
    for (let y = 100; y < WORLD_HEIGHT; y += 200) {
      g.fillRect(CX - hw - 14, y, HIGHWAY_W + 28, 2)
    }
  }

  private drawStraightRoad(g: Phaser.GameObjects.Graphics) {
    // Sidewalk strips alongside the road
    g.fillStyle(SIDEWALK_COLOR)
    g.fillRect(CX - ROAD_W / 2 - 8, 0, ROAD_W + 16, WORLD_HEIGHT)

    // Road surface
    g.fillStyle(ROAD_COLOR)
    g.fillRect(CX - ROAD_W / 2, 0, ROAD_W, WORLD_HEIGHT)

    // Centre dashes
    g.fillStyle(ROAD_LINE)
    for (let y = 20; y < WORLD_HEIGHT; y += 30) {
      g.fillRect(CX - 2, y, 4, 18)
    }

    // Stop line south of the light
    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - ROAD_W / 2, STOP_LINE_Y, ROAD_W, 4)
  }

  private drawCrossRoad(g: Phaser.GameObjects.Graphics, roadType: RoadType) {
    // Sidewalks
    g.fillStyle(SIDEWALK_COLOR)
    g.fillRect(CX - ROAD_W / 2 - 8, 0, ROAD_W + 16, WORLD_HEIGHT)
    g.fillRect(0, CY - ROAD_W / 2 - 8, GAME_WIDTH, ROAD_W + 16)

    // Road surfaces
    g.fillStyle(ROAD_COLOR)
    g.fillRect(CX - ROAD_W / 2, 0, ROAD_W, WORLD_HEIGHT)
    g.fillRect(0, CY - ROAD_W / 2, GAME_WIDTH, ROAD_W)

    // Intersection box
    g.fillStyle(INTERSECTION_COLOR)
    g.fillRect(CX - INT / 2, CY - INT / 2, INT, INT)

    // For t-junction: paint over the north arm with grass+sidewalk to block it visually
    if (roadType === 't-junction') {
      g.fillStyle(SIDEWALK_COLOR)
      g.fillRect(CX - ROAD_W / 2 - 8, 0, ROAD_W + 16, CY - INT / 2)
      g.fillStyle(GRASS_COLOR)
      g.fillRect(CX - ROAD_W / 2, 0, ROAD_W, CY - INT / 2)
      // Dead-end wall at north edge of intersection
      g.fillStyle(0x886655)
      g.fillRect(CX - ROAD_W / 2, CY - INT / 2 - 6, ROAD_W, 6)
    }

    // Dashed centre lines
    g.fillStyle(ROAD_LINE)
    // North arm (only for cross)
    if (roadType === 'cross') {
      for (let y = 20; y < CY - INT / 2; y += 30) g.fillRect(CX - 2, y, 4, 18)
    }
    // South arm
    for (let y = CY + INT / 2 + 12; y < WORLD_HEIGHT; y += 30) g.fillRect(CX - 2, y, 4, 18)
    // East arm
    for (let x = CX + INT / 2 + 12; x < GAME_WIDTH; x += 30) g.fillRect(x, CY - 2, 18, 4)
    // West arm
    for (let x = 20; x < CX - INT / 2; x += 30) g.fillRect(x, CY - 2, 18, 4)

    // Stop lines (all four approaches)
    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - ROAD_W / 2, CY + INT / 2, ROAD_W, 4)      // south (player)
    if (roadType === 'cross') {
      g.fillRect(CX - ROAD_W / 2, CY - INT / 2 - 4, ROAD_W, 4) // north
    }
    g.fillRect(CX - INT / 2 - 4, CY - ROAD_W / 2, 4, ROAD_W)   // west
    g.fillRect(CX + INT / 2, CY - ROAD_W / 2, 4, ROAD_W)        // east

    // Zebra crossing on player's south approach
    for (let i = 0; i < 5; i++) {
      g.fillRect(CX - ROAD_W / 2 + i * 16, CY + INT / 2 + 16, 10, 18)
    }
    // Physical stop line south of crosswalk
    g.fillRect(CX - ROAD_W / 2, STOP_LINE_Y, ROAD_W, 4)
  }

  private drawGoalMarker(maneuver: Maneuver) {
    const g = this.goalGraphics
    g.clear()

    const ARROW_COLOR = 0x00e5ff
    g.fillStyle(ARROW_COLOR, 0.7)

    if (maneuver === 'straight') {
      // Three upward chevrons on the north road
      for (let i = 0; i < 3; i++) {
        const y = GOAL_STRAIGHT_Y + i * 40
        this.drawUpArrow(g, CX, y)
      }
      // Finish stripe
      g.fillStyle(0x00e5ff, 0.35)
      g.fillRect(CX - ROAD_W / 2, GOAL_STRAIGHT_Y - 10, ROAD_W, 8)
    } else if (maneuver === 'right') {
      // Rightward chevrons on the east arm
      for (let i = 0; i < 3; i++) {
        const x = GOAL_RIGHT_X - i * 40
        this.drawRightArrow(g, x, CY)
      }
      g.fillStyle(0x00e5ff, 0.35)
      g.fillRect(GOAL_RIGHT_X + 5, CY - ROAD_W / 2, 8, ROAD_W)
    } else {
      // Leftward chevrons on the west arm
      for (let i = 0; i < 3; i++) {
        const x = GOAL_LEFT_X + i * 40
        this.drawLeftArrow(g, x, CY)
      }
      g.fillStyle(0x00e5ff, 0.35)
      g.fillRect(GOAL_LEFT_X - 13, CY - ROAD_W / 2, 8, ROAD_W)
    }
  }

  private drawUpArrow(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillTriangle(x - 10, y + 6, x + 10, y + 6, x, y - 10)
    g.fillRect(x - 4, y + 6, 8, 12)
  }

  private drawRightArrow(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillTriangle(x + 10, y, x - 6, y - 10, x - 6, y + 10)
    g.fillRect(x - 18, y - 4, 12, 8)
  }

  private drawLeftArrow(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillTriangle(x - 10, y, x + 6, y - 10, x + 6, y + 10)
    g.fillRect(x + 6, y - 4, 12, 8)
  }

  // ================= Car =================

  private createCar(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(0x1565c0)
    g.fillRoundedRect(-16, -26, 32, 52, 6)
    g.fillStyle(0x90caf9)
    g.fillRect(-11, -19, 22, 14)
    g.fillStyle(0x90caf9)
    g.fillRect(-11, 9, 22, 10)
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

  private resetCarToSpawn(roadType: RoadType = 'cross') {
    this.speed = 0
    this.heading = 0
    const spawnX = roadType === 'highway' ? HIGHWAY_NB_X : NB_LANE_X
    this.car.setPosition(spawnX, SPAWN_Y)
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

    const lx = this.currentRoadType === 'straight' ? CX + ROAD_W / 2 + 12 : LIGHT_X
    const ly = this.currentRoadType === 'straight' ? STOP_LINE_Y - 30 : LIGHT_Y
    const c = this.add.container(lx, ly, [g, lamp])
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
        this.drawArrowGlyph(lamp, 0, 2 + i * 11, arrow)
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
      obj.setVisible(false)
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

    const roadType: RoadType = scenario.roadType ?? 'cross'
    this.buildRoad(roadType, scenario.maneuver)
    this.resetCarToSpawn(roadType)

    this.clearLight()
    this.currentLight = scenario.light
    if (scenario.light) this.drawLight(scenario.light)

    this.spawnNPCs(scenario)

    bridge.emit(PHASER_EVENTS.SCENARIO_READY, {
      instruction: scenario.instruction,
      maneuver: scenario.maneuver,
    })

    this.time.delayedCall(1700, () => {
      if (this.phase !== 'ready') return
      this.phase = 'drive'
      this.speed = CRUISE_SPEED
      this.driveStart = this.time.now

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
    const left     = inputState.left     || this.cursors?.left.isDown  || this.keyA?.isDown || false
    const right    = inputState.right    || this.cursors?.right.isDown || this.keyD?.isDown || false
    const throttle = inputState.throttle || this.cursors?.up.isDown    || this.keyW?.isDown || false
    const brake    = inputState.brake    || this.cursors?.down.isDown  || this.keyS?.isDown || false
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
      if (t < 0) { obj.setVisible(false); return }
      obj.setVisible(true)
      const dx = def.endX - def.startX
      const dy = def.endY - def.startY
      const dist = Math.hypot(dx, dy)
      const progress = dist === 0 ? 1 : Math.min(1, (def.speed * t / 1000) / dist)
      obj.x = def.startX + dx * progress
      obj.y = def.startY + dy * progress
    })
  }

  private evaluate(elapsed: number) {
    const ev = this.scenario!.evaluation
    const maneuver = this.scenario!.maneuver
    const roadType: RoadType = this.scenario!.roadType ?? 'cross'

    // 1) Collision
    for (const { def, obj } of this.npcs) {
      if (!obj.visible) continue
      const r = def.type === 'pedestrian' ? NPC_PED_R : NPC_CAR_R
      if (Math.hypot(this.car.x - obj.x, this.car.y - obj.y) < CAR_R + r) {
        return this.resolve('collision')
      }
    }

    // 2) Full-stop tracking (before the line)
    if (!this.crossedLine && this.speed < STOP_EPS && this.car.y > STOP_LINE_Y) {
      this.hasStopped = true
    }

    // 3) Crossing the stop line
    if (!this.crossedLine && this.car.y <= STOP_LINE_Y) {
      this.crossedLine = true
      if (ev.mustStop && !this.hasStopped) return this.resolve('no_full_stop')
      if (ev.waitForGo && !canCrossLine(this.currentLight, maneuver)) return this.resolve('ran_red')
      if (!canCrossLine(this.currentLight, maneuver)) return this.resolve('ran_red')
    }

    // 4) Goal reached
    const done = this.reachedGoal(roadType)
    if (done) {
      if (ev.allowedManeuvers && !ev.allowedManeuvers.includes(done)) return this.resolve('wrong_way')
      return this.resolve('success')
    }

    // 5) Off-road
    if (elapsed > 250 && this.isOffRoad(roadType)) return this.resolve('off_road')

    // 6) Timeout
    if (elapsed > 28000) return this.resolve('timeout')
  }

  private reachedGoal(roadType: RoadType): Maneuver | null {
    if (roadType === 'highway') {
      // Wide tolerance matching the highway width
      if (this.car.y < GOAL_STRAIGHT_Y && Math.abs(this.car.x - CX) < HIGHWAY_W / 2 + 6) return 'straight'
      return null
    }
    if (roadType !== 't-junction') {
      if (this.car.y < GOAL_STRAIGHT_Y && Math.abs(this.car.x - CX) < 44) return 'straight'
    }
    if (this.car.x > GOAL_RIGHT_X && Math.abs(this.car.y - CY) < 44) return 'right'
    if (this.car.x < GOAL_LEFT_X  && Math.abs(this.car.y - CY) < 44) return 'left'
    return null
  }

  private isOffRoad(roadType: RoadType): boolean {
    if (roadType === 'highway') {
      return Math.abs(this.car.x - CX) > HIGHWAY_W / 2 + 6
    }

    const onNS = Math.abs(this.car.x - CX) <= ROAD_W / 2 + 6
    const onEW = Math.abs(this.car.y - CY) <= ROAD_W / 2 + 6

    if (roadType === 'straight') {
      return !onNS
    }
    if (roadType === 't-junction') {
      if (this.car.y < CY - INT / 2 - 4 && onNS) return true
      return !onNS && !onEW
    }
    // cross
    return !onNS && !onEW
  }

  private resolve(reason: OutcomeReason) {
    if (this.resolved) return
    this.resolved = true
    this.phase = 'done'
    const isCorrect = reason === 'success'
    const timeMs = this.time.now - this.driveStart

    if (reason === 'collision') {
      const overlay = this.add.rectangle(this.car.x, this.car.y, GAME_WIDTH * 2, GAME_HEIGHT * 2, 0xff0000, 0.35).setDepth(20)
      this.cameras.main.shake(350, 0.018)
      this.time.delayedCall(550, () => {
        overlay.destroy()
        bridge.emit(PHASER_EVENTS.OUTCOME, { isCorrect, reason, timeMs })
      })
      return
    }

    if (isCorrect) {
      const overlay = this.add.rectangle(this.car.x, this.car.y, GAME_WIDTH * 2, GAME_HEIGHT * 2, 0x00cc44, 0.25).setDepth(20)
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

    this.cameras.main.shake(220, 0.01)
    this.time.delayedCall(420, () => {
      bridge.emit(PHASER_EVENTS.OUTCOME, { isCorrect, reason, timeMs })
    })
  }
}
