import { useState, useCallback, useEffect, useRef } from 'react'
import { PhaserGame } from '../../game/PhaserGame'
import { HUD } from '../components/HUD'
import { DecisionOverlay } from './DecisionOverlay'
import { FeedbackModal } from './FeedbackModal'
import { bridge, PHASER_EVENTS, REACT_EVENTS } from '../../game/EventBridge'
import { useGameStore } from '../../store/gameStore'
import { getScenarioById } from '../../data/scenarios'
import { calcScore } from '../../data/trafficRules'
import type { DecisionChoice, BilingualText, Scenario } from '../../data/types'

type GamePhase = 'loading' | 'playing' | 'decision' | 'feedback' | 'done'

interface DecisionState {
  prompt: BilingualText
  choices: DecisionChoice[]
  timerSeconds: number
}

interface Props {
  onSessionEnd: () => void
}

export function GameScreen({ onSessionEnd }: Props) {
  const { session, recordAnswer, addScore, loseLife, nextScenario } = useGameStore()
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [decision, setDecision] = useState<DecisionState | null>(null)
  const [lastChoice, setLastChoice] = useState<DecisionChoice | null>(null)
  const [lastPointsEarned, setLastPointsEarned] = useState(0)
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)

  // Track whether the Phaser ScenarioScene has registered its listeners yet.
  // START_SCENARIO must not be emitted before the scene's create() runs.
  const sceneReadyRef = useRef(false)
  const pendingScenarioRef = useRef<Scenario | null>(null)

  // Listen for the one-time SCENE_READY signal from Phaser's ScenarioScene.create()
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

  // Load and start the current scenario
  useEffect(() => {
    if (!session) return
    if (session.currentIndex >= session.scenarioIds.length) {
      onSessionEnd()
      return
    }
    const id = session.scenarioIds[session.currentIndex]
    const scenario = getScenarioById(id)
    if (!scenario) return
    setCurrentScenario(scenario)
    setPhase('playing')
    setDecision(null)
    setLastChoice(null)
    // Only emit once Phaser's listener is registered; otherwise queue it
    if (sceneReadyRef.current) {
      bridge.emit(REACT_EVENTS.START_SCENARIO, scenario)
    } else {
      pendingScenarioRef.current = scenario
    }
  }, [session?.currentIndex])

  // Listen for Phaser show-decision event
  useEffect(() => {
    const handler = (payload: unknown) => {
      const p = payload as { promptText: BilingualText; choices: DecisionChoice[]; timerSeconds: number }
      setDecision({
        prompt: p.promptText,
        choices: p.choices,
        timerSeconds: p.timerSeconds,
      })
      setTimerSeconds(session?.mode === 'study' ? null : p.timerSeconds)
      setPhase('decision')
    }
    bridge.on(PHASER_EVENTS.SHOW_DECISION, handler)
    return () => bridge.off(PHASER_EVENTS.SHOW_DECISION, handler)
  }, [session?.mode])

  // After consequence animation, show feedback
  useEffect(() => {
    const handler = (payload: unknown) => {
      const { choice } = payload as { choice: DecisionChoice }
      setLastChoice(choice)
      setPhase('feedback')
    }
    bridge.on(PHASER_EVENTS.PLAY_CONSEQUENCE, handler)
    return () => bridge.off(PHASER_EVENTS.PLAY_CONSEQUENCE, handler)
  }, [])

  const handleChoice = useCallback(
    (choice: DecisionChoice, timeUsed: number) => {
      if (!session || !currentScenario) return

      const timerTotal = (decision?.timerSeconds ?? 10) * 1000
      const points = session.mode !== 'study'
        ? calcScore(choice.isCorrect, timeUsed, timerTotal, session.streak, currentScenario.difficulty)
        : 0

      setLastPointsEarned(points)
      recordAnswer({ scenarioId: currentScenario.id, choiceId: choice.id, isCorrect: choice.isCorrect, timeUsed })
      if (choice.isCorrect) {
        addScore(points)
      } else if (session.mode !== 'study') {
        loseLife()
      }

      bridge.emit(REACT_EVENTS.PLAYER_CHOICE, { choice })
    },
    [session, currentScenario, decision, recordAnswer, addScore, loseLife]
  )

  const handleNext = useCallback(() => {
    if (!session) return
    bridge.emit(REACT_EVENTS.NEXT_SCENARIO)
    nextScenario()
    if (session.currentIndex + 1 >= session.scenarioIds.length) {
      onSessionEnd()
    }
  }, [session, nextScenario, onSessionEnd])

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a]">
      {/* HUD */}
      <HUD timerSeconds={timerSeconds} timerMax={decision?.timerSeconds ?? 10} />

      {/* Phaser canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <PhaserGame className="w-full h-full" />

        {/* Loading overlay */}
        {phase === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a]/80">
            <div className="text-white text-lg animate-pulse">Loading...</div>
          </div>
        )}
      </div>

      {/* Decision overlay */}
      {phase === 'decision' && decision && (
        <DecisionOverlay
          prompt={decision.prompt}
          choices={decision.choices}
          timerSeconds={decision.timerSeconds}
          onChoice={handleChoice}
        />
      )}

      {/* Feedback modal */}
      {phase === 'feedback' && lastChoice && currentScenario && (
        <FeedbackModal
          scenario={currentScenario}
          choice={lastChoice}
          pointsEarned={lastPointsEarned}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
