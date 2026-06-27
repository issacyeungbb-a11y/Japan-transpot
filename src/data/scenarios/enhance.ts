import type { Scenario, ScenarioNPC, NpcBehavior } from '../types'

type TrafficDensity = 'light' | 'normal' | 'busy'
type RoadComplexity = 'simple' | 'urban' | 'complex'
type VehicleVariant = 'car' | 'kei' | 'taxi' | 'truck' | 'bus' | 'scooter'

// Mirrors ScenarioScene world geometry.
const CX = 400
const CY = 520
const INT = 80
const ROAD_W = 80

const NB_X = CX - 20
const SB_X = CX + 20
const CROSS_Y = CY + 4
const PED_Y = CY + INT / 2 + 48
const HWY_NB_ADJACENT_X = CX
const HWY_SB_X = CX + 40
const BUS_LANE_X = CX - 30

const DENSITY_SCORE: Record<TrafficDensity, number> = {
  light: 1,
  normal: 2,
  busy: 3,
}

export function enhanceScenario(scenario: Scenario): Scenario {
  const trafficDensity = scenario.trafficDensity ?? defaultTrafficDensity(scenario)
  const roadComplexity = scenario.roadComplexity ?? defaultRoadComplexity(scenario)
  const baseNpcs = (scenario.npcs ?? []).map((npc, index) => normaliseNpc(npc, scenario, index))
  const ambient = ambientTrafficFor(scenario, trafficDensity)
  const npcs = mergeNpcs(baseNpcs, ambient)
  const hasPedestrian = npcs.some((npc) => npc.type === 'pedestrian')
  const hasVehicleYield = needsVehicleYield(scenario)

  return {
    ...scenario,
    trafficDensity,
    roadComplexity,
    safetyCheck: scenario.safetyCheck ?? defaultSafetyCheck(scenario),
    timeLimitMs: scenario.timeLimitMs ?? defaultTimeLimitMs(scenario, trafficDensity),
    npcs,
    evaluation: {
      ...scenario.evaluation,
      yieldToPedestrians: scenario.evaluation.yieldToPedestrians ?? (hasPedestrian || undefined),
      yieldToVehicles: scenario.evaluation.yieldToVehicles ?? (hasVehicleYield || undefined),
    },
  }
}

function defaultSafetyCheck(scenario: Scenario): Scenario['safetyCheck'] {
  if (scenario.maneuver !== 'left') return undefined
  return { blindSpotLeft: true, windowMs: { from: 0, to: 9000 } }
}

function defaultTrafficDensity(scenario: Scenario): TrafficDensity {
  if (scenario.difficulty === 1) return 'light'
  if (scenario.difficulty === 2) return 'normal'
  return 'busy'
}

function defaultRoadComplexity(scenario: Scenario): RoadComplexity {
  if (scenario.difficulty === 1 && scenario.maneuver === 'straight') return 'urban'
  if (scenario.difficulty === 3 || scenario.busLane || scenario.tollGate || scenario.narrowRoad) return 'complex'
  return 'urban'
}

function defaultTimeLimitMs(scenario: Scenario, density: TrafficDensity): number {
  const densityBonus = DENSITY_SCORE[density] * 3500
  const roadBonus = scenario.roadType === 'highway' ? 10000 : scenario.maneuver === 'right' ? 7000 : 3500
  const weatherBonus = scenario.weather === 'rain' ? 5000 : 0
  return 36000 + scenario.difficulty * 4500 + densityBonus + roadBonus + weatherBonus
}

function normaliseNpc(npc: ScenarioNPC, scenario: Scenario, index: number): ScenarioNPC {
  if (npc.type === 'pedestrian') return npc
  const variant = npc.variant ?? defaultVariantFor(scenario, index)
  const behavior = npc.behavior ?? defaultBehaviorFor(npc, scenario, index)
  return {
    ...npc,
    variant,
    behavior,
    signalsIntent: npc.signalsIntent ?? behavior !== 'rail',
    reactionGap: npc.reactionGap ?? defaultReactionGap(behavior, variant),
  }
}

function defaultVariantFor(scenario: Scenario, index: number): VehicleVariant {
  if (scenario.roadType === 'highway') return index % 2 === 0 ? 'truck' : 'kei'
  if (scenario.busLane) return 'bus'
  if (scenario.category === 'speed') return 'kei'
  if (scenario.difficulty === 3 && index % 3 === 1) return 'taxi'
  return 'car'
}

function defaultBehaviorFor(npc: ScenarioNPC, scenario: Scenario, index: number): NpcBehavior {
  if (scenario.roadType === 'roundabout') return index % 2 === 0 ? 'cruise' : 'random'
  if (scenario.evaluation.yieldToVehicles) return 'aggressive'
  if (npc.variant === 'scooter' && scenario.maneuver === 'left') return 'aggressive'
  if (scenario.difficulty === 3 && index % 3 === 1) return 'random'
  return 'cruise'
}

function defaultReactionGap(behavior: NpcBehavior, variant: VehicleVariant): number {
  if (behavior === 'aggressive') return 48
  if (behavior === 'yield') return 110
  if (variant === 'truck' || variant === 'bus') return 125
  if (variant === 'scooter') return 70
  return 90
}

