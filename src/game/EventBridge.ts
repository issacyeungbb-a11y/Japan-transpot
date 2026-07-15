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

// Shared event bus between the three.js course engine and the React UI.
// Event names live in src/game3d/engine.ts (COURSE_EVENTS).
export const bridge = new EventBridge()
