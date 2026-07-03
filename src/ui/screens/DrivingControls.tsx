import { inputState } from '../../game/inputState'

type InputKey = 'throttle' | 'brake' | 'left' | 'right' | 'glanceLeft' | 'glanceRight' | 'indicatorLeft' | 'indicatorRight'

interface Props {
  disabled?: boolean
}

export function DrivingControls({ disabled }: Props) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40 select-none"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {/* Steering + left blind-spot glance */}
      <div className="flex flex-col items-start gap-1">
        <GlanceButton k="glanceLeft" disabled={disabled} label="左後" />
        <div className="flex gap-2">
          <DriveButton k="left"  disabled={disabled} color="#1A4E8C" icon="◀" label="左轉" />
          <DriveButton k="right" disabled={disabled} color="#1A4E8C" icon="▶" label="右轉" />
        </div>
        <SignalButton k="indicatorLeft" disabled={disabled} label="左燈" />
      </div>

      {/* Throttle + Brake + right blind-spot glance */}
      <div className="flex flex-col items-end gap-1">
        <GlanceButton k="glanceRight" disabled={disabled} label="右後" />
        <div className="flex gap-2">
          <DriveButton k="throttle" disabled={disabled} color="#2e7d32" icon="▲" label="油門" />
          <DriveButton k="brake"    disabled={disabled} color="#c62828" icon="▼" label="煞車" />
        </div>
        <SignalButton k="indicatorRight" disabled={disabled} label="右燈" />
      </div>
    </div>
  )
}

function SignalButton({
  k,
  label,
  disabled,
}: {
  k: 'indicatorLeft' | 'indicatorRight'
  label: string
  disabled?: boolean
}) {
  const press = () => {
    if (disabled) return
    inputState.indicatorLeft = false
    inputState.indicatorRight = false
    inputState[k] = true
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={press}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center justify-center gap-1 rounded-full font-bold text-white transition-transform active:scale-95 disabled:opacity-40 touch-none"
      style={{
        width: 'clamp(54px, 13vw, 62px)',
        height: 'clamp(30px, 8vw, 36px)',
        fontSize: 'clamp(10px, 2.7vw, 12px)',
        backgroundColor: '#4a300dcc',
        border: '2px solid #FFC107',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{k === 'indicatorLeft' ? '↙' : '↘'}</span>
      <span>{label}</span>
    </button>
  )
}

function GlanceButton({
  k,
  label,
  disabled,
}: {
  k: 'glanceLeft' | 'glanceRight'
  label: string
  disabled?: boolean
}) {
  const press   = () => { if (!disabled) inputState[k] = true }
  const release = () => { inputState[k] = false }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        press()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center justify-center gap-1 rounded-full font-bold text-white transition-transform active:scale-95 disabled:opacity-40 touch-none"
      style={{
        width: 'clamp(54px, 13vw, 62px)',
        height: 'clamp(34px, 9vw, 42px)',
        fontSize: 'clamp(10px, 2.7vw, 12px)',
        backgroundColor: '#263238cc',
        border: '2px solid #90A4AE',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>👀</span>
      <span>{label}</span>
    </button>
  )
}

function DriveButton({
  k,
  color,
  icon,
  label,
  disabled,
}: {
  k: InputKey
  color: string
  icon: string
  label: string
  disabled?: boolean
}) {
  const press   = () => { if (!disabled) inputState[k] = true }
  const release = () => { inputState[k] = false }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        press()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center rounded-2xl font-bold text-white transition-transform active:scale-95 disabled:opacity-40 touch-none"
      style={{
        width: 'clamp(60px, 18vw, 80px)',
        height: 'clamp(60px, 18vw, 80px)',
        fontSize: 'clamp(20px, 6vw, 28px)',
        backgroundColor: `${color}33`,
        border: `2px solid ${color}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{icon}</span>
      <span
        className="text-gray-300 font-normal mt-0.5"
        style={{ fontSize: 'clamp(8px, 2.5vw, 10px)' }}
      >
        {label}
      </span>
    </button>
  )
}
