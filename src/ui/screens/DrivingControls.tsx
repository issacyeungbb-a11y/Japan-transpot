import { inputState } from '../../game/inputState'

type InputKey = 'throttle' | 'brake' | 'left' | 'right'

interface Props {
  disabled?: boolean
}

export function DrivingControls({ disabled }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40 select-none">
      {/* Steering — two tap buttons, large touch targets */}
      <div className="flex gap-2">
        <DriveButton k="left"  disabled={disabled} color="#1A4E8C" icon="◀" label="左轉" />
        <DriveButton k="right" disabled={disabled} color="#1A4E8C" icon="▶" label="右轉" />
      </div>

      {/* Throttle + Brake */}
      <div className="flex gap-2">
        <DriveButton k="throttle" disabled={disabled} color="#2e7d32" icon="▲" label="油門" />
        <DriveButton k="brake"    disabled={disabled} color="#c62828" icon="▼" label="煞車" />
      </div>
    </div>
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
