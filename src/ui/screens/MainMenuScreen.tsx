import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { ALL_SCENARIOS } from '../../data/scenarios'
import { LangToggle } from '../components/LangToggle'

interface Props {
  onStart: () => void
}

export function MainMenuScreen({ onStart }: Props) {
  const { t } = useTranslation()
  const [showHowTo, setShowHowTo] = useState(false)
  const lang = useGameStore((s) => s.lang)

  const total = ALL_SCENARIOS.length

  const title = lang === 'zh-TW' ? '沖繩交通挑戰' : '沖縄交通チャレンジ'
  const subtitle = lang === 'zh-TW' ? '日本道路規則模擬遊戲' : '日本の道路ルールシミュレーション'

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-[#0d1b2a] overflow-hidden">
      {/* Road centreline background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 bg-black/10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-full opacity-15">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-full h-14 bg-white mb-8" />
          ))}
        </div>
      </div>

      {/* Lang toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LangToggle />
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-10">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 2px 16px #1A4E8C' }}>
          {title}
        </h1>
        <p className="text-[#FF6B35] text-lg">{subtitle}</p>
        <p className="text-gray-400 text-sm mt-2">
          {lang === 'zh-TW' ? '⚠️ 日本靠左行駛！Left-hand traffic' : '⚠️ 日本は左側通行！Left-hand traffic'}
        </p>
      </div>

      {/* Single start button */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs px-6">
        <button
          onClick={onStart}
          className="flex items-center gap-4 w-full px-5 py-5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: '#FF6B3522', border: '1px solid #FF6B3588' }}
        >
          <span className="text-3xl">🚦</span>
          <div className="flex-1">
            <div className="font-bold text-white text-lg">{t('menu.start')}</div>
            <div className="text-xs text-gray-400">{t('menu.start_desc')}</div>
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#FF6B3533', color: '#FF6B35' }}
          >
            {t('list.count', { n: total })}
          </span>
        </button>

        <button
          onClick={() => setShowHowTo(true)}
          className="mt-2 text-gray-400 text-sm underline hover:text-white transition-colors"
        >
          {t('menu.how_to_play')}
        </button>
      </div>

      {/* How to play modal */}
      {showHowTo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-[#0d1b2a] border border-[#1A4E8C] rounded-2xl p-6 max-w-sm w-full text-white">
            <h2 className="text-xl font-bold mb-4 text-[#FF6B35]">{t('howto.title')}</h2>
            <ul className="space-y-3 text-sm text-gray-200">
              <li>🗺️ {t('howto.line1')}</li>
              <li>🚦 {t('howto.line2')}</li>
              <li>📋 {t('howto.line3')}</li>
              <li className="text-[#FF6B35] font-bold">⬅️ {t('howto.line4')}</li>
            </ul>
            <button
              onClick={() => setShowHowTo(false)}
              className="mt-6 w-full py-2 bg-[#FF6B35] rounded-xl font-bold text-white hover:bg-[#FF6B35]/80 transition-colors"
            >
              {t('howto.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
