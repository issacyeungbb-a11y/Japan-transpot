import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import type { Scenario, DecisionChoice } from '../../data/types'
import { TrafficLightSVG } from '../components/TrafficLightSVG'

interface Props {
  scenario: Scenario
  choice: DecisionChoice
  pointsEarned: number
  onNext: () => void
}

export function FeedbackModal({ scenario, choice, pointsEarned, onNext }: Props) {
  const { t } = useTranslation()
  const lang = useGameStore((s) => s.lang)
  const isCorrect = choice.isCorrect
  const mainLight = scenario.lights[0]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
      <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto rounded-t-3xl shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #0f2744 0%, #0d1b2a 100%)', border: '1px solid rgba(26,78,140,0.5)' }}>

        {/* Result banner */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-3xl"
          style={{ backgroundColor: isCorrect ? '#00C85322' : '#D32F2F22' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{isCorrect ? '✓' : '✗'}</span>
            <div>
              <div className="text-xl font-bold" style={{ color: isCorrect ? '#00C853' : '#D32F2F' }}>
                {isCorrect ? t('feedback.correct') : t('feedback.incorrect')}
              </div>
              {isCorrect && pointsEarned > 0 && (
                <div className="text-[#FF6B35] text-sm font-bold">+{pointsEarned} {t('hud.score')}</div>
              )}
            </div>
          </div>
          {mainLight && (
            <TrafficLightSVG state={mainLight.state} size={48} />
          )}
        </div>

        {/* Choice feedback */}
        <div className="px-6 py-3 border-b border-[#1A4E8C]/30">
          <p className="text-sm text-gray-300 italic">{choice.feedbackText[lang]}</p>
        </div>

        {/* Main explanation */}
        <div className="px-6 py-4 border-b border-[#1A4E8C]/30">
          <div className="text-xs text-[#FF6B35] font-bold mb-2 uppercase tracking-wider">
            {t('feedback.explanation')}
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">
            {scenario.feedback.explanation[lang]}
          </p>
        </div>

        {/* Law citation */}
        <div className="px-6 py-3 border-b border-[#1A4E8C]/30 flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <div>
            <div className="text-xs text-gray-400">{t('feedback.law')}</div>
            <div className="text-sm text-[#1A9BF5] font-medium">{scenario.feedback.lawArticle}</div>
          </div>
        </div>

        {/* Common mistake */}
        {scenario.feedback.commonMistake && (
          <div className="px-6 py-3 border-b border-[#1A4E8C]/30">
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <div className="text-xs text-yellow-400 font-bold mb-1">{t('feedback.common_mistake')}</div>
                <p className="text-sm text-gray-300">{scenario.feedback.commonMistake[lang]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next button */}
        <div className="px-6 py-4">
          <button
            onClick={onNext}
            className="w-full py-3 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #1A4E8C)' }}
          >
            {t('feedback.next')} →
          </button>
        </div>
      </div>
    </div>
  )
}
