import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const oneWayScenarios: Scenario[] = [
  {
    id: 'oneway-001',
    category: 'oneway',
    title: { 'zh-TW': '一方通行——只可向指示方向行駛', ja: '一方通行——指定方向にのみ進行可' },
    description: {
      'zh-TW': '那霸舊市區街道顯示「一方通行」標誌，箭頭指向左方。',
      ja: '那覇旧市街の道路に「一方通行」標識がある。矢印は左を向いている。',
    },
    difficulty: 2,
    mapType: 'oneway',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'green' },
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 55, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '一方通行標誌，箭頭指左，但你想直行，你應該？',
            ja: '一方通行標識、矢印は左向き。あなたは直進したい。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '必須跟箭頭左轉，不可直行', ja: '矢印に従い左折する。直進は不可' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！一方通行路只可按指定方向行駛，不可直行或逆行。',
                ja: '正解！一方通行路は指定方向にのみ進行できます。直進や逆走は不可です。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '青燈，所以我可以直行', ja: '青信号なので直進できる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！一方通行路標比信號燈更優先，只可按指定方向行駛。',
                ja: '不正解！一方通行標識は信号より優先されます。指定方向にのみ進行できます。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'c',
              text: { 'zh-TW': '一方通行只適用於貨車，私家車可直行', ja: '一方通行はトラックのみ対象。乗用車は直進できる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！一方通行適用於所有車輛，不分種類，全部必須遵守。',
                ja: '不正解！一方通行は全ての車両に適用されます。車種は関係ありません。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '沒有來車，可以短暫直行', ja: '対向車がいなければ短距離の直進は可能' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！即使無對向車，一方通行路違規直行屬違法，且有隱患（例如有車從前方駛來）。',
                ja: '不正解！対向車がなくても一方通行の違反は違法です。また前方から車が来るリスクもあります。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '一方通行（いっぽうつうこう）路係只可按標誌指示方向行駛的道路，不可逆行，亦不可向非指示方向行駛。那霸市區有大量一方通行路，是香港遊客自駕時最常犯錯的地方之一。',
        ja: '一方通行路は指示された方向にのみ進行できる道路です。逆走や指示外の方向への進行は禁止されています。那覇市内には一方通行路が多く、観光客が自動車を運転する際に注意が必要な場所の一つです。',
      },
      lawArticle: '道路交通法第8条',
    },
  },

  {
    id: 'oneway-002',
    category: 'oneway',
    title: { 'zh-TW': '一方通行路——可否超車？', ja: '一方通行路での追い越し' },
    description: {
      'zh-TW': '一方通行路上，前方有慢速行駛的車輛，你想超車。',
      ja: '一方通行路で、前に遅い車がいる。追い越ししたい。',
    },
    difficulty: 3,
    mapType: 'oneway',
    lights: [],
    npcs: [
      {
        id: 'slow_car',
        type: 'vehicle',
        startX: cx - 10,
        startY: cy + 20,
        path: [{ x: cx - 10, y: cy - 120 }],
        startAtMs: 0,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 55, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '一方通行路，前方有慢車，你想超車，可以從哪側超車？',
            ja: '一方通行路で前に遅い車。どちら側から追い越しできますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '可從右側超車（一方通行路可右超）', ja: '右側から追い越し可能（一方通行は右側追い越し可）' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！一方通行路沒有對向車輛，可以從右側超車，不同於一般雙向道路。',
                ja: '正解！一方通行路には対向車がないため、右側からの追い越しが可能です。通常の双方向道路とは異なります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '只能從左側超車', ja: '左側からしか追い越しできない' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '一般道路確實只能左超，但一方通行路因無對向車，右超亦被允許。',
                ja: '通常の道路では左側追い越しが原則ですが、一方通行路では対向車がないため右側追い越しも可能です。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '一方通行路不能超車', ja: '一方通行路では追い越し禁止' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！一方通行路可以超車，且右側超車係被許可的。',
                ja: '不正解！一方通行路での追い越しは可能で、右側追い越しも許可されています。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '左右兩側都不能超車，必須跟隨慢車', ja: '左右どちらからも追い越せない。遅い車に従うしかない' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！一方通行路允許超車，且右側超車係合法的。',
                ja: '不正解！一方通行路では追い越しが可能で、右側からの追い越しは合法です。',
              },
              consequence: 'penalty_stop',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '在一方通行路，因為沒有對向車輛，超車可以從右側進行，這與一般雙向道路（只能左超）不同。但超車時仍需確認前後安全，且不可在禁止超車路段超車。',
        ja: '一方通行路では対向車がないため、右側からの追い越しが許可されています。これは通常の双方向道路（左側追い越しのみ）とは異なります。ただし追い越し時は前後の安全確認が必要で、追い越し禁止区間は除きます。',
      },
      lawArticle: '道路交通法第26条の2',
    },
  },
]
