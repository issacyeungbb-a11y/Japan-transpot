import { useGameStore, pointsOf } from '../../store/gameStore'
import { COURSE } from '../../course/route'
import {
  PASS_MARK, START_POINTS, VIOLATION_NAMES, ZONE_NAMES,
  type ViolationRecord,
} from '../../course/types'

interface Props {
  onRetry: () => void
  onMenu: () => void
}

function fmtTime(ms: number, lang: string): string {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  return lang === 'zh-TW' ? `${m}分${s % 60}秒` : `${m}分${s % 60}秒`
}

export function ReportScreen({ onRetry, onMenu }: Props) {
  const lang = useGameStore((s) => s.lang)
  const violations = useGameStore((s) => s.violations)
  const timeMs = useGameStore((s) => s.finishedTimeMs)

  const points = pointsOf(violations)
  const passed = points >= PASS_MARK

  // Group violations by leg, in course order.
  const byLeg = new Map<number, ViolationRecord[]>()
  violations.forEach((v) => {
    const list = byLeg.get(v.legIndex) ?? []
    list.push(v)
    byLeg.set(v.legIndex, list)
  })
  const legIndices = [...byLeg.keys()].sort((a, b) => a - b)

  // Per-zone tallies for the summary strip.
  const zoneDeductions = new Map<string, number>()
  violations.forEach((v) => {
    const zone = COURSE[v.legIndex]?.event.zone ?? 'naha'
    zoneDeductions.set(zone, (zoneDeductions.get(zone) ?? 0) + v.deduction)
  })

  return (
    <div className="flex flex-col h-full bg-[#0d1b2a] text-white overflow-hidden">
      {/* Verdict header */}
      <div
        className="px-5 pt-6 pb-5 text-center flex-shrink-0"
        style={{
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          background: passed
            ? 'linear-gradient(135deg,#003a1a,#00582a)'
            : 'linear-gradient(135deg,#3a0808,#5c1414)',
          borderBottom: `2px solid ${passed ? '#00C853' : '#ff5252'}`,
        }}
      >
        <div className="text-[11px] tracking-widest text-gray-300 mb-1">
          沖縄路上試験成績表 — OKINAWA DRIVING TEST
        </div>
        <div className="text-4xl font-black mb-1" style={{ color: passed ? '#00E676' : '#ff6b6b' }}>
          {passed ? (lang === 'zh-TW' ? '合格 ✓' : '合格 ✓') : (lang === 'zh-TW' ? '不合格 ✗' : '不合格 ✗')}
        </div>
        <div className="text-lg">
          <span className="font-black text-3xl tabular-nums">{points}</span>
          <span className="text-gray-300 text-sm"> / {START_POINTS}</span>
          <span className="text-gray-400 text-xs ml-2">({lang === 'zh-TW' ? `${PASS_MARK}分合格` : `${PASS_MARK}点で合格`})</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {timeMs !== null && (lang === 'zh-TW' ? `路試時間：${fmtTime(timeMs, lang)}` : `所要時間：${fmtTime(timeMs, lang)}`)}
          {'　'}
          {lang === 'zh-TW' ? `違規 ${violations.length} 項` : `違反 ${violations.length} 件`}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Zone summary */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ZONE_NAMES) as (keyof typeof ZONE_NAMES)[]).map((z) => {
            const lost = zoneDeductions.get(z) ?? 0
            return (
              <div
                key={z}
                className="rounded-xl px-2 py-2 text-center"
                style={{
                  background: lost === 0 ? '#0e2b1a' : '#2b1414',
                  border: `1px solid ${lost === 0 ? '#1b5e2044' : '#c6282844'}`,
                }}
              >
                <div className="text-[10px] text-gray-400 leading-tight">{ZONE_NAMES[z][lang]}</div>
                <div className={`font-bold text-sm ${lost === 0 ? 'text-[#00C853]' : 'text-[#ff6b6b]'}`}>
                  {lost === 0 ? (lang === 'zh-TW' ? '完美' : '完璧') : `−${lost}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Violation detail */}
        {violations.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#0e2b1a', border: '1px solid #1b5e20' }}
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-bold text-[#00E676]">
              {lang === 'zh-TW' ? '零違規完美駕駛！' : '違反ゼロの完璧な運転！'}
            </div>
            <div className="text-gray-300 text-sm mt-1">
              {lang === 'zh-TW'
                ? '你已經掌握晒沖繩道路嘅規則，可以放心自駕遊喇。'
                : '沖縄の交通ルールを完全にマスターしています。安心してドライブへ！'}
            </div>
          </div>
        ) : (
          legIndices.map((legIdx) => {
            const leg = COURSE[legIdx]
            const list = byLeg.get(legIdx)!
            return (
              <div
                key={legIdx}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#13273a', border: '1px solid #1A4E8C66' }}
              >
                <div className="px-4 py-2 flex items-center gap-2" style={{ background: '#1A4E8C33' }}>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FF6B35] text-white">
                    {legIdx + 1}
                  </span>
                  <span className="font-bold text-sm flex-1">{leg.event.title[lang]}</span>
                  <span className="text-[10px] text-gray-400">{ZONE_NAMES[leg.event.zone][lang]}</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {list.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[#ff6b6b] font-bold">−{v.deduction}</span>
                      <span className="flex-1">{VIOLATION_NAMES[v.code][lang]}</span>
                      {v.kmh !== undefined && v.kmh > 0 && (
                        <span className="text-gray-500 text-xs tabular-nums">{v.kmh} km/h</span>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-gray-300 leading-relaxed pt-1 border-t border-white/10">
                    💡 {leg.event.lesson[lang]}
                  </div>
                  <div className="text-[10px] text-[#64b5f6]">⚖️ {leg.event.law}</div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Actions */}
      <div
        className="flex gap-3 p-4 flex-shrink-0 border-t border-white/10"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={onMenu}
          className="flex-1 py-3 rounded-xl font-bold text-white active:scale-95"
          style={{ background: '#1A4E8C44', border: '1px solid #1A4E8C' }}
        >
          {lang === 'zh-TW' ? '返回主頁' : 'メニューへ'}
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl font-bold text-white active:scale-95"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#ff8a5c)' }}
        >
          {lang === 'zh-TW' ? '再考一次' : 'もう一度受験'}
        </button>
      </div>
    </div>
  )
}
