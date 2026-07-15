export type Lang = 'zh-TW' | 'ja'
export type BilingualText = Record<Lang, string>

// ── Traffic signals ─────────────────────────────────────────────────────────
export type LightColor = 'red' | 'yellow' | 'green'
export type ArrowDir = 'left' | 'straight' | 'right'

export interface StandardLightState {
  type: 'standard'
  color: LightColor
}

export interface ArrowLightState {
  type: 'arrow'
  mainColor: LightColor
  activeArrows: ArrowDir[]
}

export interface FlashingLightState {
  type: 'flashing'
  color: 'red' | 'yellow'
}

export type PedestrianPhase = 'walk' | 'flashing' | 'stop'
export interface PedestrianLightState {
  type: 'pedestrian'
  phase: PedestrianPhase
  countdown?: number
}

export type TrafficLightState =
  | StandardLightState
  | ArrowLightState
  | FlashingLightState
  | PedestrianLightState

// ── Driving ────────────────────────────────────────────────────────────────
export type Maneuver = 'straight' | 'left' | 'right'
export type MandatoryAction = 'stop' | 'yield' | 'proceed'
