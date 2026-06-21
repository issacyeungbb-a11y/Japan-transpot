import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const arrowSignalScenarios: Scenario[] = [
  {
    id: 'arrow-001',
    category: 'arrow',
    title: { 'zh-TW': '紅燈右轉箭頭', ja: '赤信号と右折矢印' },
    description: {
      'zh-TW': '路口顯示紅燈，同時亮起右轉箭頭。',
      ja: '赤信号と同時に右折矢印が点灯している。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
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
            'zh-TW': '紅燈加右轉箭頭，你可以？',
            ja: '赤信号に右折矢印が表示されています。あなたはどうできますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '只可以右轉，不可直行或左轉', ja: '右折のみ可能、直進や左折は不可' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！箭頭信號只允許箭頭所指方向行進，紅燈+右箭頭=只可右轉。',
                ja: '正解！矢印信号は指定方向のみ進行可能です。赤信号＋右矢印＝右折のみ可能。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '等燈轉綠才可以右轉', ja: '青信号になってから右折する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！右轉箭頭亮起時，即使是紅燈也可以右轉，不必等候青燈。',
                ja: '不正解！右折矢印が点灯している場合、赤信号でも右折できます。青信号を待つ必要はありません。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '紅燈，所有方向都不可以行駛', ja: '赤信号なのですべての方向に進めない' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！箭頭信號優先，右轉箭頭亮起=可以右轉，即使主燈是紅色。',
                ja: '不正解！矢印信号が優先されます。右折矢印点灯中は赤信号でも右折可能です。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '可以右轉，也可以直行', ja: '右折も直進もできる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！箭頭信號只允許箭頭所指方向，不可直行。',
                ja: '不正解！矢印信号は指定方向のみです。直進はできません。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW':
          '箭頭信號（矢印信号）係配合主燈使用的附加信號。主燈顯示紅色時，如果亮起箭頭，車輛只可按箭頭所指方向行進，其他方向仍屬禁止。右轉箭頭=只可右轉。',
        ja: '矢印信号は主信号に追加される補助信号です。主信号が赤の場合でも、矢印が点灯していれば指定方向に進むことができます。ただし矢印以外の方向には進めません。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'arrow-002',
    category: 'arrow',
    title: { 'zh-TW': '紅燈直行箭頭', ja: '赤信号と直進矢印' },
    description: {
      'zh-TW': '紅燈但亮起直行箭頭，你想左轉。',
      ja: '赤信号だが直進矢印が点灯している。左折したい。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'arrow', mainColor: 'red', activeArrows: ['straight'] },
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
            'zh-TW': '紅燈+直行箭頭，但你想左轉，你應該？',
            ja: '赤信号＋直進矢印。でも左折したい。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '等箭頭消失或燈轉綠才左轉', ja: '矢印が消えるか青信号になってから左折する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！直行箭頭只允許直行，左轉必須等待相應許可（青燈或左轉箭頭）。',
                ja: '正解！直進矢印は直進のみ許可します。左折は青信号または左折矢印が出るまで待つ必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '矢印亮了就可以左轉', ja: '矢印が出ているので左折できる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！直行箭頭只允許直行，不允許左轉或右轉。',
                ja: '不正解！直進矢印は直進のみ許可します。左折や右折はできません。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '紅燈，所以直行和左轉都停', ja: '赤信号なので直進も左折も停車' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！直行箭頭允許直行，但你的目的地是左轉，所以應等待。',
                ja: '不正解！直進矢印は直進を許可しますが、あなたは左折したいので待つ必要があります。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '慢慢左轉，不算違規', ja: 'ゆっくり左折すれば違反ではない' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！速度不影響法規，未獲許可的左轉是違規。',
                ja: '不正解！速度は関係ありません。許可されていない左折は違反です。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '箭頭信號只允許箭頭所指方向。直行箭頭=只可直行，左轉和右轉仍需等待相應信號（青燈或對應箭頭）。',
        ja: '矢印信号は指定方向のみ許可します。直進矢印＝直進のみ可能。左折や右折は別の信号（青信号または対応する矢印）が出るまで待つ必要があります。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'arrow-003',
    category: 'arrow',
    title: { 'zh-TW': '多個箭頭同時亮', ja: '複数の矢印が同時に点灯' },
    description: {
      'zh-TW': '紅燈同時亮起左轉和直行兩個箭頭。',
      ja: '赤信号に左折矢印と直進矢印が同時に点灯している。',
    },
    difficulty: 3,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'arrow', mainColor: 'red', activeArrows: ['left', 'straight'] },
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
            'zh-TW': '紅燈+左轉+直行兩個箭頭，你想右轉，你應該？',
            ja: '赤信号＋左折矢印＋直進矢印。右折したい場合は？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '等燈轉綠或右轉箭頭亮才右轉', ja: '青信号または右折矢印が点灯してから右折する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！兩個箭頭均不包括右轉，右轉必須等待相應許可。',
                ja: '正解！どちらの矢印も右折を許可していません。右折は別の信号が出るまで待つ必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '有箭頭亮了，所有方向都可以', ja: '矢印が出ているからどの方向でも進める' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！只有箭頭所指方向才可通行，右轉沒有箭頭許可。',
                ja: '不正解！矢印で許可された方向のみ進行可能です。右折矢印がないため右折はできません。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '慢速右轉，直行和左轉讓我先', ja: '徐行で右折。直進と左折が先に行かせてくれる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！直行和左轉車享有優先權（有箭頭許可），右轉車不可搶先。',
                ja: '不正解！直進・左折車は矢印により優先されています。右折車は割り込めません。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '左右箭頭都有，等所有車走完再右轉', ja: '矢印の車が全部通過してから右折する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '等車通過想法對，但仍需等待正確信號才可右轉，不是憑自己判斷。',
                ja: '考え方は正しいですが、右折は正しい信号が出るまで待つ必要があります。自己判断ではいけません。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '多個箭頭同時亮起時，只有亮起箭頭所指的方向可以通行。左轉+直行箭頭=可左轉、可直行，但不可右轉。右轉需要右轉箭頭或青燈。',
        ja: '複数の矢印が同時に点灯している場合、点灯している矢印の方向のみ進行可能です。左折矢印＋直進矢印＝左折・直進可能、右折は不可。右折は右折矢印または青信号が必要です。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'arrow-004',
    category: 'arrow',
    title: { 'zh-TW': '黃燈後出現右轉箭頭', ja: '黄信号の後に右折矢印' },
    description: {
      'zh-TW': '燈號由青轉黃再轉紅，同時出現右轉箭頭。你要右轉。',
      ja: '青から黄、そして赤信号になったと同時に右折矢印が点灯。右折したい。',
    },
    difficulty: 3,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
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
            'zh-TW': '紅燈同時出現右轉箭頭，你有多早可以開始右轉？',
            ja: '赤信号と同時に右折矢印が点灯。いつから右折できますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '右轉箭頭亮起時，即可立即右轉', ja: '右折矢印が点灯した瞬間から右折できる' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！右轉箭頭亮起即代表右轉獲得許可，可以立即右轉（確認安全後）。',
                ja: '正解！右折矢印が点灯した瞬間から右折が許可されます（安全確認後）。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '必須等紅燈完全熄滅才可右轉', ja: '赤信号が完全に消えてから右折する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！右轉箭頭亮起時即可右轉，不必等主燈轉換。箭頭信號獨立有效。',
                ja: '不正解！右折矢印が点灯すれば右折可能です。主信号が変わるまで待つ必要はありません。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '等完整一個燈號周期才右轉', ja: '信号が一回転してから右折する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '不需要等一個完整周期，箭頭亮起即可右轉。',
                ja: '1サイクル待つ必要はありません。矢印が点灯した時点で右折できます。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '箭頭只是提示，仍需等青燈', ja: '矢印は案内だけで青信号まで待つ必要がある' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！箭頭信號有完整法律效力，亮起即可按箭頭方向行進。',
                ja: '不正解！矢印信号は法的効力を持ちます。点灯中は矢印方向に進行できます。',
              },
              consequence: 'penalty_stop',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '箭頭信號與主燈獨立運作，箭頭亮起時即可按箭頭方向通行，不需等待主燈轉換。這設計允許特定方向的車輛在某些燈號階段安全通行。',
        ja: '矢印信号は主信号とは独立して機能します。矢印が点灯した瞬間から、その方向に進行することが許可されます。主信号の変化を待つ必要はありません。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'arrow-005',
    category: 'arrow',
    title: { 'zh-TW': 'U型轉向箭頭（迴轉）', ja: 'Uターン矢印信号' },
    description: {
      'zh-TW': '某些路口出現U型轉向（迴轉）箭頭。',
      ja: 'Uターン矢印が表示されている交差点。',
    },
    difficulty: 3,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'arrow', mainColor: 'red', activeArrows: ['left'] },
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
            'zh-TW': '路口出現左轉箭頭，但沒有U轉箭頭，你可以U轉嗎？',
            ja: '左折矢印があるが、Uターン矢印はない。Uターンはできますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '不可以，沒有U轉箭頭就不可U轉', ja: 'できない。Uターン矢印がなければUターン不可' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！U轉需要專用的U轉箭頭或U轉許可，單獨左轉箭頭不包括U轉。',
                ja: '正解！Uターンには専用のUターン矢印または許可が必要です。左折矢印だけではUターンはできません。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '左轉包括U轉，可以', ja: '左折にはUターンも含まれる。できる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！左轉和U轉是不同的行為，需要分別的信號許可。',
                ja: '不正解！左折とUターンは別の行為で、それぞれ別の許可が必要です。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'c',
              text: { 'zh-TW': '看清楚路面沒有禁止U轉標誌就可以', ja: '禁止Uターン標識がなければできる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！即使沒有禁止標誌，在有箭頭信號的路口，必須按箭頭行進，不可自行U轉。',
                ja: '不正解！禁止標識がなくても、矢印信号のある交差点では矢印に従う必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '箭頭只是建議，我可以U轉', ja: '矢印は目安。Uターンしてもいい' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！箭頭信號具有法律效力，不是建議，必須遵守。',
                ja: '不正解！矢印信号は法的拘束力があります。単なる目安ではありません。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': 'U型轉向（迴轉）需要特定的U轉許可或專用箭頭。普通左轉箭頭不包括U轉許可。在日本，U轉（Uターン）在許多路口受到限制，需要特別注意標誌。',
        ja: 'Uターンには専用の許可またはUターン矢印が必要です。通常の左折矢印はUターンを含みません。日本では多くの交差点でUターンが制限されており、標識に注意が必要です。',
      },
      lawArticle: '道路交通法第25条の2',
    },
  },
]
