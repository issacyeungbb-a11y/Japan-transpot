import { useState, useCallback } from 'react'
import { MainMenuScreen } from './ui/screens/MainMenuScreen'
import { ScenarioListScreen } from './ui/screens/ScenarioListScreen'
import { GameScreen } from './ui/screens/GameScreen'
import { ResultsScreen } from './ui/screens/ResultsScreen'
import { useGameStore } from './store/gameStore'
import { allScenarios } from './data/allScenarios'

type AppScreen = 'menu' | 'scenario-list' | 'game' | 'results'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const startSession = useGameStore((s) => s.startSession)

  const handleStart = useCallback(() => {
    setScreen('scenario-list')
  }, [])

  const handleScenarioSelect = useCallback((startIndex: number) => {
    startSession(allScenarios().map((s) => s.id), startIndex)
    setScreen('game')
  }, [startSession])

  // Stable references — GameScreen's effects depend on these, so recreating
  // them on every App render (e.g. when the score updates) would spuriously
  // restart the current scenario.
  const handleSessionEnd = useCallback(() => {
    setScreen('results')
  }, [])

  const handleBackToList = useCallback(() => {
    setScreen('scenario-list')
  }, [])

  const handleRestart = useCallback(() => {
    startSession(allScenarios().map((s) => s.id))
    setScreen('game')
  }, [startSession])

  const handleMenu = useCallback(() => {
    setScreen('menu')
  }, [])

  return (
    <div className="w-full h-full">
      {screen === 'menu' && (
        <MainMenuScreen onStart={handleStart} />
      )}
      {screen === 'scenario-list' && (
        <ScenarioListScreen
          onSelect={handleScenarioSelect}
          onBack={handleMenu}
        />
      )}
      {screen === 'game' && <GameScreen onSessionEnd={handleSessionEnd} onBack={handleBackToList} />}
      {screen === 'results' && (
        <ResultsScreen onRestart={handleRestart} onMenu={handleMenu} />
      )}
    </div>
  )
}
