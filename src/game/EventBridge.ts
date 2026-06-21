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
  SHOW_DECISION: 'phaser:showDecision',
  PLAY_CONSEQUENCE: 'phaser:playConsequence',
  SCENARIO_READY: 'phaser:scenarioReady',
  SCENE_READY: 'phaser:sceneReady',        // emitted once when ScenarioScene.create() finishes
  APPROACH_COMPLETE: 'phaser:approachComplete',
} as const

// Events emitted by React → consumed by Phaser
export const REACT_EVENTS = {
  PLAYER_CHOICE: 'react:playerChoice',
  START_SCENARIO: 'react:startScenario',
  NEXT_SCENARIO: 'react:nextScenario',
} as const
