import { ALL_SCENARIOS } from './scenarios'
import type { GameMode, Scenario } from './types'

export function scenariosForMode(mode: GameMode): Scenario[] {
  return ALL_SCENARIOS
    .filter((s) => !s.modes || s.modes.includes(mode))
    .sort((a, b) => a.difficulty - b.difficulty)
}
