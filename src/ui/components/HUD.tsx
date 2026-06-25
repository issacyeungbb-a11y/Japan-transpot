import { useGameStore } from '../../store/gameStore'
import { ALL_SCENARIOS } from '../../data/scenarios'
import { useTranslation } from 'react-i18next'

interface HUDProps {
  onBack?: () => void
}

export function HUD({ onBack }: HUDProps) {
  const { t } = useTranslation()
  const session = useGameStore((s) => s.session)
  if (!session) return null

  const total = session.scenarioIds.length
  const current = session.currentIndex + 1
  const lives = session.mode === 'study' ? null : session.lives
  const scenarioId = session.scenarioIds[session.currentIndex]
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId)
  const difficulty = scenario?.difficulty ?? 1

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-[#0d1b2a] border-b border-[#1A4E8C]/60 text-white select-none"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
    >
      {/* Back button — always first, never shrinks, clearly tappable */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1 px-3 rounded-lg text-sm font-bold text-white active:scale-95"
          style={{
            backgroundColor: '#1A4E8C',
            border: '1px solid #4A8AD8',
            height: '40px',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="返回目錄"
        >
          ← {t('hud.menu')}
        </button>
      )}

      {/* Everything else, right-aligned, allowed to shrink so it never overlaps the button */}
      <div className="flex-1 min-w-0 flex items-center justify-end gap-3 overflow-hidden">
        {lives !== null ? (
          <div className="flex gap-0.5 flex-shrink-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'text-red-400' : 'text-gray-600'}>
                ♥
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#FF6B35] text-sm flex-shrink-0">∞</span>
        )}

        <div className="text-[#FF6B35] font-bold text-sm sm:text-base whitespace-nowrap truncate">
          {t('hud.score')}: {session.score.toLocaleString()}
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          <div className="text-gray-300 text-xs whitespace-nowrap">
            {current}/{total}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={i < difficulty ? 'text-yellow-400' : 'text-gray-600'}
                style={{ fontSize: '10px' }}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
