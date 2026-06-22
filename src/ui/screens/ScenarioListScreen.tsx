import { useGameStore } from '../../store/gameStore'
import { ALL_SCENARIOS } from '../../data/scenarios'
import type { GameMode, Scenario } from '../../data/types'

const CATEGORY_ICON: Record<Scenario['category'], string> = {
  standard:   '🚦',
  flashing:   '⚠️',
  arrow:      '↪️',
  pedestrian: '🚶',
  priority:   '🛣️',
  oneway:     '↕️',
}

const MODE_META: Record<GameMode, { icon: string; label: Record<string, string>; color: string }> = {
  study:     { icon: '📖', label: { 'zh-TW': '學習模式', ja: '学習モード' },     color: '#1A4E8C' },
  normal:    { icon: '🚦', label: { 'zh-TW': '一般模式', ja: 'ノーマルモード' }, color: '#FF6B35' },
  challenge: { icon: '🏆', label: { 'zh-TW': '挑戰模式', ja: 'チャレンジモード' }, color: '#9C27B0' },
}

const ROAD_LABEL: Record<string, Record<string, string>> = {
  cross:       { 'zh-TW': '十字路口', ja: '十字路' },
  't-junction':{ 'zh-TW': 'T形路口', ja: 'T字路' },
  straight:    { 'zh-TW': '直路',     ja: '直線路' },
  highway:     { 'zh-TW': '高速公路', ja: '高速道路' },
}

export function scenariosForMode(mode: GameMode): Scenario[] {
  return ALL_SCENARIOS
    .filter((s) => !s.modes || s.modes.includes(mode))
    .sort((a, b) => a.difficulty - b.difficulty)
}

interface Props {
  mode: GameMode
  onSelect: (startIndex: number) => void
  onBack: () => void
}

export function ScenarioListScreen({ mode, onSelect, onBack }: Props) {
  const lang = useGameStore((s) => s.lang)
  const meta = MODE_META[mode]
  const scenarios = scenariosForMode(mode)
  const color = meta.color

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
        <span className="text-xl">{meta.icon}</span>
        <h2 className="font-bold text-base flex-1">
          {lang === 'zh-TW' ? meta.label['zh-TW'] : meta.label['ja']}
        </h2>
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
