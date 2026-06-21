import { useState } from 'react'
import { MainMenuScreen } from './ui/screens/MainMenuScreen'
import { GameScreen } from './ui/screens/GameScreen'
import { ResultsScreen } from './ui/screens/ResultsScreen'
import { useGameStore } from './store/gameStore'

type AppScreen = 'menu' | 'game' | 'results'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const { startSession } = useGameStore()
  const session = useGameStore((s) => s.session)

  const handleStartGame = () => {
    setScreen('game')
  }

  const handleSessionEnd = () => {
    setScreen('results')
  }

  const handleRestart = () => {
    if (!session) {
      setScreen('menu')
      return
    }
    const { mode, scenarioIds } = session
    startSession(mode, [...scenarioIds].sort(() => Math.random() - 0.5))
    setScreen('game')
  }

  const handleMenu = () => {
    setScreen('menu')
  }

  return (
    <div className="w-full h-full">
      {screen === 'menu' && <MainMenuScreen onStart={handleStartGame} />}
      {screen === 'game' && <GameScreen onSessionEnd={handleSessionEnd} />}
      {screen === 'results' && (
        <ResultsScreen onRestart={handleRestart} onMenu={handleMenu} />
      )}
    </div>
  )
}
