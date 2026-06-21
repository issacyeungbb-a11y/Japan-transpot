import Phaser from 'phaser'
import { bridge, REACT_EVENTS, PHASER_EVENTS } from '../EventBridge'
import type { Scenario, DecisionChoice, ConsequenceType } from '../../data/types'
import { GAME_WIDTH, GAME_HEIGHT } from '../GameConfig'

// Road drawing constants
const ROAD_COLOR = 0x4a4a4a
const ROAD_LINE = 0xffffff
const SIDEWALK_COLOR = 0x8a7c6a
const GRASS_COLOR = 0x3d7a30
const INTERSECTION_COLOR = 0x555555

export class ScenarioScene extends Phaser.Scene {
  private car!: Phaser.GameObjects.Container
  private roadGraphics!: Phaser.GameObjects.Graphics
  private npcGraphics: Phaser.GameObjects.Container[] = []
  private trafficLights: Phaser.GameObjects.Container[] = []
  private flashTimers: Phaser.Time.TimerEvent[] = []

  private currentScenario: Scenario | null = null
  private pathTween: Phaser.Tweens.Tween | null = null
  private decisionPending = false

  constructor() {
    super({ key: 'ScenarioScene' })
  }

  create() {
    this.buildRoad()
    this.car = this.createCar()
    this.repositionCarToStart()

    bridge.on(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
    bridge.on(REACT_EVENTS.PLAYER_CHOICE, this.onPlayerChoice)
    bridge.on(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)
  }

  destroy() {
    bridge.off(REACT_EVENTS.START_SCENARIO, this.onStartScenario)
    bridge.off(REACT_EVENTS.PLAYER_CHOICE, this.onPlayerChoice)
    bridge.off(REACT_EVENTS.NEXT_SCENARIO, this.onNextScenario)
    this.flashTimers.forEach((t) => t.destroy())
  }

  // ---- Road Drawing ----

  private buildRoad() {
    if (this.roadGraphics) this.roadGraphics.destroy()
    this.roadGraphics = this.add.graphics()
    const g = this.roadGraphics
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const roadW = 80
    const intSize = 80

    // Grass background
    g.fillStyle(GRASS_COLOR)
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Sidewalks
    g.fillStyle(SIDEWALK_COLOR)
    g.fillRect(cx - roadW / 2 - 8, 0, roadW + 16, GAME_HEIGHT)
    g.fillRect(0, cy - roadW / 2 - 8, GAME_WIDTH, roadW + 16)

    // Road surface
    g.fillStyle(ROAD_COLOR)
    g.fillRect(cx - roadW / 2, 0, roadW, GAME_HEIGHT)
    g.fillRect(0, cy - roadW / 2, GAME_WIDTH, roadW)

    // Intersection
    g.fillStyle(INTERSECTION_COLOR)
    g.fillRect(cx - intSize / 2, cy - intSize / 2, intSize, intSize)

    // Center dashes (vertical)
    g.fillStyle(ROAD_LINE)
    for (let y = 0; y < cy - intSize / 2; y += 30) {
      g.fillRect(cx - 2, y, 4, 18)
    }
    for (let y = cy + intSize / 2 + 12; y < GAME_HEIGHT; y += 30) {
      g.fillRect(cx - 2, y, 4, 18)
    }
    // Center dashes (horizontal)
    for (let x = 0; x < cx - intSize / 2; x += 30) {
      g.fillRect(x, cy - 2, 18, 4)
    }
    for (let x = cx + intSize / 2 + 12; x < GAME_WIDTH; x += 30) {
      g.fillRect(x, cy - 2, 18, 4)
    }

    // Stop lines
    g.fillStyle(ROAD_LINE)
    g.fillRect(cx - roadW / 2, cy - intSize / 2 - 4, roadW, 4) // top stop line
    g.fillRect(cx - roadW / 2, cy + intSize / 2, roadW, 4)     // bottom
    g.fillRect(cx - intSize / 2 - 4, cy - roadW / 2, 4, roadW) // left
    g.fillRect(cx + intSize / 2, cy - roadW / 2, 4, roadW)     // right

    // Zebra crossing (top)
    g.fillStyle(ROAD_LINE)
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - roadW / 2 + i * 16, cy - intSize / 2 - 18, 10, 14)
    }

