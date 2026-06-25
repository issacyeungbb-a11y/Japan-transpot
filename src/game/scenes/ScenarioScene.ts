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
import { GAME_WIDTH, GAME_HEIGHT } from '../dimensions'

// ---- Colours ----
const ROAD_COLOR       = 0x4a4a4a
const ROAD_LINE        = 0xffffff
const SIDEWALK_COLOR   = 0x8a7c6a
const GRASS_COLOR      = 0x3d7a30
const INTERSECTION_COLOR = 0x555555
const HIGHWAY_SHOULDER = 0x888888  // concrete barrier strip
const HIGHWAY_ASPHALT  = 0x383838  // darker expressway surface

// Roadside building palettes (Okinawa-flavoured: terracotta, sandstone, white concrete).
// wall = shaded south face, roof = lit top face, edge = bright rim, win = window glass.
interface BuildingPalette { wall: number; roof: number; edge: number; win: number }
const BUILDING_PALETTES: BuildingPalette[] = [
  { wall: 0xa9786c, roof: 0xc99a8c, edge: 0xe6bdac, win: 0x352824 }, // terracotta
  { wall: 0x88a0ab, roof: 0xaabdc7, edge: 0xd2e3ec, win: 0x213039 }, // grey-blue
  { wall: 0xc2ac80, roof: 0xe0cda0, edge: 0xf0e2bd, win: 0x3a3320 }, // sandstone
  { wall: 0x93aa88, roof: 0xb6c9aa, edge: 0xd6e4cc, win: 0x26301f }, // soft green
  { wall: 0xcfc8ba, roof: 0xeae4d8, edge: 0xf7f3ea, win: 0x33302a }, // white concrete
]

// ---- World geometry ----
// The world is taller than the camera viewport; the camera follows the car.
export const WORLD_HEIGHT = 1000
const CX = GAME_WIDTH / 2 // 400
const CY = 520             // intersection centre in world coords

const ROAD_W = 80
const NARROW_ROAD_W = 56
const INT = 80  // intersection square half-side * 2

// Japan left-hand traffic: player (northbound) keeps LEFT lane.
const NB_LANE_X = CX - 20 // 380  (city roads)
const NARROW_NB_X = CX - 14

// Highway has two lanes per direction; player in left-half of left carriageway.
const HIGHWAY_W      = 160  // total road width
const HIGHWAY_NB_X   = CX - 40 // 360 — player's lane centre on highway

// Bus-lane scenario: a wider same-direction road with a blue 「バス専用」 lane on
// the LEFT and a normal lane on the RIGHT. The player must keep to the right.
const BUS_ROAD_W   = 120
const BUS_LANE_X   = CX - 30 // 370 — blue bus-only lane centre (left)
const BUS_NORMAL_X = CX + 30 // 430 — normal lane centre (player keeps right)

// Stop line is south of the pedestrian crossing, south of the intersection.
const STOP_LINE_Y = CY + INT / 2 + 50 // 610
const CROSSWALK_Y = CY + INT / 2 + 48

// Player spawns near the bottom of the world.
const SPAWN_Y = WORLD_HEIGHT - 60 // 940

// Traffic light pole: right side of player's approach lane, just north of stop line.
// Placed at y=580 so it is visible from spawn (camera shows y≥580 within 55px of travel).
const LIGHT_X = CX + ROAD_W / 2 + 12 // 452
const LIGHT_Y = STOP_LINE_Y - 30      // 580

// Goal zones – reaching one of these resolves the maneuver.
const GOAL_STRAIGHT_Y = CY - 220  // 300
const GOAL_RIGHT_X  = CX + 160    // 560
const GOAL_LEFT_X   = CX - 160    // 240

// ---- Physics ----
const CRUISE_SPEED = 60   // start speed — 50 km/h equivalent
const MAX_SPEED = 120     // hard ceiling (~100 km/h) when no limit is posted
const ACCEL = 55          // gradual throttle feel
const BRAKE_DECEL = 320
const COAST_FRICTION = 20 // gentle roll-off when off the throttle
const TURN_RATE = 2.5  // rad/s at full steering
const STOP_EPS = 12       // speed threshold (px/s) that counts as "fully stopped"
// Below this speed (≈30 km/h) the player is treated as crawling/yielding, so a
// careful driver who slows right down for a pedestrian or priority car is never
// failed for "not yielding". Only barrelling through at speed is punished.
const YIELD_CREEP_SPEED = 36

// World px → km/h so the speedometer reads like a real car.
// Chosen so the natural cruise (60 px/s) shows 50 km/h — the common Okinawa
// local limit — and full throttle tops out around 133 km/h.
const KMH_PER_PX = 50 / CRUISE_SPEED
// How far over the posted limit (km/h) is tolerated, and for how long (ms),
// before it counts as a speeding violation. A short overshoot is forgiven.
// The throttle is also capped per-scenario (see maxSpeedPx) at limit+THROTTLE_
// HEADROOM, which is BELOW this tolerance — so simply holding the gas can never
// trip a speeding fault; only a deliberate, sustained overshoot does.
const SPEED_TOLERANCE = 22
const SPEED_GRACE_MS = 1600
// Holding the throttle settles the car this far (km/h) above the posted limit —
// fast enough to feel responsive, slow enough to stay clear of a violation and
// to never rush a stop line before the light turns.
const THROTTLE_HEADROOM = 12

// Wet road: brakes bite less (longer stopping distance) and grip drops.
const RAIN_BRAKE_FACTOR = 0.55
const RAIN_TURN_FACTOR = 0.78

// ETC toll gate: line the player must cross at ETC crawl speed or hit the bar.
const GATE_Y = 770
const ETC_MAX_KMH = 25

