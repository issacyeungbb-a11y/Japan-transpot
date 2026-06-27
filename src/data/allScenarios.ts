import { ALL_SCENARIOS } from './scenarios'
import type { Scenario } from './types'

// The game is a single unified series — every scenario, ordered easy → hard.
export function allScenarios(): Scenario[] {
  return [...ALL_SCENARIOS].sort((a, b) => a.difficulty - b.difficulty)
}
