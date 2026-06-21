import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { getScenarioById } from '../../data/scenarios'

interface Props {
  onRestart: () => void
  onMenu: () => void
}

export function ResultsScreen({ onRestart, onMenu }: Props) {
  const { t } = useTranslation()
  const { session, resetSession } = useGameStore()
  const lang = useGameStore((s) => s.lang)

  if (!session) return null

  const total = session.answers.length
  const correct = session.answers.filter((a) => a.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const maxStreak = session.streak

  const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1
  const starLabel = stars === 3 ? t('results.stars_3') : stars === 2 ? t('results.stars_2') : t('results.stars_1')

  const wrong = session.answers.filter((a) => !a.isCorrect)

  const handleMenu = () => {
    resetSession()
    onMenu()
  }

  const handleRestart = () => {
    onRestart()
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0d1b2a] text-white">
      {/* Header */}
      <div className="text-center py-8 px-6" style={{ background: 'linear-gradient(180deg, #1A4E8C22 0%, transparent 100%)' }}>
        <h1 className="text-3xl font-bold mb-2">{t('results.title')}</h1>
        <div className="text-4xl mb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ color: i < stars ? '#FFC107' : '#444', fontSize: 36 }}>★</span>
          ))}
        </div>
        <p className="text-[#FF6B35] font-bold text-lg">{starLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 mb-6">
        <StatCard label={t('results.score')} value={session.score.toLocaleString()} color="#FF6B35" />
        <StatCard label={t('results.accuracy')} value={`${accuracy}%`} color="#00C853" />
        <StatCard label={t('results.streak_best')} value={String(maxStreak)} color="#FFC107" />
      </div>

      {/* Wrong answers review */}
      {wrong.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {t('results.review')} ({wrong.length})
          </h2>
          <div className="space-y-2">
            {wrong.map((answer) => {
              const scenario = getScenarioById(answer.scenarioId)
              if (!scenario) return null
              return (
                <div
                  key={answer.scenarioId}
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: 'rgba(211,47,47,0.15)', border: '1px solid rgba(211,47,47,0.3)' }}
                >
                  <div className="font-medium text-red-300">{scenario.title[lang]}</div>
                  <div className="text-gray-400 text-xs mt-1">{scenario.feedback.lawArticle}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="px-6 pb-8 flex flex-col gap-3">
        <button
          onClick={handleRestart}
          className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #1A4E8C)' }}
        >
          {t('results.play_again')}
        </button>
        <button
          onClick={handleMenu}
          className="w-full py-3 rounded-2xl font-bold text-[#FF6B35] border border-[#FF6B35]/50 hover:bg-[#FF6B35]/10 transition-colors"
        >
          {t('results.back_menu')}
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center p-3 rounded-2xl"
      style={{ backgroundColor: `${color}11`, border: `1px solid ${color}33` }}
    >
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-400 text-center leading-tight mt-1">{label}</div>
    </div>
  )
}
