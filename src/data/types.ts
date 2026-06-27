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

// NPC behaviour is optional so existing scenarios keep the legacy rail path.
export type NpcBehavior =
  | 'rail'
  | 'cruise'
  | 'yield'
  | 'aggressive'
  | 'turner'
  | 'random'

// A moving obstacle (oncoming car, crossing pedestrian, priority-road traffic).
export interface ScenarioNPC {
  id: string
  type: 'vehicle' | 'pedestrian'
  variant?: 'car' | 'kei' | 'taxi' | 'truck' | 'bus' | 'scooter'
  startX: number
  startY: number
  endX: number
  endY: number
  speed: number // pixels per second
  startAtMs: number
  color?: number
  behavior?: NpcBehavior
  signalsIntent?: boolean
  turnAt?: { x: number; y: number }
  turnTo?: ArrowDir
  yieldsToPlayer?: boolean
  reactionGap?: number
  randomSeed?: number
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

export interface SafetyCheck {
  mirror?: boolean
  blindSpotLeft?: boolean
  blindSpotRight?: boolean
  windowMs?: { from: number; to: number }
}

export interface DecisionNode {
  id: string
  at: { x: number; y: number }
  kind: 'signal' | 'stopsign' | 'yield' | 'crosswalk' | 'merge' | 'roundabout' | 'leftpriority'
  required: Maneuver | 'proceed'
  light?: TrafficLightState
  lightChanges?: LightChange[]
}

export type RoadType =
  | 'cross'
  | 't-junction'
  | 'straight'
  | 'highway'
  | 'roundabout'
  | 'multilane'
  | 'merge'
  | 'skewed'
  | 'uncontrolled'
  | 'tunnel'

export type RoadSign =
  | 'slow'
  | 'no-entry'
  | 'no-overtaking'
  | 'no-stopping'
  | 'restricted-turn'
  | 'crosswalk-ahead'
  | 'roundabout'

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
  // Scenario timeout. Longer, busier levels use more time so the player can
  // practise waiting, scanning, and completing the manoeuvre calmly.
  timeLimitMs?: number
  // Controls ambient traffic added by the scenario enhancer.
  trafficDensity?: 'light' | 'normal' | 'busy'
  // Controls extra road markings such as lane arrows, turn guides, merge zones,
  // and side-street clutter.
  roadComplexity?: 'simple' | 'urban' | 'complex'
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
  // if you slow to ETC speed (≤20 km/h); arriving too fast hits the barrier.
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
  behaviorProfile?: 'easy' | 'realistic' | 'unpredictable'
  safetyCheck?: SafetyCheck
  decisionNodes?: DecisionNode[]
  gradient?: 'uphill' | 'downhill'
  visibility?: 'clear' | 'night' | 'fog' | 'glare'
  wind?: 'none' | 'crosswind'
  signs?: RoadSign[]
  laneCount?: 1 | 2
  hasRightTurnLane?: boolean
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
  | 'no_safety_check' // missed a required mirror/blind-spot confirmation
  | 'failed_to_slow' // failed to slow at a slow/caution zone
  | 'illegal_overtake' // crossed/used a forbidden overtake
  | 'timeout' // never completed the maneuver

export interface DrivingOutcome {
  isCorrect: boolean
  reason: OutcomeReason
  timeMs: number
}

export interface GameSession {
  scenarioIds: string[]
  currentIndex: number
  score: number
  streak: number
  answers: AnswerRecord[]
}

export interface AnswerRecord {
  scenarioId: string
  isCorrect: boolean
  reason: OutcomeReason
  timeUsed: number
}
