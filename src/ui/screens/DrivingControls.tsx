import { useRef, useState } from 'react'
import { inputState } from '../../game/inputState'

interface Props {
  disabled?: boolean
}

export function DrivingControls({ disabled }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40 select-none">
      <SteeringWheel disabled={disabled} />

      <div className="flex gap-2">
        <HoldButton k="throttle" disabled={disabled} color="#2e7d32" label="🟢" sub="油門" />
        <HoldButton k="brake"    disabled={disabled} color="#c62828" label="🔴" sub="煞車" />
      </div>
    </div>
  )
}

// ── Steering Wheel ──────────────────────────────────────────────────────────

function SteeringWheel({ disabled }: { disabled?: boolean }) {
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    setDragging(true)
    startXRef.current = e.clientX
    wrapperRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const delta = e.clientX - startXRef.current
    const rot = Math.max(-50, Math.min(50, delta * 0.9))
    setRotation(rot)
    inputState.left  = rot < -10
    inputState.right = rot > 10
  }

  const onRelease = () => {
    setDragging(false)
    setRotation(0)
    inputState.left  = false
    inputState.right = false
  }

  return (
    <div
      ref={wrapperRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex flex-col items-center gap-1 touch-none select-none ${disabled ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <svg
        width="96"
        height="96"
        viewBox="-50 -50 100 100"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: dragging ? 'none' : 'transform 0.25s ease-out',
          filter: `drop-shadow(0 0 ${Math.abs(rotation) > 10 ? 6 : 0}px #1A4E8C)`,
        }}
      >
        {/* Outer rim */}
        <circle cx="0" cy="0" r="44" fill="none" stroke="#1A4E8C" strokeWidth="9" strokeLinecap="round" />
        {/* Spokes at 90°, 210°, 330° (⬆ top + lower-left + lower-right) */}
        <line x1="0"    y1="-44"  x2="0"    y2="-6"   stroke="#1A4E8C" strokeWidth="5" strokeLinecap="round" />
        <line x1="-38"  y1="22"   x2="-5"   y2="3"    stroke="#1A4E8C" strokeWidth="5" strokeLinecap="round" />
        <line x1="38"   y1="22"   x2="5"    y2="3"    stroke="#1A4E8C" strokeWidth="5" strokeLinecap="round" />
        {/* Hub */}
        <circle cx="0" cy="0" r="9" fill="#1A4E8C" />
        {/* Flat bottom grip */}
        <path d="M -28 40 Q 0 50 28 40" fill="none" stroke="#1A4E8C" strokeWidth="9" strokeLinecap="round" />
      </svg>

      {/* Directional hint labels */}
      <div className="flex items-center gap-6 text-[9px] text-gray-400 font-medium mt-0.5">
        <span>⬅ 左</span>
        <span className="text-gray-500 text-[8px]">軚盤</span>
        <span>右 ➡</span>
      </div>
    </div>
  )
}

// ── Hold Button (throttle / brake) ─────────────────────────────────────────

type Key = 'throttle' | 'brake'

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
