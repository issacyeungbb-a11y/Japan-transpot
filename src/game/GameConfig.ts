import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { ScenarioScene } from './scenes/ScenarioScene'
import { GAME_WIDTH, GAME_HEIGHT } from './dimensions'

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#2d5a27',
    scene: [BootScene, ScenarioScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // No physics engine: movement and collision are computed by ScenarioScene.
  }
}
