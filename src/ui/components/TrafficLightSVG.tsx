import type { TrafficLightState } from '../../data/types'

interface Props {
  state: TrafficLightState
  size?: number
}

export function TrafficLightSVG({ state, size = 80 }: Props) {
  return (
    <svg width={size} height={size * 2.5} viewBox="0 0 40 100" xmlns="http://www.w3.org/2000/svg">
      {renderLight(state)}
    </svg>
  )
}

function renderLight(state: TrafficLightState) {
  switch (state.type) {
    case 'standard':
      return (
        <>
          <rect x="5" y="2" width="30" height="96" rx="4" fill="#222" />
          <circle cx="20" cy="20" r="11" fill={state.color === 'red' ? '#ff2222' : '#661111'} />
          {state.color === 'red' && <circle cx="20" cy="20" r="14" fill="#ff222244" />}
          <circle cx="20" cy="50" r="11" fill={state.color === 'yellow' ? '#ffcc00' : '#665500'} />
          {state.color === 'yellow' && <circle cx="20" cy="50" r="14" fill="#ffcc0044" />}
          <circle cx="20" cy="80" r="11" fill={state.color === 'green' ? '#00cc44' : '#005522'} />
          {state.color === 'green' && <circle cx="20" cy="80" r="14" fill="#00cc4444" />}
        </>
      )

    case 'arrow': {
      const mainColor = state.mainColor === 'red' ? '#661111' : '#665500'
      return (
        <>
          <rect x="5" y="2" width="30" height="96" rx="4" fill="#222" />
          <circle cx="20" cy="22" r="11" fill={mainColor} />
          <rect x="6" y="40" width="28" height="56" rx="3" fill="#333" />
          {state.activeArrows.map((arrow, i) => (
            <g key={arrow} transform={`translate(20, ${52 + i * 18})`}>
              {arrow === 'left' && (
                <path d="M-8,0 L2,-6 L2,-2 L8,-2 L8,2 L2,2 L2,6 Z" fill="#00aaff" />
              )}
              {arrow === 'right' && (
                <path d="M8,0 L-2,-6 L-2,-2 L-8,-2 L-8,2 L-2,2 L-2,6 Z" fill="#00aaff" />
              )}
              {arrow === 'straight' && (
                <path d="M0,-8 L6,0 L3,0 L3,8 L-3,8 L-3,0 L-6,0 Z" fill="#00aaff" />
              )}
            </g>
          ))}
        </>
      )
    }

    case 'flashing': {
      const col = state.color === 'red' ? '#ff2222' : '#ffcc00'
      const glow = state.color === 'red' ? '#ff222244' : '#ffcc0044'
      return (
        <>
          <rect x="5" y="30" width="30" height="40" rx="4" fill="#222" />
          <circle cx="20" cy="50" r="12" fill={col} />
          <circle cx="20" cy="50" r="16" fill={glow} />
          <text x="20" y="90" textAnchor="middle" fontSize="9" fill="#aaa">
            {state.color === 'red' ? '点滅' : '注意'}
          </text>
        </>
      )
    }

    case 'pedestrian': {
      const bodyColor = state.phase === 'stop' ? '#ff2222' : '#00cc44'
      return (
        <>
          <rect x="5" y="10" width="30" height="80" rx="4" fill="#222" />
          {/* Person figure */}
          <circle cx="20" cy="30" r="6" fill={bodyColor} />
          <rect x="14" y="38" width="12" height="16" fill={bodyColor} />
          {state.phase === 'walk' ? (
            <>
              <line x1="14" y1="54" x2="10" y2="68" stroke={bodyColor} strokeWidth="3" />
              <line x1="26" y1="54" x2="30" y2="68" stroke={bodyColor} strokeWidth="3" />
            </>
          ) : (
            <>
              <line x1="14" y1="54" x2="14" y2="68" stroke={bodyColor} strokeWidth="3" />
              <line x1="26" y1="54" x2="26" y2="68" stroke={bodyColor} strokeWidth="3" />
            </>
          )}
          {state.phase === 'flashing' && (
            <text x="20" y="90" textAnchor="middle" fontSize="8" fill="#ffcc00">点滅</text>
          )}
        </>
      )
    }
  }
}
