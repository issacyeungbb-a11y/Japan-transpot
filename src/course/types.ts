import type { BilingualText, TrafficLightState, Maneuver } from '../data/types'

// ─────────────────────────────────────────────────────────────────────────────
// The continuous Okinawa road-test course: one connected route made of "legs".
// Each leg is a straight approach (metres) ending in an optional junction, and
// carries ONE examined event (signal, sign, NPCs, rules). All distances are in
// metres; the world is metric and y-up (three.js).
// ─────────────────────────────────────────────────────────────────────────────

export type TurnDir = Maneuver // 'straight' | 'left' | 'right'

export type JunctionKind =
  | 'none'        // plain straight leg — event happens mid-leg (crosswalk, gate…)
  | 'cross'       // 4-way crossroad
  | 't-junction'  // no through road — must turn left or right
  | 'side-merge'  // player emerges from a small side road onto a big main road

// An NPC path in LEG-LOCAL coordinates: s = metres along the leg from its
// origin, t = metres to the RIGHT of the centreline (Japan: player lane centre
// is t = -1.75, oncoming is +1.75). Spawned when the event activates.
export interface CourseNpc {
  id: string
  kind: 'vehicle' | 'pedestrian'
  variant?: 'car' | 'kei' | 'taxi' | 'truck' | 'bus' | 'scooter'
  from: { s: number; t: number }
  to: { s: number; t: number }
  speed: number   // m/s
  delayMs: number // after event activation
  color?: number
  loop?: boolean  // restart path when finished (ambient traffic)
}

export interface LightPhase {
  atMs: number // after event activation
  state: TrafficLightState
}

export interface CourseEvent {
  id: string
  zone: ZoneId
  title: BilingualText
  // GPS-style instruction shown on the HUD while this leg is active.
  gps: BilingualText
  light?: TrafficLightState | null
  lightPhases?: LightPhase[]
  stopSign?: boolean
  speedLimit: number   // km/h
  minSpeed?: number    // km/h (expressway)
  npcs?: CourseNpc[]
  rules: {
    waitForGo?: boolean   // may only cross the stop line on a legal signal
    mustStop?: boolean    // full stop required before the line (止まれ / 赤点滅)
    yieldPed?: boolean
    yieldVeh?: boolean
  }
  law: string
  // Shown in the final report if the examinee violated something here.
  lesson: BilingualText
}

export interface Leg {
  approach: number        // metres of straight road before the junction
  junction: JunctionKind
  turn: TurnDir           // the route's exit direction through the junction
  // Road styling
  narrow?: boolean        // Okinawa back-street: narrower carriageway
  busLane?: boolean       // extra bus-only lane painted on the left
  tollGate?: boolean      // ETC gate mid-leg (straight legs only)
  rainFrom?: boolean      // rain starts (and persists) from this leg on
  highway?: boolean       // expressway styling (barriers, no buildings close)
  crosswalkAtS?: number   // unsignalised zebra crossing mid-leg (straight legs)
  event: CourseEvent
}

export type ZoneId = 'naha' | 'school' | 'oldtown' | 'route58' | 'expressway' | 'mihama'

export const ZONE_NAMES: Record<ZoneId, BilingualText> = {
  naha:       { 'zh-TW': '那霸市區',   ja: '那覇市街' },
  school:     { 'zh-TW': '學校區',     ja: 'スクールゾーン' },
  oldtown:    { 'zh-TW': '舊市區窄巷', ja: '旧市街の細道' },
  route58:    { 'zh-TW': '國道58號',   ja: '国道58号' },
  expressway: { 'zh-TW': '沖繩自動車道', ja: '沖縄自動車道' },
  mihama:     { 'zh-TW': '美濱美國村', ja: '美浜アメリカンビレッジ' },
}

// ── Deduction system (減点法): start at 100, pass at 70 ──────────────────────
export type ViolationCode =
  | 'ran_red'       // 信号無視
  | 'no_full_stop'  // 一時不停止
  | 'fail_yield_ped'// 歩行者妨害
  | 'fail_yield_veh'// 優先妨害
  | 'speeding'      // 速度超過
  | 'too_slow'      // 最低速度違反（高速）
  | 'off_road'      // 車道逸脱
  | 'wrong_way'     // 経路違反・逆走
  | 'bus_lane'      // バス専用レーン走行
  | 'toll_crash'    // ETCバー衝突
  | 'collision'     // 衝突

export const DEDUCTIONS: Record<ViolationCode, number> = {
  ran_red: 20,
  fail_yield_ped: 20,
  no_full_stop: 10,
  fail_yield_veh: 10,
  speeding: 15,
  too_slow: 10,
  off_road: 10,
  wrong_way: 5,
  bus_lane: 10,
  toll_crash: 20,
  collision: 30,
}

export const VIOLATION_NAMES: Record<ViolationCode, BilingualText> = {
  ran_red:        { 'zh-TW': '衝紅燈（信號無視）',     ja: '信号無視' },
  no_full_stop:   { 'zh-TW': '未完全停車（一時不停止）', ja: '一時不停止' },
  fail_yield_ped: { 'zh-TW': '未讓行人（歩行者妨害）',  ja: '歩行者妨害' },
  fail_yield_veh: { 'zh-TW': '未讓優先車輛',           ja: '優先妨害' },
  speeding:       { 'zh-TW': '超速',                   ja: '速度超過' },
  too_slow:       { 'zh-TW': '低於最低速度',           ja: '最低速度違反' },
  off_road:       { 'zh-TW': '偏離車道／衝出路面',      ja: '車道逸脱' },
  wrong_way:      { 'zh-TW': '行錯路線／逆走',          ja: '経路違反・逆走' },
  bus_lane:       { 'zh-TW': '駛入巴士專用線',          ja: 'バス専用レーン走行' },
  toll_crash:     { 'zh-TW': '撞到ETC閘桿',            ja: 'ETCバー衝突' },
  collision:      { 'zh-TW': '碰撞事故',               ja: '衝突事故' },
}

export const PASS_MARK = 70
export const START_POINTS = 100

export interface ViolationRecord {
  code: ViolationCode
  legIndex: number
  eventId: string
  deduction: number
  atMs: number  // course clock
  kmh?: number  // speed when it happened, if relevant
}
