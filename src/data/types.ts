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

export interface FeedbackContent {
  explanation: BilingualText
  lawArticle: string
  commonMistake?: BilingualText
}

// ---- Driving simulation model ----

// The maneuver the player is asked to perform through the intersection.
export type Maneuver = 'straight' | 'left' | 'right'

// A scheduled change of the traffic light during the scenario (e.g. yellow → red,
// or red → green so a stopped player can proceed).
export interface LightChange {
  atMs: number
  state: TrafficLightState
}

// A moving obstacle (oncoming car, crossing pedestrian, priority-road traffic).
export interface ScenarioNPC {
  id: string
  type: 'vehicle' | 'pedestrian'
  startX: number
  startY: number
  endX: number
  endY: number
  speed: number // pixels per second
  startAtMs: number
  color?: number
}

// What the scene must evaluate, in real time, against the car's actual behaviour.
export interface ScenarioEvaluation {
  // The car must come to a FULL stop before the stop line (e.g. red flashing / stop sign).
  mustStop?: boolean
  // The car may only cross the stop line while the signal is in a "go" state
  // (solid red / yellow that must wait for green).
  waitForGo?: boolean
  // Legal exits from the intersection. If omitted, all maneuvers are allowed.
  allowedManeuvers?: Maneuver[]
  // The driver must wait while a pedestrian is occupying or entering the
  // crosswalk, even if the vehicle signal is green.
  yieldToPedestrians?: boolean
  // The driver must give way to cross traffic, oncoming straight traffic, or a
  // narrow-road oncoming vehicle before entering the conflict area.
  yieldToVehicles?: boolean
}

export type RoadType = 'cross' | 't-junction' | 'straight' | 'highway'
export type GameMode = 'study' | 'normal' | 'challenge'

export interface Scenario {
  id: string
  category: 'standard' | 'arrow' | 'flashing' | 'pedestrian' | 'priority' | 'oneway' | 'speed'
  title: BilingualText
  // Short goal shown to the player before the car starts moving.
  instruction: BilingualText
  difficulty: 1 | 2 | 3
  maneuver: Maneuver
  // Road layout; defaults to 'cross' when omitted.
  roadType?: RoadType
  // Which game modes include this scenario; omit to include in all modes.
  modes?: GameMode[]
  light: TrafficLightState | null
  lightChanges?: LightChange[]
  npcs?: ScenarioNPC[]
  // Posted speed limit in km/h. Shows a Japanese round speed-limit sign and
  // enforces overspeed. Okinawa: local 40–60, Okinawa Expressway 80.
  speedLimit?: number
  // Draws a 止まれ (stop) sign on the approach — full stop is mandatory.
  stopSign?: boolean
  // Weather. 'rain' adds a downpour overlay and a slippery road: braking
  // distance grows and grip drops, like real wet Okinawa driving.
  weather?: 'rain'
  // Draws an ETC toll gate across an expressway approach. The bar only clears
  // if you slow to ETC speed (≤25 km/h); arriving too fast hits the barrier.
  tollGate?: boolean
  // Renders a blue 「バス専用」 lane on the left with a bus; driving in it during
  // the restricted hours is a violation. Player must keep to the right lane.
  busLane?: boolean
  // Draws a single-car-width Okinawa back street with walls, gutters, and
  // passing-space pressure. The player has less room for steering mistakes.
  narrowRoad?: boolean
  // Paints a zebra crossing on a straight/narrow road, for unsignalised
  // pedestrian-yield drills near tourist spots, schools, and shops.
  crosswalk?: boolean
  evaluation: ScenarioEvaluation
  feedback: FeedbackContent
}

export type OutcomeReason =
  | 'success'
  | 'ran_red' // crossed the line when stopping/waiting was required
  | 'no_full_stop' // failed to fully stop where a full stop was mandatory
  | 'collision' // hit a vehicle or pedestrian
  | 'failed_to_yield' // entered while a pedestrian/priority vehicle still had right of way
  | 'wrong_way' // took an illegal direction
  | 'off_road' // left the roadway
  | 'speeding' // exceeded the posted speed limit for too long
  | 'bus_lane' // drove in a bus-only lane during restricted hours
  | 'timeout' // never completed the maneuver

export interface DrivingOutcome {
  isCorrect: boolean
  reason: OutcomeReason
  timeMs: number
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
  isCorrect: boolean
  reason: OutcomeReason
  timeUsed: number
}
