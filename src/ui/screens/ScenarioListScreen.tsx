import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { allScenarios } from '../../data/allScenarios'
import type { Scenario } from '../../data/types'

const CATEGORY_ICON: Record<Scenario['category'], string> = {
  standard:   '🚦',
  flashing:   '⚠️',
  arrow:      '↪️',
  pedestrian: '🚶',
  priority:   '🛣️',
  oneway:     '↕️',
  speed:      '🚸',
}

const ROAD_LABEL: Record<string, Record<string, string>> = {
  cross:       { 'zh-TW': '十字路口', ja: '十字路' },
  't-junction':{ 'zh-TW': 'T形路口', ja: 'T字路' },
  straight:    { 'zh-TW': '直路',     ja: '直線路' },
  highway:     { 'zh-TW': '高速公路', ja: '高速道路' },
  roundabout:  { 'zh-TW': '環狀交差點', ja: '環状交差点' },
  multilane:   { 'zh-TW': '多線道', ja: '複数車線' },
  merge:       { 'zh-TW': '合流/分流', ja: '合流/分流' },
  skewed:      { 'zh-TW': '斜交路口', ja: '斜め交差点' },
  uncontrolled:{ 'zh-TW': '無號誌路口', ja: '無信号交差点' },
  tunnel:      { 'zh-TW': '隧道', ja: 'トンネル' },
}

type TrafficDensity = 'light' | 'normal' | 'busy'

const TRAFFIC_LABEL: Record<TrafficDensity, Record<string, string>> = {
  light:  { 'zh-TW': '車少', ja: '少なめ' },
  normal: { 'zh-TW': '車流中等', ja: '普通' },
  busy:   { 'zh-TW': '車多', ja: '多め' },
}

interface Props {
  onSelect: (startIndex: number) => void
  onBack: () => void
}

const ACCENT = '#FF6B35'

export function ScenarioListScreen({ onSelect, onBack }: Props) {
  const { t } = useTranslation()
  const lang = useGameStore((s) => s.lang)
  const scenarios = allScenarios()
  const color = ACCENT

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a] text-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-white/10"
        style={{ background: `${color}22` }}
      >
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors text-2xl leading-none px-1"
          aria-label="返回"
        >
          ←
        </button>
        <span className="text-xl">🚦</span>
        <h2 className="font-bold text-base flex-1">{t('list.all')}</h2>
        <span className="text-gray-400 text-sm">{scenarios.length}關</span>
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] hover:brightness-125"
            style={{ background: `${color}1a`, border: `1px solid ${color}55` }}
          >
            {/* Index */}
            <span
              className="text-sm font-bold w-6 text-center flex-shrink-0 tabular-nums"
              style={{ color }}
            >
              {i + 1}
            </span>

            {/* Category icon */}
            <span className="text-xl flex-shrink-0">{CATEGORY_ICON[s.category]}</span>

            {/* Title + road type */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm leading-snug">
                {lang === 'zh-TW' ? s.title['zh-TW'] : s.title['ja']}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {ROAD_LABEL[s.roadType ?? 'cross']?.[lang] ?? ''}
                {' · '}
                {Math.round((s.timeLimitMs ?? 42000) / 1000)}
                {lang === 'zh-TW' ? '秒' : '秒'}
                {' · '}
                {TRAFFIC_LABEL[s.trafficDensity ?? 'light']?.[lang]}
              </div>
            </div>

            {/* Difficulty stars */}
            <div className="flex-shrink-0 text-xs" style={{ color }}>
              {'★'.repeat(s.difficulty)}
              <span className="text-gray-600">{'★'.repeat(3 - s.difficulty)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
