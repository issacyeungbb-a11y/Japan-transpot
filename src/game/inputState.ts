// Shared, mutable input state written by BOTH the on-screen React controls
// and the Phaser keyboard handler, and read each frame by the driving scene.
export interface InputState {
  throttle: boolean
  brake: boolean
  left: boolean
  right: boolean
}

export const inputState: InputState = {
  throttle: false,
  brake: false,
  left: false,
  right: false,
}

export function resetInputState() {
  inputState.throttle = false
  inputState.brake = false
  inputState.left = false
  inputState.right = false
}
