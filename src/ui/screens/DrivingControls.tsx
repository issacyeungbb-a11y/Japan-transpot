import { useRef } from 'react'
import { inputState } from '../../game/inputState'

type Key = 'left' | 'right' | 'throttle' | 'brake'

interface Props {
  disabled?: boolean
}

export function DrivingControls({ disabled }: Props) {
  return (
    <div className="flex items-stretch justify-between gap-3 px-4 py-3 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40 select-none">
      {/* Steering */}
      <div className="flex gap-2">
        <HoldButton k="left" disabled={disabled} color="#1A4E8C" label="⬅️" sub="軚 / 左" />
        <HoldButton k="right" disabled={disabled} color="#1A4E8C" label="➡️" sub="軚 / 右" />
      </div>

      {/* Throttle + Brake */}
      <div className="flex gap-2">
        <HoldButton k="throttle" disabled={disabled} color="#2e7d32" label="🟢" sub="油門" />
        <HoldButton k="brake" disabled={disabled} color="#c62828" label="🔴" sub="煞車" />
      </div>
    </div>
  )
}

function HoldButton({
  k,
  color,
  label,
  sub,
  disabled,
}: {
  k: Key
  color: string
  label: string
  sub: string
  disabled?: boolean
}) {
  const activeRef = useRef(false)

  const press = () => {
    if (disabled) return
    activeRef.current = true
    inputState[k] = true
  }
  const release = () => {
    activeRef.current = false
    inputState[k] = false
  }

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
      className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl font-bold text-white text-2xl transition-transform active:scale-95 disabled:opacity-40 touch-none"
      style={{
        backgroundColor: `${color}33`,
        border: `2px solid ${color}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{label}</span>
      <span className="text-[10px] text-gray-300 font-normal mt-0.5">{sub}</span>
    </button>
  )
}