function ambientTrafficFor(
  scenario: Scenario,
  density: TrafficDensity
): ScenarioNPC[] {
  const roadType = scenario.roadType ?? 'cross'
  const count = DENSITY_SCORE[density]

  if (roadType === 'highway' || roadType === 'merge') return highwayTraffic(count)
  if (roadType === 'roundabout') return roundaboutTraffic(count)
  if (roadType === 'straight') return straightRoadTraffic(scenario, count)
  if (roadType === 't-junction') return tJunctionTraffic(scenario, count)
  return intersectionTraffic(scenario, count)
}

function highwayTraffic(count: number): ScenarioNPC[] {
  const npcs: ScenarioNPC[] = [
    vehicle('ambient-hwy-bus', 'bus', HWY_SB_X, 60, HWY_SB_X, 1060, 145, 1400, 0x2e7d32),
    vehicle('ambient-hwy-truck', 'truck', HWY_NB_ADJACENT_X, 1040, HWY_NB_ADJACENT_X, 80, 112, 2600, 0x78909c),
  ]

  if (count >= 3) {
    npcs.push(vehicle('ambient-hwy-taxi', 'taxi', HWY_SB_X, 80, HWY_SB_X, 1060, 165, 4300, 0xffc107))
  }
  return npcs
}

function roundaboutTraffic(count: number): ScenarioNPC[] {
  const npcs: ScenarioNPC[] = [
    vehicle('ambient-ring-kei', 'kei', CX + 88, CY, CX - 88, CY, 72, 900, 0x26a69a, 'cruise', { x: CX, y: CY + 88 }, 'left'),
  ]

  if (count >= 2) {
    npcs.push(vehicle('ambient-ring-random', 'car', CX, CY - 88, CX, CY + 88, 68, 3100, 0xffc107, 'random', { x: CX + 88, y: CY }, 'left'))
  }
  return npcs
}

function straightRoadTraffic(scenario: Scenario, count: number): ScenarioNPC[] {
  if (scenario.busLane) {
    return [
      vehicle('ambient-bus-lane-bus', 'bus', BUS_LANE_X, 940, BUS_LANE_X, 120, 68, 2600, 0x2e7d32),
      vehicle('ambient-bus-lane-scooter', 'scooter', NB_X + 52, 820, NB_X + 52, 220, 92, 5000, 0xff7043),
    ]
  }

  const npcs: ScenarioNPC[] = [
    vehicle('ambient-straight-kei', 'kei', SB_X, 120, SB_X, 1040, 94, 1900, 0x26a69a),
  ]

  if (scenario.narrowRoad || count >= 2) {
    npcs.push(vehicle('ambient-straight-scooter', 'scooter', SB_X + 2, 80, SB_X + 2, 1040, 118, 3900, 0xef5350))
  }
  if (count >= 3) {
    npcs.push(vehicle('ambient-straight-taxi', 'taxi', NB_X + 10, 920, NB_X + 10, 180, 76, 6200, 0xffc107))
  }

  return npcs
}

function approachCompanions(scenario: Scenario, count: number): ScenarioNPC[] {
  const npcs: ScenarioNPC[] = []

  if (scenario.maneuver !== 'left') {
    npcs.push(vehicle('ambient-rear-scooter', 'scooter', NB_X - 34, 1020, NB_X - 34, 520, 82, 3400, 0xff7043, 'cruise'))
  }

  if (count >= 2 && scenario.maneuver === 'straight') {
    npcs.push(vehicle('ambient-lead-kei', 'kei', NB_X, 730, NB_X, 230, 70, 0, 0x8bc34a, 'cruise'))
  }

  if (count >= 3 && scenario.roadType === 'multilane') {
    npcs.push(vehicle('ambient-adjacent-car', 'car', CX - 18, 980, CX - 18, 260, 96, 1800, 0x42a5f5, 'cruise'))
  }

  return npcs
}

function tJunctionTraffic(scenario: Scenario, count: number): ScenarioNPC[] {
  const npcs: ScenarioNPC[] = approachCompanions(scenario, count)
  const priorityBehavior: NpcBehavior = scenario.evaluation.yieldToVehicles ? 'aggressive' : 'cruise'

  // A T-junction has no north arm in this game geometry. Do not spawn vertical
  // "oncoming" traffic from the closed road; keep traffic on the horizontal
  // main road unless the player's signal protects them.
  if (!playerGetsGreen(scenario)) {
    npcs.push(vehicle('ambient-main-road-car', 'car', -70, CROSS_Y, 870, CROSS_Y, 118, 1200, 0x26a69a, priorityBehavior))
    if (count >= 2) {
      npcs.push(vehicle('ambient-main-road-kei', 'kei', 870, CROSS_Y + 12, -70, CROSS_Y + 12, 98, 3300, 0xffc107, 'cruise'))
    }
  }

  return npcs
}

