import type { Scenario, ScenarioNPC } from '../types'

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
  return {
    ...npc,
    variant: npc.variant ?? defaultVariantFor(scenario, index),
  }
}

function defaultVariantFor(scenario: Scenario, index: number): VehicleVariant {
  if (scenario.roadType === 'highway') return index % 2 === 0 ? 'truck' : 'kei'
  if (scenario.busLane) return 'bus'
  if (scenario.category === 'speed') return 'kei'
  if (scenario.difficulty === 3 && index % 3 === 1) return 'taxi'
  return 'car'
}

function ambientTrafficFor(
  scenario: Scenario,
  density: TrafficDensity
): ScenarioNPC[] {
  const roadType = scenario.roadType ?? 'cross'
  const count = DENSITY_SCORE[density]

  if (roadType === 'highway') return highwayTraffic(count)
  if (roadType === 'straight') return straightRoadTraffic(scenario, count)
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

function intersectionTraffic(scenario: Scenario, count: number): ScenarioNPC[] {
  const npcs: ScenarioNPC[] = [
    vehicle('ambient-oncoming-kei', 'kei', SB_X, CY - 360, SB_X, CY + 360, 112, 1800, 0x26a69a),
  ]

  if (scenario.maneuver === 'right' || count >= 3) {
    npcs.push(vehicle('ambient-oncoming-taxi', 'taxi', SB_X, CY - 400, SB_X, CY + 380, 135, 3900, 0xffc107))
  }

  if (scenario.maneuver === 'left') {
    npcs.push(vehicle('ambient-left-blind-scooter', 'scooter', NB_X - 34, 980, NB_X - 34, 360, 104, 2300, 0xff7043))
  }

  // Cross-street vehicles only where the player has NO protected green. At a
  // signalised junction the cross street is red while the player is green (or
  // turns green), so cross traffic must never occupy the player's path — that
  // would be an unfair T-bone. Cross traffic is realistic only at stop signs,
  // unsignalised/flashing junctions, and priority-road crossings, where the
  // player is taught to yield.
  if (!playerGetsGreen(scenario)) {
    npcs.push(vehicle('ambient-cross-truck', 'truck', -60, CROSS_Y, 860, CROSS_Y, 130, 2500, 0x78909c))
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
    s != null && s.type === 'standard' && s.color === 'green'
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
  color: number
): ScenarioNPC {
  return { id, type: 'vehicle', variant, startX, startY, endX, endY, speed, startAtMs, color }
}

function mergeNpcs(base: ScenarioNPC[], ambient: ScenarioNPC[]): ScenarioNPC[] {
  const ids = new Set(base.map((npc) => npc.id))
  return [...base, ...ambient.filter((npc) => !ids.has(npc.id))]
}
