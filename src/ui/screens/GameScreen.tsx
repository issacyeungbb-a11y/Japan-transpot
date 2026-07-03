import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PhaserGame } from '../../game/PhaserGame'
import { HUD } from '../components/HUD'
import { DrivingControls } from './DrivingControls'
import { FeedbackModal } from './FeedbackModal'
import { bridge, PHASER_EVENTS, REACT_EVENTS } from '../../game/EventBridge'
import { inputState, resetInputState } from '../../game/inputState'
import { useGameStore } from '../../store/gameStore'
import { getScenarioById } from '../../data/scenarios'
import { calcScore } from '../../data/trafficRules'
import type { Scenario, BilingualText, Maneuver, DrivingOutcome } from '../../data/types'

type GamePhase = 'loading' | 'ready' | 'driving' | 'feedback'

interface Props {
  onSessionEnd: () => void
  onBack: () => void
}

const MANEUVER_ICON: Record<Maneuver, string> = {
  straight: '⬆️',
  left: '⬅️',
  right: '➡️',
}

export function GameScreen({ onSessionEnd, onBack }: Props) {
  const { t } = useTranslation()
  const lang = useGameStore((s) => s.lang)
  const session = useGameStore((s) => s.session)
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [instruction, setInstruction] = useState<{ text: BilingualText; maneuver: Maneuver } | null>(null)
  const [outcome, setOutcome] = useState<DrivingOutcome | null>(null)
  const [pointsEarned, setPointsEarned] = useState(0)

  const sceneReadyRef = useRef(false)
  const pendingScenarioRef = useRef<Scenario | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const glancePulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scenarioId = session?.scenarioIds[session.currentIndex]
  const currentScenario = scenarioId ? getScenarioById(scenarioId) : null
  const hasSession = Boolean(session)
  const isSessionComplete = Boolean(session && session.currentIndex >= session.scenarioIds.length)
  const currentFailures = session && currentScenario
    ? session.answers.filter((a) => a.scenarioId === currentScenario.id && !a.isCorrect).length
    : 0

  // Phaser scene finished registering its listeners
  useEffect(() => {
    const handler = () => {
      sceneReadyRef.current = true
      if (pendingScenarioRef.current) {
        bridge.emit(REACT_EVENTS.START_SCENARIO, pendingScenarioRef.current)
        pendingScenarioRef.current = null
      }
    }
    bridge.on(PHASER_EVENTS.SCENE_READY, handler)
    return () => bridge.off(PHASER_EVENTS.SCENE_READY, handler)
  }, [])

  // Stage the current scenario
  useEffect(() => {
    if (!hasSession) return
    if (isSessionComplete) {
      onSessionEnd()
      return
    }
    if (!currentScenario) return

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return

      setInstruction(null)
      setOutcome(null)
      setPointsEarned(0)
      setPhase('loading')
      resetInputState()

      if (sceneReadyRef.current) {
        bridge.emit(REACT_EVENTS.START_SCENARIO, currentScenario)
      } else {
        pendingScenarioRef.current = currentScenario
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentScenario, hasSession, isSessionComplete, onSessionEnd])

  // Scenario staged → show the instruction ("get ready")
  useEffect(() => {
    const handler = (payload: unknown) => {
      const p = payload as { instruction: BilingualText; maneuver: Maneuver }
      setInstruction({ text: p.instruction, maneuver: p.maneuver })
      setPhase('ready')
    }
    bridge.on(PHASER_EVENTS.SCENARIO_READY, handler)
    return () => bridge.off(PHASER_EVENTS.SCENARIO_READY, handler)
  }, [])

  // Car started moving → enable controls
  useEffect(() => {
    const handler = () => setPhase('driving')
    bridge.on(PHASER_EVENTS.DRIVE_START, handler)
    return () => bridge.off(PHASER_EVENTS.DRIVE_START, handler)
  }, [])

  // Scenario resolved
  useEffect(() => {
    const handler = (payload: unknown) => {
      const result = payload as DrivingOutcome
      resetInputState()

      const store = useGameStore.getState()
      const s = store.session
      if (!s || !currentScenario) return

      const points = calcScore(result.isCorrect, s.streak, currentScenario.difficulty)
      setPointsEarned(points)
      setOutcome(result)

      store.recordAnswer({
        scenarioId: currentScenario.id,
        isCorrect: result.isCorrect,
        reason: result.reason,
        timeUsed: result.timeMs,
      })
      if (result.isCorrect) {
        store.addScore(points)
      }
      setPhase('feedback')
    }
    bridge.on(PHASER_EVENTS.OUTCOME, handler)
    return () => bridge.off(PHASER_EVENTS.OUTCOME, handler)
  }, [currentScenario])

  const handleNext = useCallback(() => {
    const store = useGameStore.getState()
    const s = store.session
    if (!s || !currentScenario) return
    resetInputState()
    bridge.emit(REACT_EVENTS.NEXT_SCENARIO)

    if (outcome && !outcome.isCorrect) {
      setInstruction(null)
      setOutcome(null)
      setPointsEarned(0)
      setPhase('loading')
      queueMicrotask(() => {
        bridge.emit(REACT_EVENTS.START_SCENARIO, currentScenario)
      })
      return
    }

    store.nextScenario()
    if (s.currentIndex + 1 >= s.scenarioIds.length) {
      onSessionEnd()
    }
  }, [currentScenario, onSessionEnd, outcome])

  const handleSkip = useCallback(() => {
    const store = useGameStore.getState()
    const s = store.session
    if (!s) return
    resetInputState()
    bridge.emit(REACT_EVENTS.NEXT_SCENARIO)
    store.nextScenario()
    if (s.currentIndex + 1 >= s.scenarioIds.length) {
      onSessionEnd()
    }
  }, [onSessionEnd])

  // Cancel any temporary glance pulse on unmount.
  useEffect(() => {
    return () => {
      if (glancePulseTimer.current !== null) clearTimeout(glancePulseTimer.current)
    }
  }, [])

  const handleStartDriving = useCallback(() => {
    resetInputState()
    bridge.emit(REACT_EVENTS.START_DRIVING)
  }, [])

  const pulseGlance = useCallback((side: 'glanceLeft' | 'glanceRight') => {
    inputState.glanceLeft = false
    inputState.glanceRight = false
    inputState[side] = true
    if (glancePulseTimer.current !== null) clearTimeout(glancePulseTimer.current)
    glancePulseTimer.current = setTimeout(() => {
      inputState[side] = false
      glancePulseTimer.current = null
    }, 650)
  }, [])

  const handlePlayAreaPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
  }, [])

  const handlePlayAreaPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || phase !== 'driving') return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const dt = Date.now() - start.t
    if (Math.abs(dx) < 54 || Math.abs(dx) < Math.abs(dy) * 1.4 || dt > 450) return
    pulseGlance(dx < 0 ? 'glanceLeft' : 'glanceRight')
  }, [phase, pulseGlance])

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a]">
      <HUD onBack={onBack} />

      <div
        className="flex-1 relative overflow-hidden"
        onPointerDown={handlePlayAreaPointerDown}
        onPointerUp={handlePlayAreaPointerUp}
      >
        <PhaserGame className="w-full h-full" />

        {/* Get-ready instruction overlay */}
        {phase === 'ready' && instruction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-5">
            <div className="w-full max-w-sm px-6 py-5 rounded-2xl bg-black/75 border border-[#FF6B35]/60 text-center">
              <div className="text-4xl mb-1">{MANEUVER_ICON[instruction.maneuver]}</div>
              <div className="text-white text-lg font-bold">{instruction.text[lang]}</div>
              <div className="text-[#FF6B35] text-xs mt-1">{t('drive.get_ready')}</div>
              <button
                onClick={handleStartDriving}
                className="mt-4 w-full py-3 rounded-2xl bg-[#FF6B35] text-white font-bold active:scale-[0.98]"
              >
                {t('drive.start')}
              </button>
            </div>
          </div>
        )}

        {/* Small persistent objective while driving */}
        {phase === 'driving' && instruction && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1">
              <span>{MANEUVER_ICON[instruction.maneuver]}</span>
              <span>{instruction.text[lang]}</span>
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a]/80">
            <div className="text-white text-lg animate-pulse">Loading…</div>
          </div>
        )}

      </div>

      {/* Controls (active only while actually driving) */}
      <DrivingControls disabled={phase !== 'driving'} />

      {phase === 'feedback' && outcome && currentScenario && (
        <FeedbackModal
          scenario={currentScenario}
          outcome={outcome}
          pointsEarned={pointsEarned}
          onNext={handleNext}
          onSkip={handleSkip}
          canSkip={currentFailures >= 3}
        />
      )}
    </div>
  )
}
