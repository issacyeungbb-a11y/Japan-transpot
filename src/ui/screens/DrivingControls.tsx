import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inputState } from '../../game/inputState'

type HoldKey = 'throttle' | 'brake' | 'left' | 'right'
type Side = 'left' | 'right'

interface Props {
  disabled?: boolean
}

export function DrivingControls({ disabled }: Props) {
  const { t } = useTranslation()
  // Which indicator is latched on. Mirrors inputState.indicatorLeft/Right for
  // touch input; the scene resets inputState between scenarios, and this state
  // resets whenever the controls are disabled (scenario staging / feedback) —
  // adjusted during render, per the React "derive state from props" pattern.
  const [signal, setSignal] = useState<Side | null>(null)
  if (disabled && signal !== null) setSignal(null)

  const toggleSignal = (side: Side) => {
    if (disabled) return
    const next = signal === side ? null : side
    setSignal(next)
    inputState.indicatorLeft = next === 'left'
    inputState.indicatorRight = next === 'right'
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40 select-none"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {/* Steering + left blind-spot glance */}
      <div className="flex flex-col items-start gap-1">
        <GlanceButton k="glanceLeft" disabled={disabled} label={t('drive.glance_left')} />
        <div className="flex gap-2">
          <DriveButton k="left"  disabled={disabled} color="#1A4E8C" icon="◀" label={t('drive.steer_left')} />
          <DriveButton k="right" disabled={disabled} color="#1A4E8C" icon="▶" label={t('drive.steer_right')} />
        </div>
        <SignalButton
          side="left"
          active={signal === 'left'}
          disabled={disabled}
          label={t('drive.signal_left')}
          onToggle={() => toggleSignal('left')}
        />
      </div>

      {/* Throttle + Brake + right blind-spot glance */}
      <div className="flex flex-col items-end gap-1">
        <GlanceButton k="glanceRight" disabled={disabled} label={t('drive.glance_right')} />
        <div className="flex gap-2">
          <DriveButton k="throttle" disabled={disabled} color="#2e7d32" icon="▲" label={t('drive.throttle')} />
          <DriveButton k="brake"    disabled={disabled} color="#c62828" icon="▼" label={t('drive.brake')} />
        </div>
        <SignalButton
          side="right"
          active={signal === 'right'}
          disabled={disabled}
          label={t('drive.signal_right')}
          onToggle={() => toggleSignal('right')}
        />
      </div>
    </div>
  )
}

function SignalButton({
  side,
  label,
  active,
  disabled,
  onToggle,
}: {
  side: Side
  label: string
  active: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      onContextMenu={(e) => e.preventDefault()}
      className="flex items-center justify-center gap-1 rounded-full font-bold transition-transform active:scale-95 disabled:opacity-40 touch-none"
      style={{
        width: 'clamp(54px, 13vw, 62px)',
        height: 'clamp(30px, 8vw, 36px)',
        fontSize: 'clamp(10px, 2.7vw, 12px)',
        color: active ? '#111111' : '#ffffff',
        backgroundColor: active ? '#FFC107' : '#4a300dcc',
        border: '2px solid #FFC107',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{side === 'left' ? '↙' : '↘'}</span>
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
  k: HoldKey
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
