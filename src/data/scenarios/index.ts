import { drivingScenarios } from './driving'
import { enhanceScenario } from './enhance'
import type { Scenario } from '../types'

export const ALL_SCENARIOS: Scenario[] = drivingScenarios.map(enhanceScenario)

export function getScenarioById(id: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id)
}

export function getScenariosByCategory(category: Scenario['category']): Scenario[] {
  return ALL_SCENARIOS.filter((s) => s.category === category)
}

export function getScenariosByDifficulty(difficulty: 1 | 2 | 3): Scenario[] {
  return ALL_SCENARIOS.filter((s) => s.difficulty === difficulty)
}

export function getShuffledScenarioIds(count?: number): string[] {
  const ids = [...ALL_SCENARIOS].sort(() => Math.random() - 0.5).map((s) => s.id)
  return count ? ids.slice(0, count) : ids
}
