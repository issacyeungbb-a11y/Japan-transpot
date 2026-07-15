import type {
  TrafficLightState,
  MandatoryAction,
  Maneuver,
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

const maneuverToArrow: Record<Maneuver, 'left' | 'straight' | 'right'> = {
  left: 'left',
  straight: 'straight',
  right: 'right',
}

// Whether the vehicle is allowed to cross the stop line RIGHT NOW for the given
// maneuver, considering only the signal. (A flashing red still returns true here
// because the "must fully stop first" rule is enforced separately by the scene.)
export function canCrossLine(
  light: TrafficLightState | null,
  maneuver: Maneuver
): boolean {
  if (!light) return true // no signal — governed by other rules (yield / slow)

  switch (light.type) {
    case 'standard':
      return light.color === 'green'

    case 'arrow':
      // Only the direction whose arrow is lit may proceed
      return light.activeArrows.includes(maneuverToArrow[maneuver])

    case 'flashing':
      // Red flashing: may proceed AFTER a full stop (scene checks the stop).
      // Yellow flashing: may proceed with caution.
      return true

    case 'pedestrian':
      // Pedestrian signal does not by itself bar the vehicle.
      return true
  }
}

