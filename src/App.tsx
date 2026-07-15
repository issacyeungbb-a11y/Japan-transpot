import { useState, useCallback } from 'react'
import { MainMenuScreen } from './ui/screens/MainMenuScreen'
import { CourseScreen } from './ui/screens/CourseScreen'
import { ReportScreen } from './ui/screens/ReportScreen'
import { useGameStore } from './store/gameStore'

type AppScreen = 'menu' | 'drive' | 'report'

export function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  // Remounting CourseScreen (fresh engine + world) needs a new key per run.
  const [runId, setRunId] = useState(0)
  const startCourse = useGameStore((s) => s.startCourse)

  const handleStart = useCallback(() => {
    startCourse()
    setRunId((n) => n + 1)
    setScreen('drive')
  }, [startCourse])

  const handleFinish = useCallback(() => setScreen('report'), [])
  const handleMenu = useCallback(() => setScreen('menu'), [])

  return (
    <div className="w-full h-full">
      {screen === 'menu' && <MainMenuScreen onStart={handleStart} />}
      {screen === 'drive' && (
        <CourseScreen key={runId} onFinish={handleFinish} onQuit={handleMenu} />
      )}
      {screen === 'report' && (
        <ReportScreen onRetry={handleStart} onMenu={handleMenu} />
      )}
    </div>
  )
}
