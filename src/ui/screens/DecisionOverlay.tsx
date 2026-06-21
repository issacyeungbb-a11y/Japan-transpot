import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import type { DecisionChoice, BilingualText } from '../../data/types'

interface Props {
  prompt: BilingualText
  choices: DecisionChoice[]
  timerSeconds: number
  onChoice: (choice: DecisionChoice, timeUsed: number) => void
}

export function DecisionOverlay({ prompt, choices, timerSeconds, onChoice }: Props) {
  const { t } = useTranslation()
  const lang = useGameStore((s) => s.lang)
  const session = useGameStore((s) => s.session)
  const [remaining, setRemaining] = useState(timerSeconds)
  const [startTime] = useState(Date.now())
  const [answered, setAnswered] = useState(false)

  const isStudyMode = session?.mode === 'study'
  const showTimer = !isStudyMode && timerSeconds > 0

  useEffect(() => {
    if (isStudyMode || timerSeconds <= 0) return
    if (answered) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Auto-select wrong answer on timeout
          if (!answered) {
            setAnswered(true)
            const wrong = choices.find((c) => !c.isCorrect) ?? choices[0]
            onChoice(wrong, timerSeconds * 1000)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isStudyMode, timerSeconds, choices, onChoice, answered])

  const handleChoice = (choice: DecisionChoice) => {
    if (answered) return
    setAnswered(true)
    const timeUsed = Date.now() - startTime
    onChoice(choice, timeUsed)
  }

  const labels = ['A', 'B', 'C', 'D']

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#0d1b2a]/95 border-t border-[#1A4E8C]/40">
      {/* Timer bar */}
      {showTimer && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all duration-1000 linear"
            style={{ width: `${(remaining / timerSeconds) * 100}%` }}
          />
        </div>
      )}

      {/* Prompt */}
      <p className="text-white text-sm font-medium text-center leading-relaxed">
        {prompt[lang]}
        {showTimer && (
          <span className={`ml-2 font-bold ${remaining <= 3 ? 'text-red-400' : 'text-[#FF6B35]'}`}>
            ({remaining}{t('hud.timer')})
          </span>
        )}
      </p>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2">
        {choices.map((choice, i) => (
          <button
            key={choice.id}
            disabled={answered}
            onClick={() => handleChoice(choice)}
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(26,78,140,0.3)',
              border: '1px solid rgba(26,78,140,0.6)',
            }}
          >
            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-[#FF6B35] text-white text-xs font-bold flex items-center justify-center">
              {labels[i]}
            </span>
            <span className="text-gray-200 leading-snug">{choice.text[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