function intersectionTraffic(scenario: Scenario, count: number): ScenarioNPC[] {
  const priorityBehavior: NpcBehavior = scenario.evaluation.yieldToVehicles ? 'aggressive' : 'cruise'
  const npcs: ScenarioNPC[] = approachCompanions(scenario, count)
  const protectedPlayerFlow = playerGetsGreen(scenario)

  if (scenario.roadType !== 'uncontrolled') {
    npcs.push(vehicle('ambient-oncoming-kei', 'kei', SB_X, CY - 360, SB_X, CY + 360, 112, 1800, 0x26a69a, priorityBehavior))
  }

  if (scenario.roadType !== 'uncontrolled' && (scenario.maneuver === 'right' || count >= 3)) {
    npcs.push(vehicle('ambient-oncoming-taxi', 'taxi', SB_X, CY - 400, SB_X, CY + 380, 135, 3900, 0xffc107, priorityBehavior))
  }

  if (scenario.maneuver === 'left') {
    npcs.push(vehicle('ambient-left-blind-scooter', 'scooter', NB_X - 34, 980, NB_X - 34, 360, 104, 2300, 0xff7043, 'aggressive'))
  }

  // Cross-street vehicles only where the player has NO protected green. At a
  // signalised junction the cross street is red while the player is green (or
  // turns green), so cross traffic must never occupy the player's path — that
  // would be an unfair T-bone. Cross traffic is realistic only at stop signs,
  // unsignalised/flashing junctions, and priority-road crossings, where the
  // player is taught to yield.
  if (!protectedPlayerFlow) {
    npcs.push(vehicle('ambient-cross-truck', 'truck', -60, CROSS_Y, 860, CROSS_Y, 130, 2500, 0x78909c, priorityBehavior))
  }

  // An ambient pedestrian crossing the player's approach is a yield lesson for
  // turning drivers. On a straight-through green the parallel crosswalk has its
  // own signal, so don't drop a crosser into the path of a straight driver.
  if (count >= 3 && scenario.category !== 'pedestrian' && scenario.maneuver !== 'straight') {
    npcs.push({
      id: 'ambient-crosswalk-tourist',
      type: 'pedestrian',
      startX: CX + ROAD_W / 2 + 14,
      startY: PED_Y,
      endX: CX - ROAD_W / 2 - 14,
      endY: PED_Y,
      speed: 34,
      startAtMs: 5600,
      color: 0xffd54f,
    })
  }

  return npcs
}

// True when the player crosses on a protected green: a standard green now, or a
// signal that turns green during the scenario (red→green wait). In these cases
// the cross street is red and must not send traffic across the player's path.
function playerGetsGreen(scenario: Scenario): boolean {
  const isGreen = (s: Scenario['light']): boolean =>
    s != null &&
    ((s.type === 'standard' && s.color === 'green') ||
      (s.type === 'arrow' && s.activeArrows.includes(scenario.maneuver)))
  if (isGreen(scenario.light)) return true
  return (scenario.lightChanges ?? []).some((change) => isGreen(change.state))
}

function needsVehicleYield(scenario: Scenario): boolean {
  return (
    scenario.evaluation.yieldToVehicles === true ||
    scenario.maneuver === 'right' ||
    scenario.category === 'priority' ||
    scenario.narrowRoad === true
  )
}

function vehicle(
  id: string,
  variant: VehicleVariant,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  speed: number,
  startAtMs: number,
  color: number,
  behavior: NpcBehavior = 'cruise',
  turnAt?: { x: number; y: number },
  turnTo?: ScenarioNPC['turnTo'],
): ScenarioNPC {
  return {
    id,
    type: 'vehicle',
    variant,
    startX,
    startY,
    endX,
    endY,
    speed,
    startAtMs,
    color,
    behavior,
    signalsIntent: behavior !== 'rail',
    reactionGap: defaultReactionGap(behavior, variant),
    turnAt,
    turnTo,
  }
}

function mergeNpcs(base: ScenarioNPC[], ambient: ScenarioNPC[]): ScenarioNPC[] {
  const ids = new Set(base.map((npc) => npc.id))
  const merged = [...base]
  for (const npc of ambient) {
    if (ids.has(npc.id)) continue
    if (merged.some((existing) => pathsConflict(existing, npc))) continue
    merged.push(npc)
  }
  return merged
}

function pathsConflict(a: ScenarioNPC, b: ScenarioNPC): boolean {
  if (a.type !== 'vehicle' || b.type !== 'vehicle') return false
  for (let t = 0; t <= 16000; t += 200) {
    const pa = positionAt(a, t)
    const pb = positionAt(b, t)
    if (!pa || !pb) continue
    if (Math.hypot(pa.x - pb.x, pa.y - pb.y) < 36) return true
  }
  return false
}

function positionAt(npc: ScenarioNPC, elapsedMs: number): { x: number; y: number } | null {
  const activeMs = elapsedMs - npc.startAtMs
  if (activeMs < 0) return null
  const dx = npc.endX - npc.startX
  const dy = npc.endY - npc.startY
  const dist = Math.hypot(dx, dy)
  const progress = dist === 0 ? 1 : (npc.speed * activeMs / 1000) / dist
  if (progress > 1) return null
  return {
    x: npc.startX + dx * progress,
    y: npc.startY + dy * progress,
  }
}
