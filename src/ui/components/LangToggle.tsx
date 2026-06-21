import { useGameStore } from '../../store/gameStore'
import { useTranslation } from 'react-i18next'
import type { Lang } from '../../data/types'

export function LangToggle() {
  const { i18n } = useTranslation()
  const { lang, setLang } = useGameStore()

  const toggle = () => {
    const next: Lang = lang === 'zh-TW' ? 'ja' : 'zh-TW'
    setLang(next)
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className="px-3 py-1 rounded-full text-xs font-bold border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-colors"
    >
      {lang === 'zh-TW' ? '中→日' : '日→中'}
    </button>
  )
}
