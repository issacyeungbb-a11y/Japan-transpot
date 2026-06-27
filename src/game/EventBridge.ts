type EventCallback = (...args: unknown[]) => void

class EventBridge {
  private listeners: Map<string, EventCallback[]> = new Map()

  on(event: string, cb: EventCallback) {
    const list = this.listeners.get(event) ?? []
    list.push(cb)
    this.listeners.set(event, list)
  }

  off(event: string, cb: EventCallback) {
    const list = this.listeners.get(event) ?? []
    this.listeners.set(event, list.filter((fn) => fn !== cb))
  }

  emit(event: string, ...args: unknown[]) {
    const list = this.listeners.get(event) ?? []
    list.forEach((cb) => cb(...args))
  }
}

export const bridge = new EventBridge()

// Events emitted by Phaser → consumed by React
export const PHASER_EVENTS = {
  SCENE_READY: 'phaser:sceneReady',        // ScenarioScene.create() finished, listeners ready
  SCENARIO_READY: 'phaser:scenarioReady',  // a scenario is staged; carries instruction + maneuver
  DRIVE_START: 'phaser:driveStart',        // the car has begun moving; enable controls
  OUTCOME: 'phaser:outcome',               // scenario resolved; carries { isCorrect, reason, timeMs }
} as const

// Events emitted by React → consumed by Phaser
export const REACT_EVENTS = {
  START_SCENARIO: 'react:startScenario',
  START_DRIVING: 'react:startDriving',
  NEXT_SCENARIO: 'react:nextScenario',
} as const
