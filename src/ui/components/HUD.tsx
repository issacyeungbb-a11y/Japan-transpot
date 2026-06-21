import { useGameStore } from '../../store/gameStore'
import { ALL_SCENARIOS } from '../../data/scenarios'
import { useTranslation } from 'react-i18next'

interface Props {
  timerSeconds: number | null
  timerMax: number
}

export function HUD({ timerSeconds, timerMax }: Props) {
  const { t } = useTranslation()
  const session = useGameStore((s) => s.session)
  if (!session) return null

  const total = session.scenarioIds.length
  const current = session.currentIndex + 1
  const lives = session.mode === 'study' ? null : session.lives
  const scenarioId = session.scenarioIds[session.currentIndex]
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId)
  const difficulty = scenario?.difficulty ?? 1

  const timerFraction = timerSeconds !== null ? timerSeconds / timerMax : 1
  const timerColor =
    timerFraction > 0.5 ? '#00C853' : timerFraction > 0.25 ? '#FFC107' : '#D32F2F'

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0d1b2a]/90 border-b border-[#1A4E8C]/60 text-white text-sm font-medium select-none">
      {/* Left: Lives */}
      <div className="flex items-center gap-2 min-w-[80px]">
        {lives !== null ? (
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'text-red-400' : 'text-gray-600'}>
                ♥
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#FF6B35] text-xs">∞</span>
        )}
      </div>

      {/* Center: Score + Timer */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-[#FF6B35] font-bold text-base">
          {t('hud.score')}: {session.score.toLocaleString()}
        </div>
        {timerSeconds !== null && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${timerFraction * 100}%`, backgroundColor: timerColor }}
              />
            </div>
            <span style={{ color: timerColor }} className="text-xs w-6 text-right">
              {timerSeconds}
            </span>
          </div>
        )}
      </div>

      {/* Right: Progress + Difficulty */}
      <div className="flex flex-col items-end min-w-[80px]">
        <div className="text-gray-300 text-xs">
          {t('hud.scenario')} {current}/{total}
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < difficulty ? 'text-yellow-400' : 'text-gray-600'} style={{ fontSize: '10px' }}>
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