// ---- Collision radii ----
const CAR_R = 15
const NPC_CAR_R = 14
const NPC_PED_R = 8

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
  private lightHousing: Phaser.GameObjects.Graphics | null = null
  private npcs: NpcSprite[] = []
  private flashTimer: Phaser.Time.TimerEvent | null = null
  private stopSign: Phaser.GameObjects.Container | null = null
  private tollGate: Phaser.GameObjects.Container | null = null
  private tollBar: Phaser.GameObjects.Rectangle | null = null
  private rainLayer: Phaser.GameObjects.Container | null = null
  private busSprite: Phaser.GameObjects.Container | null = null
  private busLabels: Phaser.GameObjects.Text[] = []
  private busY = 0

  // Fixed (camera-locked) speedometer + speed-limit sign HUD.
  private speedReadout!: Phaser.GameObjects.Text
  private limitSign!: Phaser.GameObjects.Container
  private limitSignNumber!: Phaser.GameObjects.Text

  private scenario: Scenario | null = null
  private phase: Phase = 'idle'

  // car kinematic state
  private speed = 0
  private heading = 0 // radians, 0 = north (up)
  private maxSpeedPx = MAX_SPEED // throttle ceiling for the current scenario

  // evaluation state
  private driveStart = 0
  private currentLight: TrafficLightState | null = null
  private hasStopped = false
  private crossedLine = false
  private resolved = false
  private speedLimit = 0      // km/h; 0 = no posted limit
  private overspeedMs = 0     // accumulated time spent over the limit
  private raining = false
  private hasTollGate = false
  private tollPassed = false
  private hasBusLane = false
  private hasNarrowRoad = false
  private hasCrosswalk = false

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

    this.buildSpeedHud()

    // Phaser formula: scrollY = car.y - followOffset.y - height/2
    // So positive followOffset.y shifts car DOWN the canvas (shows more road AHEAD).
    // +150 → car at screen y 375/450 (83%), 375 px of road ahead visible.
    this.cameras.main.startFollow(this.car, true, 1, 1, 0, 150)

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys()
      this.keyW = this.input.keyboard.addKey('W')
      this.keyA = this.input.keyboard.addKey('A')
      this.keyS = this.input.keyboard.addKey('S')
      this.keyD = this.input.keyboard.addKey('D')
    }

    this.addVignette()

    bridge.on(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
    bridge.on(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)

    // Use Phaser's own lifecycle event so cleanup is guaranteed when game.destroy() is called.
    // Defining a destroy() method on the class is NOT called automatically by Phaser.
    this.events.once('destroy', () => {
      bridge.off(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
      bridge.off(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)
    })

    bridge.emit(PHASER_EVENTS.SCENE_READY)
  }

  // ================= Road =================

  private buildRoad(roadType: RoadType, maneuver: Maneuver) {
    const g = this.roadGraphics
    g.clear()
    // Remove any bus-lane markings/sprite left over from a previous scenario;
    // drawBusLaneRoad re-creates them when this scenario uses a bus lane.
    this.clearBusLane()

    // Grass background (full world height) + organic texture
    g.fillStyle(GRASS_COLOR)
    g.fillRect(0, 0, GAME_WIDTH, WORLD_HEIGHT)
    this.drawGrassDetail(g)

    // Roadside scenery sits on the grass first; the roads/sidewalks are painted
    // on top afterwards, so nothing can bleed onto the carriageway.
    this.drawScenery(g, roadType)

    if (roadType === 'highway') {
      this.drawHighwayRoad(g)
    } else if (roadType === 'straight') {
      if (this.hasBusLane) this.drawBusLaneRoad(g)
      else if (this.hasNarrowRoad) this.drawNarrowRoad(g)
      else this.drawStraightRoad(g)
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

    this.drawCurbsV(g)
    this.drawAsphaltShadingV(g)

    // Centre dashes
    g.fillStyle(ROAD_LINE)
    for (let y = 20; y < WORLD_HEIGHT; y += 30) {
      g.fillRect(CX - 2, y, 4, 18)
    }

    // Stop line south of the light
    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - ROAD_W / 2, STOP_LINE_Y, ROAD_W, 4)
    if (this.hasCrosswalk) this.drawSouthCrosswalk(g, ROAD_W)
  }

  private drawNarrowRoad(g: Phaser.GameObjects.Graphics) {
    const hw = NARROW_ROAD_W / 2

    // Concrete walls/gutters hugging the road, common in older Okinawa streets.
    g.fillStyle(0x6f6f6f)
    g.fillRect(CX - hw - 12, 0, 8, WORLD_HEIGHT)
    g.fillRect(CX + hw + 4, 0, 8, WORLD_HEIGHT)
    g.fillStyle(0x2f5f2f)
    g.fillRect(CX - hw - 4, 0, 4, WORLD_HEIGHT)
    g.fillRect(CX + hw, 0, 4, WORLD_HEIGHT)

    g.fillStyle(ROAD_COLOR)
    g.fillRect(CX - hw, 0, NARROW_ROAD_W, WORLD_HEIGHT)

    // Faded centre dashes: visually present but easy to drift over.
    g.fillStyle(ROAD_LINE, 0.55)
    for (let y = 16; y < WORLD_HEIGHT; y += 42) {
      g.fillRect(CX - 1, y, 2, 22)
    }

    // Small passing bay and mirrors/signage cues.
    g.fillStyle(0x555555)
    g.fillRoundedRect(CX - hw - 22, 430, 22, 130, 5)
    g.fillStyle(0xffcc00)
    g.fillTriangle(CX + hw + 10, 690, CX + hw + 34, 690, CX + hw + 22, 714)
    const sign = this.add
      .text(CX + hw + 22, 700, '狭', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#111111' })
      .setOrigin(0.5)
      .setDepth(2)
    this.busLabels.push(sign)

    g.fillStyle(ROAD_LINE)
    g.fillRect(CX - hw, STOP_LINE_Y, NARROW_ROAD_W, 4)
    if (this.hasCrosswalk) this.drawSouthCrosswalk(g, NARROW_ROAD_W)
  }

  private drawBusLaneRoad(g: Phaser.GameObjects.Graphics) {
    const hw = BUS_ROAD_W / 2 // 60

    // Sidewalks
    g.fillStyle(SIDEWALK_COLOR)
    g.fillRect(CX - hw - 8, 0, BUS_ROAD_W + 16, WORLD_HEIGHT)

    // Asphalt
    g.fillStyle(ROAD_COLOR)
    g.fillRect(CX - hw, 0, BUS_ROAD_W, WORLD_HEIGHT)

    // Blue 「バス専用」 lane on the LEFT (x = CX-hw .. CX)
    g.fillStyle(0x15518a, 0.85)
    g.fillRect(CX - hw, 0, hw, WORLD_HEIGHT)

    // Lane divider (dashed white down the middle) + outer edge lines
    g.fillStyle(ROAD_LINE)
    for (let y = 20; y < WORLD_HEIGHT; y += 36) g.fillRect(CX - 2, y, 4, 20)
    g.fillRect(CX - hw, 0, 3, WORLD_HEIGHT)
    g.fillRect(CX + hw - 3, 0, 3, WORLD_HEIGHT)

    // Repeated 「バス専用」 markings painted in the blue lane.
    this.clearBusLabels()
    for (let y = 180; y < WORLD_HEIGHT; y += 240) {
      const label = this.add
        .text(BUS_LANE_X, y, 'バス\n専用', {
          fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold',
          color: '#ffffff', align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(2)
      this.busLabels.push(label)
    }
  }

  private clearBusLabels() {
    this.busLabels.forEach((l) => l.destroy())
    this.busLabels = []
  }

  private clearBusLane() {
    this.clearBusLabels()
    this.busSprite?.destroy()
    this.busSprite = null
  }

  // A long city bus that crawls up the bus-only lane.
  private createBus(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(0x2e7d32)
    g.fillRoundedRect(-17, -38, 34, 76, 6)
    g.fillStyle(0xcfe8d0)
    g.fillRect(-13, -30, 26, 16)  // windscreen band
    g.fillRect(-13, -8, 26, 14)
    g.fillRect(-13, 12, 26, 14)
    g.fillStyle(0xffd54f)
    g.fillRect(-13, 30, 8, 5)
    g.fillRect(5, 30, 8, 5)
    const c = this.add.container(BUS_LANE_X, 0, [g])
    c.setDepth(8)
    return c
  }

  private updateBus(dt: number) {
    if (!this.busSprite) return
    // Crawls north (up); wraps back to the bottom of the view.
    this.busY -= 60 * dt
    if (this.busY < -80) this.busY = SPAWN_Y - 40
    this.busSprite.y = this.busY
  }

  // Raised curb on a vertical (N–S) road: bright top edge + shadow cast onto asphalt.
  private drawCurbsV(g: Phaser.GameObjects.Graphics, y0 = 0, y1 = WORLD_HEIGHT) {
    g.fillStyle(0xc6b69e) // sunlit curb top
    g.fillRect(CX - ROAD_W / 2 - 8, y0, 3, y1 - y0)
    g.fillRect(CX + ROAD_W / 2 + 5, y0, 3, y1 - y0)
    g.fillStyle(0x000000, 0.22) // curb shadow on the road
    g.fillRect(CX - ROAD_W / 2, y0, 5, y1 - y0)
    g.fillRect(CX + ROAD_W / 2 - 5, y0, 5, y1 - y0)
  }

  // Darken the asphalt toward its edges so the centre reads as a raised crown.
  private drawAsphaltShadingV(g: Phaser.GameObjects.Graphics, y0 = 0, y1 = WORLD_HEIGHT) {
    g.fillStyle(0x000000, 0.10)
    g.fillRect(CX - ROAD_W / 2 + 5, y0, 7, y1 - y0)
    g.fillRect(CX + ROAD_W / 2 - 12, y0, 7, y1 - y0)
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

    // Raised curbs + asphalt crown shading on both arms (intersection box repaints centre)
    this.drawCurbsV(g)
    this.drawAsphaltShadingV(g)
    g.fillStyle(0xc6b69e)
    g.fillRect(0, CY - ROAD_W / 2 - 8, GAME_WIDTH, 3)
    g.fillRect(0, CY + ROAD_W / 2 + 5, GAME_WIDTH, 3)
    g.fillStyle(0x000000, 0.22)
    g.fillRect(0, CY - ROAD_W / 2, GAME_WIDTH, 5)
    g.fillRect(0, CY + ROAD_W / 2 - 5, GAME_WIDTH, 5)

    // Intersection box (raised slightly: soft drop-shadow on the south/east approaches)
    g.fillStyle(0x000000, 0.18)
    g.fillRect(CX - INT / 2 + 3, CY - INT / 2 + 3, INT, INT)
    g.fillStyle(INTERSECTION_COLOR)
    g.fillRect(CX - INT / 2, CY - INT / 2, INT, INT)
    // tactile paving sheen across the box
    g.fillStyle(0xffffff, 0.04)
    g.fillRect(CX - INT / 2, CY - INT / 2, INT, INT / 2)

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
    this.drawSouthCrosswalk(g, ROAD_W)
    // Physical stop line south of crosswalk
    g.fillRect(CX - ROAD_W / 2, STOP_LINE_Y, ROAD_W, 4)
  }

  private drawSouthCrosswalk(g: Phaser.GameObjects.Graphics, width: number) {
    const stripeCount = Math.max(4, Math.floor(width / 16))
    const stripeW = Math.max(8, width / stripeCount - 6)
    for (let i = 0; i < stripeCount; i++) {
      g.fillRect(CX - width / 2 + i * (width / stripeCount) + 3, CROSSWALK_Y - 9, stripeW, 18)
    }
  }

  // ================= Scenery (buildings, trees, grass) =================

  // Deterministic LCG so the same scenario always lays out identically.
  private rngFactory(seed: number) {
    let s = seed >>> 0
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      return s / 0xffffffff
    }
  }

  private drawGrassDetail(g: Phaser.GameObjects.Graphics) {
    const rnd = this.rngFactory(0x9e37)
    for (let i = 0; i < 70; i++) {
      const x = rnd() * GAME_WIDTH
      const y = rnd() * WORLD_HEIGHT
      g.fillStyle(rnd() > 0.5 ? 0x356b29 : 0x4f9040, 0.22)
      g.fillEllipse(x, y, 28 + rnd() * 46, 18 + rnd() * 26)
    }
  }

  private drawScenery(g: Phaser.GameObjects.Graphics, roadType: RoadType) {
    if (roadType === 'highway') {
      // Expressway runs through open country: tree lines either side, no city blocks.
      const rnd = this.rngFactory(0x5151)
      for (let y = 30; y < WORLD_HEIGHT; y += 70 + (rnd() * 30 | 0)) {
        this.drawTree(g, 40 + rnd() * 150, y, 0.9 + rnd() * 0.7)
        this.drawTree(g, GAME_WIDTH - 40 - rnd() * 150, y + 20, 0.9 + rnd() * 0.7)
      }
      return
    }

    const leftMax  = CX - ROAD_W / 2 - 12
    const rightMin = CX + ROAD_W / 2 + 12
    // For cross/T roads, keep the horizontal carriageway band clear.
    const band: [number, number] | null =
      roadType === 'straight' ? null : [CY - ROAD_W / 2 - 16, CY + ROAD_W / 2 + 16]

    this.placeBlocks(g, 14, leftMax - 6, band, 0x1a2b)
    this.placeBlocks(g, rightMin + 6, GAME_WIDTH - 14, band, 0x7c3f)
  }

  private placeBlocks(
    g: Phaser.GameObjects.Graphics,
    xStart: number,
    xEnd: number,
    band: [number, number] | null,
    seed: number,
  ) {
    const rnd = this.rngFactory(seed)
    let y = 36
    while (y < WORLD_HEIGHT - 70) {
      const w = 58 + (rnd() * 42 | 0)
      const depth = 16 + (rnd() * 10 | 0)
      const wallH = 28 + (rnd() * 44 | 0)
      const total = depth + wallH
      // Skip anything that would intrude on the cross-road band.
      if (band && y + total + 10 > band[0] && y < band[1]) {
        y = band[1] + 10
        continue
      }
      const span = Math.max(6, xEnd - xStart - w)
      const x = xStart + (rnd() * span | 0)
      if (rnd() > 0.8) {
        this.drawTree(g, x + w / 2, y + total - 6, 0.8 + rnd() * 0.6)
      } else {
        this.drawBuilding(g, x, y, w, depth, wallH, rnd())
      }
      y += total + 14 + (rnd() * 22 | 0)
    }
  }

  // 2.5-D building: lit roof (top), shaded south wall with windows, cast shadow.
  private drawBuilding(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, depth: number, wallH: number, t: number,
  ) {
    const p = BUILDING_PALETTES[Math.min(BUILDING_PALETTES.length - 1, t * BUILDING_PALETTES.length | 0)]
    const frontY = y + depth

    // Cast shadow toward the bottom-right (light from upper-left)
    g.fillStyle(0x000000, 0.16)
    g.fillRect(x + 6, y + 8, w, depth + wallH)

    // South wall (front face)
    g.fillStyle(p.wall)
    g.fillRect(x, frontY, w, wallH)
    // grounded contact shadow
    g.fillStyle(0x000000, 0.14)
    g.fillRect(x, frontY + wallH - Math.min(9, wallH), w, Math.min(9, wallH))

    // Windows grid on the wall
    g.fillStyle(p.win, 0.9)
    const cols = Math.max(2, w / 17 | 0)
    const rows = Math.max(1, wallH / 16 | 0)
    const cw = (w - 8) / cols
    const rh = (wallH - 6) / rows
    for (let ci = 0; ci < cols; ci++) {
      for (let ri = 0; ri < rows; ri++) {
        g.fillRect(x + 5 + ci * cw, frontY + 5 + ri * rh, Math.max(3, cw - 5), Math.max(3, rh - 6))
      }
    }

    // Roof (top face) + bright rim + parapet shadow line
    g.fillStyle(p.roof)
    g.fillRect(x, y, w, depth)
    g.fillStyle(p.edge)
    g.fillRect(x, y, w, 2)
    g.fillStyle(0x000000, 0.2)
    g.fillRect(x, frontY - 2, w, 2)
    // rooftop unit (AC / tank)
    g.fillStyle(p.edge)
    g.fillRect(x + 6, y + 4, 12, Math.max(3, depth - 8))
  }

  // Layered canopy + trunk + soft shadow for a rounded, voluminous tree.
  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, s = 1) {
    const r = 12 * s
    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(x + 4, y + 6, r * 2.3, r * 1.3)
    g.fillStyle(0x6b4a2b)
    g.fillRect(x - 2 * s, y - 2 * s, 4 * s, 10 * s)
    g.fillStyle(0x2e6b32)
    g.fillCircle(x, y - 6 * s, r)
    g.fillStyle(0x3c8a42)
    g.fillCircle(x - 3 * s, y - 9 * s, r * 0.7)
    g.fillStyle(0x5bb061)
    g.fillCircle(x - 5 * s, y - 11 * s, r * 0.42) // top-left highlight
  }

  // Camera-fixed cinematic vignette to frame the scene and add depth.
  private addVignette() {
    const v = this.add.graphics()
    v.setScrollFactor(0)
    v.setDepth(50)
    const B = 0x000000
    // top (strongest — frames the horizon)
    v.fillGradientStyle(B, B, B, B, 0.5, 0.5, 0, 0)
    v.fillRect(0, 0, GAME_WIDTH, 90)
    // bottom (kept short/light so it never dims the car at ~83% height)
    v.fillGradientStyle(B, B, B, B, 0, 0, 0.4, 0.4)
    v.fillRect(0, GAME_HEIGHT - 45, GAME_WIDTH, 45)
    // sides
    v.fillGradientStyle(B, B, B, B, 0.4, 0, 0.4, 0)
    v.fillRect(0, 0, 64, GAME_HEIGHT)
    v.fillGradientStyle(B, B, B, B, 0, 0.4, 0, 0.4)
    v.fillRect(GAME_WIDTH - 64, 0, 64, GAME_HEIGHT)
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

  // ================= Speed HUD =================

  // A camera-locked speedometer (bottom-left) and a Japanese round speed-limit
  // sign (top-right). Built once; values updated each frame.
  private buildSpeedHud() {
    // Speedometer: big number + km/h unit on a dark pill.
    const pill = this.add.graphics()
    pill.fillStyle(0x0d1b2a, 0.72)
    pill.fillRoundedRect(10, GAME_HEIGHT - 56, 116, 44, 10)
    pill.lineStyle(2, 0x1a4e8c, 0.8)
    pill.strokeRoundedRect(10, GAME_HEIGHT - 56, 116, 44, 10)
    pill.setScrollFactor(0).setDepth(30)

    this.speedReadout = this.add
      .text(96, GAME_HEIGHT - 50, '0', { fontFamily: 'monospace', fontSize: '30px', color: '#ffffff' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(31)
    this.add
      .text(100, GAME_HEIGHT - 30, 'km/h', { fontFamily: 'monospace', fontSize: '12px', color: '#9fb3c8' })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(31)

    // Speed-limit sign: white disc, red ring, black number (JP regulatory sign).
    const disc = this.add.graphics()
    disc.fillStyle(0xd32f2f)
    disc.fillCircle(0, 0, 24)
    disc.fillStyle(0xffffff)
    disc.fillCircle(0, 0, 18)
    this.limitSignNumber = this.add
      .text(0, 0, '50', { fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#111111' })
      .setOrigin(0.5, 0.5)
    this.limitSign = this.add
      .container(GAME_WIDTH - 36, 36, [disc, this.limitSignNumber])
      .setScrollFactor(0)
      .setDepth(31)
      .setVisible(false)
  }

  private updateSpeedHud() {
    const kmh = Math.round(this.speed * KMH_PER_PX)
    this.speedReadout.setText(String(kmh))
    // Turn the readout amber/red as it approaches and exceeds the limit.
    if (this.speedLimit > 0 && kmh > this.speedLimit + SPEED_TOLERANCE) {
      this.speedReadout.setColor('#ff4d4d')
    } else if (this.speedLimit > 0 && kmh > this.speedLimit) {
      this.speedReadout.setColor('#ffcc00')
    } else {
      this.speedReadout.setColor('#ffffff')
    }
  }

  private applySpeedLimitSign() {
    if (this.speedLimit > 0) {
      this.limitSignNumber.setText(String(this.speedLimit))
      this.limitSign.setVisible(true)
    } else {
      this.limitSign.setVisible(false)
    }
  }

  // ================= 止まれ stop sign =================

  private clearStopSign() {
    this.stopSign?.destroy()
    this.stopSign = null
  }

  // Red inverted triangle with white 「止まれ」, planted beside the stop line
  // on the player's approach — the Japanese mandatory-stop sign.
  private drawStopSign() {
    this.clearStopSign()
    const g = this.add.graphics()
    g.fillStyle(0xffffff)
    g.fillTriangle(-24, -16, 24, -16, 0, 24)
    g.fillStyle(0xd32f2f)
    g.fillTriangle(-19, -13, 19, -13, 0, 18)
    const label = this.add
      .text(0, -2, '止まれ', { fontFamily: 'sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5, 0.5)
    const c = this.add.container(LIGHT_X, STOP_LINE_Y - 24, [g, label])
    c.setDepth(7)
    this.stopSign = c
  }

  // ================= ETC toll gate =================

  private clearTollGate() {
    this.tollGate?.destroy()
    this.tollGate = null
    this.tollBar = null
  }

  // An expressway toll plaza: a gantry across the road with a green ETC lane
  // and a drop-bar that the player must approach at crawl speed.
  private drawTollGate() {
    this.clearTollGate()
    const w = HIGHWAY_W / 2 + 14
    const parts: Phaser.GameObjects.GameObject[] = []

    // Concrete gantry / island band across the carriageway.
    const band = this.add.rectangle(0, 0, w * 2, 26, 0x2b2b2b).setStrokeStyle(2, 0x111111)
    parts.push(band)

    // Green ETC lane marker over the player's lane (x = HIGHWAY_NB_X relative).
    const etcX = HIGHWAY_NB_X - CX
    const etcPad = this.add.rectangle(etcX, 0, 44, 26, 0x1b5e20)
    const etcText = this.add
      .text(etcX, 0, 'ETC', { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#9cffb0' })
      .setOrigin(0.5)
    parts.push(etcPad, etcText)

    // Drop-bar over the ETC lane (raised look = thin bar). Kept as a field so we
    // can flick it up when the player clears the gate slowly enough.
    const bar = this.add.rectangle(etcX, 16, 40, 6, 0xffd54f).setStrokeStyle(1, 0x7a5b00)
    this.tollBar = bar
    parts.push(bar)

    const c = this.add.container(CX, GATE_Y, parts)
    c.setDepth(7)
    this.tollGate = c
  }

  // ================= Rain =================

  private clearRain() {
    this.rainLayer?.destroy()
    this.rainLayer = null
  }

  // A camera-locked downpour: a dim tint plus drifting rain streaks.
  private buildRain() {
    this.clearRain()
    const tint = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14233a, 0.32)
    const streaks: Phaser.GameObjects.GameObject[] = [tint]
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH)
      const y = Phaser.Math.Between(0, GAME_HEIGHT)
      const s = this.add.rectangle(x, y, 2, Phaser.Math.Between(8, 16), 0xbfd4e8, 0.5)
      streaks.push(s)
    }
    this.rainLayer = this.add.container(0, 0, streaks).setScrollFactor(0).setDepth(28)
  }

  private updateRain(dt: number) {
    if (!this.rainLayer) return
    const fall = 900 * dt
    // Skip the tint (index 0); animate the streaks.
    const list = this.rainLayer.list
    for (let i = 1; i < list.length; i++) {
      const s = list[i] as Phaser.GameObjects.Rectangle
      s.y += fall
      if (s.y > GAME_HEIGHT) {
        s.y = -10
        s.x = Phaser.Math.Between(0, GAME_WIDTH)
      }
    }
  }

  // ================= Car =================

  private createCar(): Phaser.GameObjects.Container {
    // Soft drop shadow (behind everything) lifts the car off the road.
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.28)
    shadow.fillEllipse(3, 5, 42, 60)

    const g = this.add.graphics()
    // wheels first (under the body)
    g.fillStyle(0x0a0a0a)
    g.fillRoundedRect(-20, -20, 6, 13, 2)
    g.fillRoundedRect(14, -20, 6, 13, 2)
    g.fillRoundedRect(-20, 7, 6, 13, 2)
    g.fillRoundedRect(14, 7, 6, 13, 2)
    // body: dark base + lighter inset for a rounded sheen
    g.fillStyle(0x0d47a1)
    g.fillRoundedRect(-16, -26, 32, 52, 7)
    g.fillStyle(0x1976d2)
    g.fillRoundedRect(-14, -24, 28, 48, 6)
    g.fillStyle(0x2196f3)
    g.fillRoundedRect(-13, -23, 26, 16, 5) // sunlit hood
    // windshield with reflection streak
    g.fillStyle(0x0a1722)
    g.fillRoundedRect(-12, -19, 24, 13, 3)
    g.fillStyle(0x9fd3ff, 0.85)
    g.fillRoundedRect(-11, -18, 22, 11, 3)
    g.fillStyle(0xffffff, 0.4)
    g.fillTriangle(-9, -17, -1, -17, -9, -8)
    // rear window
    g.fillStyle(0x9fd3ff, 0.75)
    g.fillRoundedRect(-11, 8, 22, 10, 3)
    // roof seam highlight
    g.fillStyle(0xffffff, 0.12)
    g.fillRect(-12, -5, 24, 2)
    // headlights / taillights
    g.fillStyle(0xfff59d)
    g.fillRoundedRect(-13, -26, 9, 5, 2)
    g.fillRoundedRect(4, -26, 9, 5, 2)
    g.fillStyle(0xff5252)
    g.fillRoundedRect(-13, 21, 9, 5, 2)
    g.fillRoundedRect(4, 21, 9, 5, 2)
    // side mirrors
    g.fillStyle(0x0d47a1)
    g.fillRect(-19, -9, 4, 4)
    g.fillRect(15, -9, 4, 4)

    const c = this.add.container(0, 0, [shadow, g])
    c.setDepth(10)
    return c
  }

  // Northbound lane centre the player spawns in, depending on the road.
  private spawnLaneX(roadType: RoadType): number {
    if (roadType === 'highway') return HIGHWAY_NB_X
    if (this.hasBusLane) return BUS_NORMAL_X
    if (this.hasNarrowRoad) return NARROW_NB_X
    return NB_LANE_X
  }

  private resetCarToSpawn(roadType: RoadType = 'cross') {
    this.speed = 0
    this.heading = 0
    this.car.setPosition(this.spawnLaneX(roadType), SPAWN_Y)
    this.car.setRotation(0)
  }

  // ================= Traffic light =================

  private clearLight() {
    this.flashTimer?.destroy()
    this.flashTimer = null
    this.lightContainer?.destroy()
    this.lightContainer = null
    this.lightLamp = null
    this.lightHousing = null
  }

  private drawLight(state: TrafficLightState) {
    this.clearLight()

    // Ground shadow cast by the whole assembly (light from upper-left).
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.22)
    shadow.fillEllipse(10, 40, 54, 22)

    // Mounting pole rising from a base on the shoulder up to the signal head.
    const pole = this.add.graphics()
    pole.fillStyle(0x3a3f44)
    pole.fillRect(16, -36, 6, 78)       // vertical pole (to the right of the head)
    pole.fillStyle(0x4a5056)
    pole.fillRect(16, -36, 2, 78)       // pole highlight
    pole.fillStyle(0x2e3338)
    pole.fillRect(-2, -34, 20, 6)       // horizontal arm to the head
    pole.fillStyle(0x23272b)
    pole.fillEllipse(19, 44, 22, 9)     // base plate

    const g = this.add.graphics()
    g.fillStyle(0x222222)
    g.fillRoundedRect(-13, -40, 26, 74, 4)
    const lamp = this.add.graphics()
    this.renderLamp(g, lamp, state)

    const c = this.add.container(LIGHT_X, LIGHT_Y, [shadow, pole, g, lamp])
    c.setDepth(6)
    this.lightContainer = c
    this.lightLamp = lamp
    this.lightHousing = g

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
    housing.fillStyle(0x1c1c1c)
    housing.fillRoundedRect(-13, -40, 26, 74, 4)
    housing.fillStyle(0x2e2e2e) // left highlight (light from upper-left)
    housing.fillRoundedRect(-13, -40, 7, 74, 4)
    housing.fillStyle(0x121212) // right shade
    housing.fillRoundedRect(8, -40, 5, 74, 4)
    lamp.clear()
    lamp.setVisible(true)

    if (state.type === 'standard') {
      const colors: Record<string, number> = { red: 0xff2222, yellow: 0xffcc00, green: 0x00cc44 }
      const dim: Record<string, number> = { red: 0x551111, yellow: 0x554400, green: 0x114422 }
      const yo: Record<string, number> = { red: -24, yellow: -2, green: 20 }
      ;(['red', 'yellow', 'green'] as const).forEach((col) => {
        // visor overhang above each lamp
        housing.fillStyle(0x000000)
        housing.fillRect(-11, yo[col] - 13, 22, 4)
        housing.fillStyle(dim[col])
        housing.fillCircle(0, yo[col], 9)
      })
      lamp.fillStyle(colors[state.color])
      lamp.fillCircle(0, yo[state.color], 9)
      lamp.fillStyle(colors[state.color], 0.35) // bloom
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
      housing.fillStyle(0x000000) // visor
      housing.fillRect(-12, -19, 24, 4)
      housing.fillStyle(dim)
      housing.fillCircle(0, -4, 11)
      lamp.fillStyle(lit)
      lamp.fillCircle(0, -4, 11)
      lamp.fillStyle(lit, 0.35)
      lamp.fillCircle(0, -4, 18)
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
    } else if (this.lightHousing && this.lightLamp) {
      this.flashTimer?.destroy()
      this.flashTimer = null
      this.renderLamp(this.lightHousing, this.lightLamp, state)
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
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.25)
    shadow.fillEllipse(2, 16, 20, 8)
    const g = this.add.graphics()
    g.fillStyle(0xf1c27d) // head (skin)
    g.fillCircle(0, -14, 6)
    g.fillStyle(0x000000, 0.18) // hair shade
    g.fillRect(-6, -19, 12, 4)
    g.fillStyle(color) // torso
    g.fillRoundedRect(-5, -8, 10, 14, 3)
    g.fillStyle(0x000000, 0.12)
    g.fillRect(-5, 2, 10, 4)
    g.fillStyle(0x37474f) // legs
    g.fillRect(-6, 5, 4, 12)
    g.fillRect(2, 5, 4, 12)
    return this.add.container(0, 0, [shadow, g])
  }

  private createNPCCar(color = 0xcc2222): Phaser.GameObjects.Container {
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.26)
    shadow.fillEllipse(3, 5, 38, 56)
    const g = this.add.graphics()
    // wheels
    g.fillStyle(0x0a0a0a)
    g.fillRoundedRect(-19, -18, 5, 12, 2)
    g.fillRoundedRect(14, -18, 5, 12, 2)
    g.fillRoundedRect(-19, 8, 5, 12, 2)
    g.fillRoundedRect(14, 8, 5, 12, 2)
    // body two-tone
    g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(22).color)
    g.fillRoundedRect(-15, -24, 30, 48, 6)
    g.fillStyle(color)
    g.fillRoundedRect(-13, -22, 26, 44, 5)
    // windows
    g.fillStyle(0x9fd3ff, 0.85)
    g.fillRoundedRect(-10, -16, 20, 11, 3)
    g.fillStyle(0x9fd3ff, 0.7)
    g.fillRoundedRect(-10, 7, 20, 9, 3)
    // lights
    g.fillStyle(0xfff59d)
    g.fillRoundedRect(-12, -24, 8, 4, 2)
    g.fillRoundedRect(4, -24, 8, 4, 2)
    g.fillStyle(0xff5252)
    g.fillRoundedRect(-12, 20, 8, 4, 2)
    g.fillRoundedRect(4, 20, 8, 4, 2)
    return this.add.container(0, 0, [shadow, g])
  }

  // ================= Scenario lifecycle =================

  private onStartScenario = (raw: unknown) => {
    const scenario = raw as Scenario
    this.scenario = scenario
    this.phase = 'ready'
    this.resolved = false
    this.hasStopped = false
    this.crossedLine = false
    this.speedLimit = scenario.speedLimit ?? 0
    // Cap the throttle just above the posted limit so holding the gas settles at
    // a safe speed instead of redlining — this is what stops the car from both
    // speeding and rushing the stop line before the light turns green.
    this.maxSpeedPx = this.speedLimit > 0
      ? Math.max(CRUISE_SPEED, (this.speedLimit + THROTTLE_HEADROOM) / KMH_PER_PX)
      : MAX_SPEED
    this.overspeedMs = 0
    this.raining = scenario.weather === 'rain'
    this.hasTollGate = scenario.tollGate === true
    this.tollPassed = false
    this.hasBusLane = scenario.busLane === true
    this.hasNarrowRoad = scenario.narrowRoad === true
    this.hasCrosswalk = scenario.crosswalk === true

    this.tweens.killTweensOf(this.car)

    const roadType: RoadType = scenario.roadType ?? 'cross'
    this.buildRoad(roadType, scenario.maneuver)
    this.resetCarToSpawn(roadType)
    // Reset look-ahead and snap camera so it doesn't lag on the first frame.
    // With followOffset.y=150, at spawn scrollY = 940-150-225=565 → clamped to 550
    // (world bottom). Camera shows world y=[550,1000], light at y=580 is visible.
    this.cameras.main.followOffset.y = 150
    const spawnX = this.spawnLaneX(roadType)
    this.cameras.main.setScroll(spawnX - GAME_WIDTH / 2, WORLD_HEIGHT - GAME_HEIGHT)

    this.clearLight()
    this.currentLight = scenario.light
    if (scenario.light) this.drawLight(scenario.light)

    this.clearStopSign()
    if (scenario.stopSign) this.drawStopSign()

    this.clearTollGate()
    if (this.hasTollGate) this.drawTollGate()

    this.clearRain()
    if (this.raining) this.buildRain()

    // The bus lane road + 「バス専用」 labels are drawn by buildRoad above; here we
    // add the moving bus that occupies that lane.
    this.busSprite?.destroy()
    this.busSprite = null
    if (this.hasBusLane) {
      this.busSprite = this.createBus()
      this.busY = STOP_LINE_Y - 60
      this.busSprite.y = this.busY
    }

    this.applySpeedLimitSign()
    this.updateSpeedHud()

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
    this.clearStopSign()
    this.clearTollGate()
    this.clearRain()
    this.clearBusLane()
    this.clearNPCs()
    this.resetCarToSpawn()
  }

  // ================= Main loop =================

  update(_time: number, delta: number) {
    if (this.phase !== 'drive' || !this.scenario) return
    const dt = Math.min(delta, 50) / 1000
    const elapsed = this.time.now - this.driveStart

    this.updateCar(dt)
    this.updateCamera(dt)
    this.updateNPCs(elapsed)
    this.updateSpeedHud()
    this.updateRain(dt)
    this.updateBus(dt)

    if (this.resolved) return
    this.evaluate(elapsed, dt)
  }

  // Show more road ahead the faster the car goes (positive followOffset.y = more ahead).
  private updateCamera(dt: number) {
    const BASE_AHEAD = 150
    const EXTRA_AHEAD = 100
    const targetOffset = BASE_AHEAD + (this.speed / MAX_SPEED) * EXTRA_AHEAD
    const cam = this.cameras.main
    cam.followOffset.y = Phaser.Math.Linear(cam.followOffset.y, targetOffset, Math.min(1, dt * 4))
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

    const brakeDecel = this.raining ? BRAKE_DECEL * RAIN_BRAKE_FACTOR : BRAKE_DECEL
    if (brake) {
      this.speed = Math.max(0, this.speed - brakeDecel * dt)
    } else if (throttle) {
      // Accelerate toward the per-scenario ceiling. If already above it (only on
      // very low limits, where the start speed exceeds the cap) just hold —
      // never force an abrupt slowdown from the throttle itself.
      if (this.speed < this.maxSpeedPx) {
        this.speed = Math.min(this.maxSpeedPx, this.speed + ACCEL * dt)
      }
    } else {
      this.speed = Math.max(0, this.speed - COAST_FRICTION * dt)
    }

    if (this.speed > STOP_EPS) {
      const steer = (right ? 1 : 0) - (left ? 1 : 0)
      const speedFactor = Math.min(1, this.speed / 120)
      const turnRate = this.raining ? TURN_RATE * RAIN_TURN_FACTOR : TURN_RATE
      this.heading += steer * turnRate * speedFactor * dt
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

  private evaluate(elapsed: number, dt: number) {
    const ev = this.scenario!.evaluation
    const maneuver = this.scenario!.maneuver
    const roadType: RoadType = this.scenario!.roadType ?? 'cross'

    // 0) Speeding — sustained driving over the posted limit fails the run.
    if (this.speedLimit > 0) {
      const kmh = this.speed * KMH_PER_PX
      if (kmh > this.speedLimit + SPEED_TOLERANCE) {
        this.overspeedMs += dt * 1000
        if (this.overspeedMs > SPEED_GRACE_MS) return this.resolve('speeding')
      } else {
        this.overspeedMs = Math.max(0, this.overspeedMs - dt * 1000)
      }
    }

    // 0b) ETC toll gate — must reach the bar at crawl speed or hit it.
    if (this.hasTollGate && !this.tollPassed && this.car.y <= GATE_Y) {
      const kmh = this.speed * KMH_PER_PX
      if (kmh > ETC_MAX_KMH) {
        // Slam the bar down and treat it as a collision.
        this.tollBar?.setFillStyle(0xd32f2f)
        return this.resolve('collision')
      }
      this.tollPassed = true
      this.tollBar?.setVisible(false) // bar lifts / opens
    }

    // 0c) Bus-only lane — entering the blue lane during restricted hours fails.
    if (this.hasBusLane && elapsed > 250 && this.car.x < CX - 4) {
      return this.resolve('bus_lane')
    }

    // 1) Collision. A stationary car cannot run anyone over, so a pedestrian
    // walking across in front of a car that has correctly stopped to yield is
    // NOT a crash — only count a pedestrian hit while the car is actually
    // moving. (Vehicles can still collide with a stopped car.)
    for (const { def, obj } of this.npcs) {
      if (!obj.visible) continue
      const isPed = def.type === 'pedestrian'
      if (isPed && this.speed <= STOP_EPS) continue
      const r = isPed ? NPC_PED_R : NPC_CAR_R
      if (Math.hypot(this.car.x - obj.x, this.car.y - obj.y) < CAR_R + r) {
        return this.resolve('collision')
      }
    }

    // 1b) Yielding — fail before a crash if the player drives into a conflict
    // while someone else still has priority. To avoid false failures this only
    // triggers on a GENUINE, imminent conflict: the player is still rolling
    // faster than a careful crawl AND the priority road-user is close and in
    // the car's path. Slowing right down or stopping always counts as yielding.
    if (this.enteringConflictArea() && this.speed > YIELD_CREEP_SPEED) {
      for (const { def, obj } of this.npcs) {
        if (!obj.visible) continue
        const gap = Math.hypot(this.car.x - obj.x, this.car.y - obj.y)
        if (ev.yieldToPedestrians && def.type === 'pedestrian' && this.pedestrianHasPriority(obj)) {
          const ahead = obj.y < this.car.y + 8          // not already passed by the car
          const inLane = Math.abs(obj.x - this.car.x) < 28
          if (ahead && inLane && gap < 78) return this.resolve('failed_to_yield')
        }
        if (ev.yieldToVehicles && def.type === 'vehicle' && this.vehicleHasPriority(obj, roadType)) {
          if (gap < 95) return this.resolve('failed_to_yield')
        }
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
    if (roadType === 'straight' && this.hasBusLane) {
      return Math.abs(this.car.x - CX) > BUS_ROAD_W / 2 + 6
    }
    if (roadType === 'straight' && this.hasNarrowRoad) {
      return Math.abs(this.car.x - CX) > NARROW_ROAD_W / 2 + 4
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

  private enteringConflictArea(): boolean {
    if (!this.scenario) return false
    const roadType: RoadType = this.scenario.roadType ?? 'cross'

    if (roadType === 'straight' && this.hasNarrowRoad) {
      return this.car.y < 760 && this.car.y > 360
    }

    if (this.scenario.maneuver === 'right') {
      return this.car.y <= STOP_LINE_Y + 28 && this.car.y > CY - INT / 2 - 8
    }

    return this.car.y <= STOP_LINE_Y + 18 && this.car.y > CY - INT / 2 - 8
  }

  private pedestrianHasPriority(obj: Phaser.GameObjects.Container): boolean {
    const onCrosswalk = Math.abs(obj.y - CROSSWALK_Y) < 26
    const crossingRoad = obj.x > CX - ROAD_W / 2 - 24 && obj.x < CX + ROAD_W / 2 + 24
    return onCrosswalk && crossingRoad
  }

  private vehicleHasPriority(obj: Phaser.GameObjects.Container, roadType: RoadType): boolean {
    if (roadType === 'straight' && this.hasNarrowRoad) {
      const closingGap = obj.y < this.car.y && this.car.y - obj.y < 190
      const sameNarrowRoad = Math.abs(obj.x - CX) < NARROW_ROAD_W / 2 + 12
      return closingGap && sameNarrowRoad
    }

    const nearIntersection = Math.abs(obj.x - CX) < 120 && Math.abs(obj.y - CY) < 120
    return nearIntersection
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
