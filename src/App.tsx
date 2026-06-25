import { useState, useCallback } from 'react'
import { MainMenuScreen } from './ui/screens/MainMenuScreen'
import { ScenarioListScreen } from './ui/screens/ScenarioListScreen'
import { GameScreen } from './ui/screens/GameScreen'
import { ResultsScreen } from './ui/screens/ResultsScreen'
import { useGameStore } from './store/gameStore'
import { scenariosForMode } from './data/scenariosForMode'
import type { GameMode } from './data/types'

type AppScreen = 'menu' | 'scenario-list' | 'game' | 'results'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [selectedMode, setSelectedMode] = useState<GameMode>('study')
  const startSession = useGameStore((s) => s.startSession)

  const handleModeSelect = useCallback((mode: GameMode) => {
    setSelectedMode(mode)
    setScreen('scenario-list')
  }, [])

  const handleScenarioSelect = useCallback((startIndex: number) => {
    const scenarios = scenariosForMode(selectedMode)
    startSession(selectedMode, scenarios.map((s) => s.id), startIndex)
    setScreen('game')
  }, [selectedMode, startSession])

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
    const s = useGameStore.getState().session
    if (!s) { setScreen('menu'); return }
    const scenarios = scenariosForMode(s.mode)
    startSession(s.mode, scenarios.map((sc) => sc.id))
    setScreen('game')
  }, [startSession])

  const handleMenu = useCallback(() => {
    setScreen('menu')
  }, [])

  return (
    <div className="w-full h-full">
      {screen === 'menu' && (
        <MainMenuScreen onModeSelect={handleModeSelect} />
      )}
      {screen === 'scenario-list' && (
        <ScenarioListScreen
          mode={selectedMode}
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
