// Shared, mutable input state written by BOTH the on-screen React controls
// and the keyboard handler, and read each frame by the 3D course engine.
export interface InputState {
  throttle: boolean
  brake: boolean
  left: boolean
  right: boolean
  indicatorLeft: boolean
  indicatorRight: boolean
  glanceLeft: boolean
  glanceRight: boolean
}

export const inputState: InputState = {
  throttle: false,
  brake: false,
  left: false,
  right: false,
  indicatorLeft: false,
  indicatorRight: false,
  glanceLeft: false,
  glanceRight: false,
}

export function resetInputState() {
  inputState.throttle = false
  inputState.brake = false
  inputState.left = false
  inputState.right = false
  inputState.indicatorLeft = false
  inputState.indicatorRight = false
  inputState.glanceLeft = false
  inputState.glanceRight = false
}
