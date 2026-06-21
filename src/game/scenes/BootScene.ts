import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // All graphics are drawn programmatically — no external asset files needed
  }

  create() {
    this.scene.start('ScenarioScene')
  }
}
