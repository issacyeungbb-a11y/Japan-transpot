import { useEffect, useRef, useState } from 'react'
import { ThreeGame } from '../../game3d/ThreeGame'
import { COURSE_EVENTS } from '../../game3d/engine'
import { bridge } from '../../game/EventBridge'
import { resetInputState } from '../../game/inputState'
import { DrivingControls } from './DrivingControls'
import { useGameStore, pointsOf } from '../../store/gameStore'
import { COURSE } from '../../course/route'
import { ZONE_NAMES, VIOLATION_NAMES, type ViolationRecord, type ZoneId } from '../../course/types'
import type { BilingualText } from '../../data/types'

interface Props {
  onFinish: () => void
  onQuit: () => void
}

interface Toast {
  id: number
  text: string
  deduction: number
}

export function CourseScreen({ onFinish, onQuit }: Props) {
  const lang = useGameStore((s) => s.lang)
  const addViolation = useGameStore((s) => s.addViolation)
  const completeCourse = useGameStore((s) => s.completeCourse)
  const violations = useGameStore((s) => s.violations)

  const [kmh, setKmh] = useState(0)
  const [limit, setLimit] = useState(COURSE[0].event.speedLimit)
  const [progress, setProgress] = useState(0)
  // The engine emits READY before this component's effect subscribes (child
  // effects run first), so seed the first leg's GPS/zone directly.
  const [gps, setGps] = useState<BilingualText | null>(COURSE[0].event.gps)
  const [zone, setZone] = useState<ZoneId>(COURSE[0].event.zone)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [started, setStarted] = useState(false)
  const [finishedFlash, setFinishedFlash] = useState(false)
  const toastId = useRef(0)
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const points = pointsOf(violations)

  useEffect(() => {
    resetInputState()

    const onReady = (p: unknown) => {
      const d = p as { gps: BilingualText; zone: ZoneId }
      setGps(d.gps)
      setZone(d.zone)
    }
    const onGps = onReady
    const onStarted = () => setStarted(true)
    const onTick = (p: unknown) => {
      const d = p as { kmh: number; progress: number; limit: number }
      setKmh(d.kmh)
      setProgress(d.progress)
      setLimit(d.limit)
    }
    const onViolation = (p: unknown) => {
      const v = p as ViolationRecord
      addViolation(v)
      const id = ++toastId.current
      setToasts((ts) => [...ts, {
        id,
        text: VIOLATION_NAMES[v.code][useGameStore.getState().lang],
        deduction: v.deduction,
      }])
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3200)
    }
    const onComplete = (p: unknown) => {
      const d = p as { timeMs: number }
      completeCourse(d.timeMs)
      setFinishedFlash(true)
      finishTimer.current = setTimeout(onFinish, 2200)
    }

    bridge.on(COURSE_EVENTS.READY, onReady)
    bridge.on(COURSE_EVENTS.GPS, onGps)
    bridge.on(COURSE_EVENTS.STARTED, onStarted)
    bridge.on(COURSE_EVENTS.TICK, onTick)
    bridge.on(COURSE_EVENTS.VIOLATION, onViolation)
    bridge.on(COURSE_EVENTS.COMPLETE, onComplete)
    return () => {
      bridge.off(COURSE_EVENTS.READY, onReady)
      bridge.off(COURSE_EVENTS.GPS, onGps)
      bridge.off(COURSE_EVENTS.STARTED, onStarted)
      bridge.off(COURSE_EVENTS.TICK, onTick)
      bridge.off(COURSE_EVENTS.VIOLATION, onViolation)
      bridge.off(COURSE_EVENTS.COMPLETE, onComplete)
      if (finishTimer.current) clearTimeout(finishTimer.current)
      resetInputState()
    }
  }, [addViolation, completeCourse, onFinish])

  const speeding = kmh > limit
  const zoneName = ZONE_NAMES[zone][lang]

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a]">
      {/* Top bar: quit / points / zone */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-[#0d1b2a] border-b border-[#1A4E8C]/60 text-white select-none z-10"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onQuit}
          className="flex-shrink-0 px-3 rounded-lg text-sm font-bold text-white active:scale-95"
          style={{ backgroundColor: '#1A4E8C', border: '1px solid #4A8AD8', height: '36px' }}
        >
          ← {lang === 'zh-TW' ? '離開' : '中断'}
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-gray-400">{zoneName}</span>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-[10px] text-gray-400 mr-1">{lang === 'zh-TW' ? '持有分數' : '持ち点'}</span>
          <span className={`font-black text-lg ${points >= 70 ? 'text-[#00C853]' : 'text-[#ff5252]'}`}>{points}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#132639]">
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${Math.round(progress * 100)}%`, background: 'linear-gradient(90deg,#FF6B35,#ffa94d)' }}
        />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ThreeGame className="w-full h-full absolute inset-0" />

        {/* GPS instruction */}
        {gps && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none max-w-[92%]">
            <div className="px-4 py-1.5 rounded-full bg-black/65 text-white text-sm font-medium text-center border border-white/10">
              🧭 {gps[lang]}
            </div>
          </div>
        )}

        {/* Start hint */}
        {!started && !finishedFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-4 rounded-2xl bg-black/70 border border-[#FF6B35]/60 text-center animate-pulse">
              <div className="text-3xl mb-1">🚗</div>
              <div className="text-white font-bold">
                {lang === 'zh-TW' ? '踩油門開始路試' : 'アクセルで試験開始'}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {lang === 'zh-TW' ? '100分開始・70分合格' : '持ち点100・70点で合格'}
              </div>
            </div>
          </div>
        )}

        {/* Violation toasts */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col gap-2 pointer-events-none w-[92%] max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold text-center"
              style={{ background: 'rgba(150,20,20,0.92)', border: '1px solid #ff6b6b' }}
            >
              ⚠️ {t.text} <span className="text-[#ffd54f]">−{t.deduction}</span>
            </div>
          ))}
        </div>

        {/* Speedometer */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div
            className="px-3 py-1.5 rounded-xl text-right"
            style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <span className={`font-black text-2xl tabular-nums ${speeding ? 'text-[#ff5252]' : 'text-white'}`}>
              {kmh}
            </span>
            <span className="text-gray-400 text-[10px] ml-1">km/h</span>
          </div>
        </div>

        {/* Speed-limit chip */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-black text-[#1565c0] bg-white"
            style={{ border: '4px solid #d32f2f' }}
          >
            {limit}
          </div>
        </div>

        {/* Goal flash */}
        {finishedFlash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="px-10 py-7 rounded-3xl text-center"
              style={{
                background: 'linear-gradient(135deg,#003a1a,#005c28)',
                border: '2px solid #00C853',
                boxShadow: '0 0 48px #00C85360',
              }}
            >
              <div className="text-5xl mb-2">🏁</div>
              <div className="text-2xl font-black text-white">
                {lang === 'zh-TW' ? '完走！' : '完走！'}
              </div>
              <div className="text-gray-300 text-xs mt-2">
                {lang === 'zh-TW' ? '整理考試報告中…' : '試験レポートを作成中…'}
              </div>
            </div>
          </div>
        )}
      </div>

      <DrivingControls disabled={finishedFlash} />
    </div>
  )
}
