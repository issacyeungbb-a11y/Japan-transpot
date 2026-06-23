import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { getScenarioById } from '../../data/scenarios'
import type { Lang, OutcomeReason } from '../../data/types'

interface Props {
  onRestart: () => void
  onMenu: () => void
}

// Targeted, plain-language coaching for each kind of mistake — the point of the
// game is to turn a failed run into a concrete thing to practise next time.
const REASON_ADVICE: Record<OutcomeReason, Record<Lang, string>> = {
  success:     { 'zh-TW': '', ja: '' },
  ran_red:     { 'zh-TW': '紅燈／黃燈未過線就要停，箭頭只准箭頭方向，唔好搶燈。', ja: '赤・黄は停止線手前で停止。矢印は矢印方向のみ。' },
  no_full_stop:{ 'zh-TW': '「止まれ」同紅閃要完全停定，輪胎靜止先合法，慢碌唔算。', ja: '「止まれ」「赤点滅」は完全停止。徐行は不可。' },
  collision:   { 'zh-TW': '保持安全距離，右轉讓晒對向車，過ETC閘要減到20以下。', ja: '車間距離を保ち、右折は対向車を優先、ETCは20km/h以下で。' },
  wrong_way:   { 'zh-TW': '睇清楚一方通行同箭頭方向，只可以行合法方向。', ja: '一方通行・矢印の方向を確認し、合法な方向のみ進む。' },
  off_road:    { 'zh-TW': '保持車道，落雨／窄路尤其唔好扭軚過大衝出路面。', ja: '車線を維持。雨天や狭い道で切りすぎない。' },
  speeding:    { 'zh-TW': '睇住速度錶守限速，市區40–50、學校區30、自動車道80。', ja: '速度計を見て制限速度を守る（市街40–50・通学路30・自動車道80）。' },
  bus_lane:    { 'zh-TW': '繁忙時段唔好駛入藍色「バス専用」線，靠右行。', ja: '時間帯内は青い「バス専用」レーンに入らず右側を走行。' },
  timeout:     { 'zh-TW': '安全前提下要果斷完成動作，唔好停喺路中間。', ja: '安全を確認したら迷わず操作を完了する。' },
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

  // Tally mistakes by reason → the player's weakest areas, most-frequent first.
  const reasonCounts = wrong.reduce<Partial<Record<OutcomeReason, number>>>((acc, a) => {
    acc[a.reason] = (acc[a.reason] ?? 0) + 1
    return acc
  }, {})
  const weakAreas = (Object.entries(reasonCounts) as [OutcomeReason, number][])
    .sort((a, b) => b[1] - a[1])

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

      {/* Weak-area analysis — what to practise next */}
      {weakAreas.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {t('results.weak_areas')}
          </h2>
          <div className="space-y-2">
            {weakAreas.map(([reason, count]) => (
              <div
                key={reason}
                className="px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.30)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#FF6B35] text-sm">{t(`reason.${reason}`)}</span>
                  <span className="text-xs text-gray-400 tabular-nums">×{count}</span>
                </div>
                {REASON_ADVICE[reason]?.[lang] && (
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{REASON_ADVICE[reason][lang]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
