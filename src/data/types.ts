export type Lang = 'zh-TW' | 'ja'
export type BilingualText = Record<Lang, string>

export type LightColor = 'red' | 'yellow' | 'green'
export type ArrowDir = 'left' | 'straight' | 'right'
export type LightType = 'standard' | 'arrow' | 'flashing' | 'pedestrian'

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

export type VehicleIntent = 'straight' | 'turn_left' | 'turn_right' | 'stop'
export type MandatoryAction = 'stop' | 'yield' | 'proceed'

export type ConsequenceType = 'crash' | 'near_miss' | 'smooth_pass' | 'penalty_stop'

export interface DecisionChoice {
  id: string
  text: BilingualText
  isCorrect: boolean
  feedbackText: BilingualText
  consequence: ConsequenceType
}

export interface FeedbackContent {
  explanation: BilingualText
  lawArticle: string
  commonMistake?: BilingualText
}

export interface PathPoint {
  x: number
  y: number
  speed?: number
}

export interface ScenarioPhase {
  id: string
  durationMs: number
  playerPath: PathPoint[]
  decisionPoint?: {
    triggerAtMs: number
    timerSeconds: number
    promptText: BilingualText
    choices: DecisionChoice[]
  }
}

export type MapType = 'cross' | 't_junction' | 'oneway' | 'priority_road'

export interface TrafficLightDef {
  id: string
  x: number
  y: number
  rotation?: number
  state: TrafficLightState
}

export interface NPCDef {
  id: string
  type: 'vehicle' | 'pedestrian'
  startX: number
  startY: number
  path?: PathPoint[]
  startAtMs?: number
}

export interface Scenario {
  id: string
  category: 'standard' | 'arrow' | 'flashing' | 'pedestrian' | 'priority' | 'oneway'
  title: BilingualText
  description: BilingualText
  difficulty: 1 | 2 | 3
  mapType: MapType
  lights: TrafficLightDef[]
  npcs?: NPCDef[]
  phases: ScenarioPhase[]
  feedback: FeedbackContent
}

export interface GameSession {
  mode: 'study' | 'normal' | 'challenge'
  scenarioIds: string[]
  currentIndex: number
  score: number
  lives: number
  streak: number
  answers: AnswerRecord[]
}

export interface AnswerRecord {
  scenarioId: string
  choiceId: string
  isCorrect: boolean
  timeUsed: number
}
