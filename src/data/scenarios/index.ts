import { drivingScenarios } from './driving'
import { enhanceScenario } from './enhance'
import type { Scenario } from '../types'

export const ALL_SCENARIOS: Scenario[] = drivingScenarios.map(enhanceScenario)

export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id)
}
