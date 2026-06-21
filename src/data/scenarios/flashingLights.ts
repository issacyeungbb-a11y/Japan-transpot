import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const flashingLightScenarios: Scenario[] = [
  {
    id: 'flash-001',
    category: 'flashing',
    title: { 'zh-TW': '紅色閃爍信號——必須一時停止', ja: '赤色点滅——一時停止の義務' },
    description: {
      'zh-TW': '夜晚路口，信號燈顯示紅色閃爍。這係沖繩郊區夜間常見的情況。',
      ja: '夜間の交差点。信号は赤色点滅を示している。沖縄郊外の夜間によく見られる。',
    },
    difficulty: 1,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'flashing', color: 'red' },
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
            'zh-TW': '前方紅色閃爍信號，你應該？',
            ja: '前方に赤色点滅信号。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '完全停車，確認安全後通過', ja: '完全に停車し、安全を確認してから通過する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！紅色閃爍=一時停止（完全停車），與停車標誌效果相同，確認安全後才可通過。',
                ja: '正解！赤色点滅＝一時停止義務。一時停止標識と同じ効果です。安全確認後に通過してください。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '慢下來留意，可以繼續', ja: '徐行して注意しながら通過できる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！紅色閃爍必須完全停車，不是慢下來就夠，必須完全靜止後確認安全。',
                ja: '不正解！赤色点滅は完全停車が必要です。徐行だけでは不十分で、完全に止まってから安全確認が必要です。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '視作綠燈，直接通過', ja: '青信号と同じように通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '大錯！紅色閃爍絕非綠燈，必須停車確認安全，否則屬嚴重違規。',
                ja: '大間違い！赤色点滅は決して青信号ではありません。停車して安全確認が必要です。違反になります。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '停車並等候30秒', ja: '停車して30秒待つ' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '部份正確。確實需要停車，但不需等候固定時間，確認左右安全後即可通過。',
                ja: '部分的に正解。停車は必要ですが、30秒待つ必要はありません。左右の安全を確認してから通過できます。',
              },
              consequence: 'penalty_stop',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW':
          '紅色閃爍信號（赤色点滅）根據道路交通法第7條第4項，具有與「一時停止」標誌相同的效力。車輛必須在停車線前完全停車，確認安全後才可通過，不需等候固定時間。這係沖繩郊區夜間路口最常見的信號形式。',
        ja: '赤色点滅信号は道路交通法第7条第4項により、一時停止標識と同じ効力を持ちます。車両は停止線の手前で完全に停車し、安全を確認してから通過できます。待機時間の定めはありません。沖縄郊外の夜間交差点でよく見られる信号形式です。',
      },
      lawArticle: '道路交通法第7条第4項',
      commonMistake: {
        'zh-TW': '最常見誤解：以為紅色閃爍=慢下來就可以。實際上必須完全停車（完全靜止），才算符合一時停止要求。',
        ja: '最も多い誤解：「赤色点滅＝徐行すればOK」という考え方。実際は完全停車（完全に静止）が必要です。',
      },
    },
  },

  {
    id: 'flash-002',
    category: 'flashing',
    title: { 'zh-TW': '黃色閃爍信號——注意通過', ja: '黄色点滅——注意して通過' },
    description: {
      'zh-TW': '路口顯示黃色閃爍，這代表係甚麼？',
      ja: '交差点に黄色点滅信号。これはどういう意味ですか？',
    },
    difficulty: 1,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'flashing', color: 'yellow' },
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
            'zh-TW': '黃色閃爍信號，你應該？',
            ja: '黄色点滅信号。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '提高警覺，注意四周安全後繼續', ja: '注意を払い、周囲の安全を確認しながら進む' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！黃色閃爍代表「注意」，不需完全停車，但必須提高警覺小心通過。',
                ja: '正解！黄色点滅は「注意」を意味します。完全停車は不要ですが、十分注意して通過する必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '必須完全停車，和紅色閃爍一樣', ja: '赤色点滅と同様、完全停車が必要' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！黃色閃爍不需完全停車，只需注意通過。完全停車是紅色閃爍的要求。',
                ja: '不正解！黄色点滅は完全停車が不要です。注意しながら通過できます。完全停車は赤色点滅の要件です。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '等黃色閃爍停止才通過', ja: '黄色点滅が止まるまで待ってから通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '不需等候，黃色閃爍代表可以注意通過，不必等信號改變。',
                ja: '待つ必要はありません。黄色点滅は注意しながら通過できることを意味します。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '視作正常綠燈，不需額外注意', ja: '通常の青信号と同じで特別な注意は不要' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！黃色閃爍需要額外警覺，比正常青燈需要更小心觀察左右。',
                ja: '不正解！黄色点滅は通常より注意が必要です。左右をより注意深く確認する必要があります。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW':
          '黃色閃爍信號（黄色点滅）代表「注意信號」，車輛可在提高警覺下通過，不需完全停車。這與紅色閃爍（必須停車）是完全不同的要求。黃色閃爍常見於低風險路口或夜間。',
        ja: '黄色点滅信号は「注意信号」です。徐行して注意しながら通過できます。赤色点滅（完全停車必須）とは全く異なります。低リスクな交差点や夜間によく使われます。',
      },
      lawArticle: '道路交通法第7条第4項',
    },
  },

  {
    id: 'flash-003',
    category: 'flashing',
    title: { 'zh-TW': '紅色閃爍 vs 一時停止標誌', ja: '赤色点滅と一時停止標識の比較' },
    description: {
      'zh-TW': '你知道紅色閃爍信號同一時停止標誌嘅分別嗎？',
      ja: '赤色点滅信号と一時停止標識の違いを知っていますか？',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'flashing', color: 'red' },
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
            'zh-TW': '紅色閃爍信號同「一時停止」標誌，兩者的要求係？',
            ja: '赤色点滅信号と「一時停止」標識の要件は？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '兩者效果相同，都必須完全停車', ja: '両方とも完全停車が必要で、効果は同じ' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！根據道路交通法，紅色閃爍與一時停止標誌具有完全相同的法律效力。',
                ja: '正解！道路交通法により、赤色点滅と一時停止標識は全く同じ法的効力を持ちます。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '信號燈效力更高，標誌只是建議', ja: '信号の方が効力が高く、標識は目安のみ' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！兩者在法律上完全同等，都是強制性的停車要求。',
                ja: '不正解！両方とも法的に同等であり、停車は義務です。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'c',
              text: { 'zh-TW': '紅色閃爍需要停車，標誌只需慢行', ja: '赤色点滅は停車必須、標識は徐行で十分' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！一時停止標誌同樣要求完全停車，不是只慢行。',
                ja: '不正解！一時停止標識も完全停車が必要です。徐行だけでは不十分です。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '標誌需停車，但閃爍信號慢行即可', ja: '標識は停車必須、点滅信号は徐行で十分' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！紅色閃爍同樣需要完全停車，效力與一時停止標誌相同。',
                ja: '不正解！赤色点滅も完全停車が必要です。一時停止標識と同じ効力があります。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '道路交通法第7條明確規定，紅色閃爍信號與一時停止標誌具有完全相同的法律效力，都必須在停車線前完全停車，確認安全後才可通過。',
        ja: '道路交通法第7条は、赤色点滅信号と一時停止標識が同じ法的効力を持つことを明確に規定しています。どちらも停止線の手前で完全に停車し、安全確認後に通過する必要があります。',
      },
      lawArticle: '道路交通法第7条第4項',
    },
  },

  {
    id: 'flash-004',
    category: 'flashing',
    title: { 'zh-TW': '紅色閃爍——停車後多久可以通過？', ja: '赤色点滅——停車後はいつ通過できる？' },
    description: {
      'zh-TW': '遇到紅色閃爍，你停車了，但要等多久才可以通過？',
      ja: '赤色点滅で停車した。どのくらい待てば通過できますか？',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'flashing', color: 'red' },
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
            'zh-TW': '在紅色閃爍前完全停車後，何時可以通過？',
            ja: '赤色点滅で完全停車した後、いつ通過できますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '確認左右安全無其他車輛後立即通過', ja: '左右の安全を確認して他の車がいなければすぐ通過' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！確認安全後即可通過，不需等候固定時間，也不需等信號改變。',
                ja: '正解！安全確認後はすぐに通過できます。決まった待機時間も、信号の変化を待つ必要もありません。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '等候至少5秒才通過', ja: '少なくとも5秒待ってから通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！沒有固定等候時間，安全確認後即可通過。',
                ja: '不正解！決まった待機時間はありません。安全確認後に通過できます。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '等信號由閃爍轉為常亮才通過', ja: '点滅が点灯に変わるまで待ってから通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！紅色閃爍信號可能保持閃爍，不需等信號改變，安全確認後即可通過。',
                ja: '不正解！赤色点滅は変化しないこともあります。信号の変化を待つ必要はなく、安全確認後に通過できます。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '需要等對向車道所有車都停了才能過', ja: '対向車線の全ての車が止まってから通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '不完全正確。需確認安全（包括對向），但不是等「所有車都停」，而是確認無危險後即可通過。',
                ja: '不正確。安全確認（対向車を含む）は必要ですが「全ての車が止まる」まで待つ必要はありません。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '紅色閃爍只要求完全停車後確認安全，沒有規定等候時間。確認左右來車安全後即可通過。不需等待信號改變，因為閃爍信號可能長期保持閃爍。',
        ja: '赤色点滅は完全停車と安全確認のみを要求します。決まった待機時間はありません。左右の安全を確認後すぐに通過できます。信号の変化を待つ必要はなく、点滅が続く場合もあります。',
      },
      lawArticle: '道路交通法第7条第4項',
    },
  },
]