    // Direction arrow on player lane (coming from bottom)
    this.drawArrow(cx + 20, cy + intSize / 2 + 30, 'up', g)
  }

  private drawArrow(x: number, y: number, dir: 'up' | 'down', g: Phaser.GameObjects.Graphics) {
    g.fillStyle(ROAD_LINE)
    g.fillRect(x - 2, y - 16, 4, 20)
    if (dir === 'up') {
      g.fillTriangle(x - 8, y - 14, x + 8, y - 14, x, y - 28)
    } else {
      g.fillTriangle(x - 8, y + 14, x + 8, y + 14, x, y + 28)
    }
  }

  // ---- Car ----

  private createCar(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    // Body
    g.fillStyle(0x1565c0)
    g.fillRoundedRect(-18, -30, 36, 60, 6)
    // Windshield
    g.fillStyle(0x90caf9)
    g.fillRect(-12, -22, 24, 16)
    // Rear window
    g.fillStyle(0x90caf9)
    g.fillRect(-12, 10, 24, 12)
    // Wheels
    g.fillStyle(0x111111)
    g.fillRect(-22, -24, 7, 14)
    g.fillRect(15, -24, 7, 14)
    g.fillRect(-22, 14, 7, 14)
    g.fillRect(15, 14, 7, 14)
    // Headlights
    g.fillStyle(0xfff176)
    g.fillRect(-14, -28, 10, 6)
    g.fillRect(4, -28, 10, 6)

    const container = this.add.container(0, 0, [g])
    container.setDepth(10)
    return container
  }

  private repositionCarToStart() {
    const cx = GAME_WIDTH / 2 + 20
    this.car.setPosition(cx, GAME_HEIGHT - 60)
    this.car.setRotation(0)
  }

  // ---- Traffic Lights ----

  private clearTrafficLights() {
    this.flashTimers.forEach((t) => t.destroy())
    this.flashTimers = []
    this.trafficLights.forEach((c) => c.destroy())
    this.trafficLights = []
  }

  private drawTrafficLights(scenario: Scenario) {
    this.clearTrafficLights()
    scenario.lights.forEach((def) => {
      const container = this.createTrafficLightSprite(def.state)
      container.setPosition(def.x, def.y)
      if (def.rotation) container.setRotation(def.rotation)
      container.setDepth(5)
      this.trafficLights.push(container)
      this.add.existing(container)

      if (def.state.type === 'flashing') {
        let visible = true
        const timer = this.time.addEvent({
          delay: 500,
          loop: true,
          callback: () => {
            visible = !visible
            // Toggle the colored lamp (second child)
            const lamp = container.getAt(1) as Phaser.GameObjects.Graphics
            if (lamp) lamp.setVisible(visible)
          },
        })
        this.flashTimers.push(timer)
      }
    })
  }

  private createTrafficLightSprite(
    state: Scenario['lights'][0]['state']
  ): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    // Housing
    g.fillStyle(0x222222)
    g.fillRoundedRect(-14, -44, 28, 80, 4)

    const lamp = this.add.graphics()

    switch (state.type) {
      case 'standard': {
        const colors: Record<string, number> = { red: 0xff2222, yellow: 0xffcc00, green: 0x00cc44 }
        const yOffsets: Record<string, number> = { red: -28, yellow: -4, green: 20 }
        // Draw all lamps dim
        const dimColors: Record<string, number> = { red: 0x661111, yellow: 0x665500, green: 0x005522 }
        Object.entries(yOffsets).forEach(([col, yo]) => {
          g.fillStyle(dimColors[col])
          g.fillCircle(0, yo, 10)
        })
        // Light the active one
        lamp.fillStyle(colors[state.color])
        lamp.fillCircle(0, yOffsets[state.color], 10)
        // Glow effect
        lamp.fillStyle(colors[state.color], 0.3)
        lamp.fillCircle(0, yOffsets[state.color], 16)
        break
      }

      case 'arrow': {
        // Show dim main signal
        const mainDim = state.mainColor === 'red' ? 0x661111 : 0x665500
        g.fillStyle(mainDim)
        g.fillCircle(0, -20, 10)
        // Arrow panel below
        g.fillStyle(0x333333)
        g.fillRect(-12, -4, 24, 36)
        // Active arrows
        lamp.fillStyle(0x00aaff)
        state.activeArrows.forEach((arrow, i) => {
          const ay = -4 + i * 12 + 6
          if (arrow === 'left') this.drawArrowGlyph(lamp, -4, ay, 'left')
          else if (arrow === 'right') this.drawArrowGlyph(lamp, -4, ay, 'right')
          else this.drawArrowGlyph(lamp, 0, ay, 'up')
        })
        break
      }

      case 'flashing': {
        const col = state.color === 'red' ? 0xff2222 : 0xffcc00
        const dim = state.color === 'red' ? 0x661111 : 0x665500
        g.fillStyle(dim)
        g.fillCircle(0, 0, 12)
        lamp.fillStyle(col)
        lamp.fillCircle(0, 0, 12)
        lamp.fillStyle(col, 0.3)
        lamp.fillCircle(0, 0, 18)
        break
      }

      case 'pedestrian': {
        const bodyColor = state.phase === 'stop' ? 0xff2222 : 0x00cc44
        g.fillStyle(0x111111)
        g.fillRoundedRect(-12, -34, 24, 68, 4)
        lamp.fillStyle(bodyColor)
        // Simple pedestrian figure
        lamp.fillCircle(0, -18, 5)
        lamp.fillRect(-6, -12, 12, 14)
        lamp.fillTriangle(-7, -12, 7, -12, 0, 2)
        if (state.phase === 'walk') {
          lamp.fillRect(-8, 4, 5, 14)
          lamp.fillRect(3, 4, 5, 14)
        } else {
          lamp.fillRect(-6, 4, 12, 12)
        }
        break
      }
    }

    return this.add.container(0, 0, [g, lamp])
  }

  private drawArrowGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number, dir: string) {
    if (dir === 'up') {
      g.fillTriangle(x - 5, y + 3, x + 5, y + 3, x, y - 5)
      g.fillRect(x - 2, y + 3, 4, 6)
    } else if (dir === 'left') {
      g.fillTriangle(x - 4, y, x + 4, y - 5, x + 4, y + 5)
      g.fillRect(x + 4, y - 2, 6, 4)
    } else if (dir === 'right') {
      g.fillTriangle(x + 4, y, x - 4, y - 5, x - 4, y + 5)
      g.fillRect(x - 10, y - 2, 6, 4)
    }
  }

  // ---- NPC ----

  private clearNPCs() {
    this.npcGraphics.forEach((n) => n.destroy())
    this.npcGraphics = []
  }

  private spawnNPCs(scenario: Scenario) {
    this.clearNPCs()
    scenario.npcs?.forEach((npc) => {
      let container: Phaser.GameObjects.Container
      if (npc.type === 'pedestrian') {
        container = this.createPedestrian()
      } else {
        container = this.createNPCCar()
      }
      container.setPosition(npc.startX, npc.startY)
      container.setDepth(8)
      this.npcGraphics.push(container)

      if (npc.path && npc.path.length > 0) {
        const delay = npc.startAtMs ?? 1000
        this.time.delayedCall(delay, () => {
          this.tweens.add({
            targets: container,
            x: npc.path![npc.path!.length - 1].x,
            y: npc.path![npc.path!.length - 1].y,
            duration: 2000,
            ease: 'Linear',
          })
        })
      }
    })
  }

  private createPedestrian(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(0xff6b35)
    g.fillCircle(0, -16, 6)
    g.fillRect(-5, -10, 10, 14)
    g.fillRect(-7, 4, 5, 12)
    g.fillRect(2, 4, 5, 12)
    return this.add.container(0, 0, [g])
  }

  private createNPCCar(): Phaser.GameObjects.Container {
    const g = this.add.graphics()
    g.fillStyle(0xcc2222)
    g.fillRoundedRect(-16, -26, 32, 52, 5)
    g.fillStyle(0x90caf9)
    g.fillRect(-10, -18, 20, 12)
    g.fillStyle(0x111111)
    g.fillRect(-20, -20, 6, 12)
    g.fillRect(14, -20, 6, 12)
    g.fillRect(-20, 12, 6, 12)
    g.fillRect(14, 12, 6, 12)
    return this.add.container(0, 0, [g])
  }

  // ---- Scenario lifecycle ----

  private onStartScenario = (scenario: unknown) => {
    this.currentScenario = scenario as Scenario
    this.decisionPending = false

    if (this.pathTween) {
      this.pathTween.stop()
      this.pathTween = null
    }

    this.buildRoad()
    this.repositionCarToStart()

    this.drawTrafficLights(this.currentScenario)
    this.spawnNPCs(this.currentScenario)

    bridge.emit(PHASER_EVENTS.SCENARIO_READY)
    this.runPhase(0)
  }

  private runPhase(index: number) {
    const scenario = this.currentScenario
    if (!scenario || index >= scenario.phases.length) return

    const phase = scenario.phases[index]

    if (phase.playerPath.length < 2) {
      this.scheduleDecision(phase)
      return
    }

    const [start, ...rest] = phase.playerPath
    this.car.setPosition(start.x, start.y)

    const dx = rest[0].x - start.x
    const dy = rest[0].y - start.y
    this.car.setRotation(Math.atan2(dx, -dy))

    // Build sequential tweens by chaining with delay accumulation
    let delay = 0
    rest.forEach((pt) => {
      const duration = pt.speed ?? 1200
      this.tweens.add({
        targets: this.car,
        x: pt.x,
        y: pt.y,
        duration,
        ease: 'Linear',
        delay,
      })
      delay += duration
    })

    if (phase.decisionPoint) {
      const { triggerAtMs } = phase.decisionPoint
      this.time.delayedCall(triggerAtMs, () => {
        this.tweens.getTweensOf(this.car).forEach((t) => t.pause())
        this.scheduleDecision(phase)
      })
    } else {
      // No decision — advance to next phase after all tweens complete
      this.time.delayedCall(delay, () => {
        this.runPhase(index + 1)
      })
    }
  }

  private scheduleDecision(phase: Scenario['phases'][0]) {
    if (!phase.decisionPoint || this.decisionPending) return
    this.decisionPending = true
    bridge.emit(PHASER_EVENTS.SHOW_DECISION, {
      promptText: phase.decisionPoint.promptText,
      choices: phase.decisionPoint.choices,
      timerSeconds: phase.decisionPoint.timerSeconds,
    })
  }

  private onPlayerChoice = (payload: unknown) => {
    const { choice } = payload as { choice: DecisionChoice }
    this.decisionPending = false
    this.playConsequence(choice.consequence, () => {
      bridge.emit(PHASER_EVENTS.PLAY_CONSEQUENCE, { choice })
    })
  }

  private playConsequence(type: ConsequenceType, onComplete: () => void) {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    if (type === 'crash') {
      // Red flash then shake
      const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.4)
      overlay.setDepth(20)
      this.cameras.main.shake(400, 0.02)
      this.time.delayedCall(600, () => {
        overlay.destroy()
        onComplete()
      })
    } else if (type === 'smooth_pass') {
      // Green flash
      const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x00cc44, 0.3)
      overlay.setDepth(20)
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          overlay.destroy()
          onComplete()
        },
      })
    } else if (type === 'near_miss') {
      this.cameras.main.shake(200, 0.01)
      this.time.delayedCall(500, onComplete)
    } else {
      // penalty_stop
      this.time.delayedCall(400, onComplete)
    }
  }

  private onNextScenario = () => {
    this.clearTrafficLights()
    this.clearNPCs()
    this.repositionCarToStart()
  }
}
