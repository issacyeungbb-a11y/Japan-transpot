import { useState } from 'react'
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
  const { startSession } = useGameStore()
  const session = useGameStore((s) => s.session)

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
    setScreen('scenario-list')
  }

  const handleScenarioSelect = (startIndex: number) => {
    const scenarios = scenariosForMode(selectedMode)
    startSession(selectedMode, scenarios.map((s) => s.id), startIndex)
    setScreen('game')
  }

  const handleSessionEnd = () => {
    setScreen('results')
  }

  const handleRestart = () => {
    if (!session) { setScreen('menu'); return }
    const scenarios = scenariosForMode(session.mode)
    startSession(session.mode, scenarios.map((s) => s.id))
    setScreen('game')
  }

  const handleMenu = () => {
    setScreen('menu')
  }

  const handleBackToList = () => {
    setScreen('scenario-list')
  }

  return (
    <div className="w-full h-full">
      {screen === 'menu' && (
        <MainMenuScreen onModeSelect={handleModeSelect} />
      )}
      {screen === 'scenario-list' && (
        <ScenarioListScreen
          mode={selectedMode}
          onSelect={handleScenarioSelect}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'game' && <GameScreen onSessionEnd={handleSessionEnd} onBack={handleBackToList} />}
      {screen === 'results' && (
        <ResultsScreen onRestart={handleRestart} onMenu={handleMenu} />
      )}
    </div>
  )
}
