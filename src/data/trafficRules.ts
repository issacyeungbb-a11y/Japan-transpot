import type {
  TrafficLightState,
  VehicleIntent,
  MandatoryAction,
  ArrowDir,
} from './types'

// 道路交通法第7条：信号機の信号等に従う義務
export function getMandatoryAction(state: TrafficLightState): MandatoryAction {
  switch (state.type) {
    case 'standard':
      if (state.color === 'red') return 'stop'
      if (state.color === 'yellow') return 'stop'
      return 'proceed'

    case 'arrow':
      // Arrow signals override the main light — only allowed directions can proceed
      if (state.activeArrows.length > 0) return 'yield'
      return 'stop'

    case 'flashing':
      // 赤色点滅 = 一時停止（道路交通法第7条第4項）
      if (state.color === 'red') return 'stop'
      // 黄色点滅 = 注意して進行可
      return 'yield'

    case 'pedestrian':
      if (state.phase === 'stop') return 'proceed'
      return 'yield'
  }
}

export function isLegalToProceed(
  state: TrafficLightState,
  intent: VehicleIntent
): boolean {
  switch (state.type) {
    case 'standard':
      if (state.color === 'green') return true
      if (state.color === 'red' || state.color === 'yellow') return false
      return false

    case 'arrow': {
      // Red or yellow main light: only allowed if matching arrow is active
      const arrowForIntent = intentToArrow(intent)
      if (!arrowForIntent) return false
      return state.activeArrows.includes(arrowForIntent)
    }

    case 'flashing':
      if (state.color === 'yellow') return true
      // Red flash: must stop first, then may proceed when safe
      // isLegalToProceed returns false because a stop is mandatory before any movement
      return false

    case 'pedestrian':
      // Pedestrian signal doesn't directly govern vehicles but indicates crossing activity
      return state.phase === 'stop'
  }
}

// Whether a flashing red has been handled correctly (stopped first, then proceeds)
export function isFlashingRedHandledCorrectly(
  hasStopped: boolean,
  proceedWhenSafe: boolean
): boolean {
  return hasStopped && proceedWhenSafe
}

// Yellow light: must stop UNLESS already past the stop line or emergency stop is dangerous
export function isYellowLightActionCorrect(
  action: 'stop' | 'proceed',
  alreadyPastStopLine: boolean
): boolean {
  if (alreadyPastStopLine) return action === 'proceed'
  return action === 'stop'
}

export function isArrowPermitted(
  state: TrafficLightState,
  direction: ArrowDir
): boolean {
  if (state.type !== 'arrow') return false
  return state.activeArrows.includes(direction)
}

function intentToArrow(intent: VehicleIntent): ArrowDir | null {
  switch (intent) {
    case 'turn_left': return 'left'
    case 'straight': return 'straight'
    case 'turn_right': return 'right'
    default: return null
  }
}

export function calcScore(
  isCorrect: boolean,
  timeUsed: number,
  timerTotal: number,
  streak: number,
  difficulty: 1 | 2 | 3
): number {
  if (!isCorrect) return 0
  const base = 100
  const timeRemaining = Math.max(0, timerTotal - timeUsed)
  const speedBonus = Math.floor((timeRemaining / timerTotal) * 50)
  const streakMultiplier = Math.min(1 + streak * 0.1, 2.0)
  const diffMultiplier = difficulty
  return Math.round((base + speedBonus) * streakMultiplier * diffMultiplier)
}
