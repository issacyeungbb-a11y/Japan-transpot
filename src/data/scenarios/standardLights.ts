import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const standardLightScenarios: Scenario[] = [
  {
    id: 'std-001',
    category: 'standard',
    title: { 'zh-TW': '紅燈——必須停車', ja: '赤信号——停止義務' },
    description: {
      'zh-TW': '你正駛近一個十字路口，燈號顯示紅色。',
      ja: '十字路口に差し掛かった。信号は赤を示している。',
    },
    difficulty: 1,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'red' },
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
            'zh-TW': '前方紅燈，你應該？',
            ja: '前方の信号が赤。あなたはどうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '停在停車線前等候', ja: '停止線の手前で停車して待つ' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！紅燈必須在停車線前完全停車。',
                ja: '正解！赤信号では停止線の手前で必ず停車しなければなりません。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '慢下來但繼續通過', ja: '徐行して通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！紅燈即使慢行也不能通過，必須停車。',
                ja: '不正解！赤信号では徐行しても通過できません。必ず停車が必要です。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '其他車沒有，快速通過', ja: '他の車がいないので素早く通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！即使無其他車輛，紅燈仍不能通過，屬違規行為。',
                ja: '不正解！他の車がいなくても赤信号の通過は違反です。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '鳴號警告行人後通過', ja: 'クラクションを鳴らして通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！鳴號不能代替停車義務，紅燈必須停車。',
                ja: '不正解！クラクションで停止義務は免除されません。',
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
          '根據道路交通法第7條，紅色信號燈表示停止。車輛必須在停車線前完全停車，不得通過停車線，直至燈號轉為綠色（青色）。',
        ja: '道路交通法第7条により、赤色信号は停止を意味します。車両は停止線の手前で完全に停車し、青信号になるまで進行してはなりません。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '很多人以為無車就可以闖紅燈，但法律規定不論有無車輛都必須遵守燈號。',
        ja: '「他の車がいないから大丈夫」という考えは間違いです。信号は状況に関わらず遵守する義務があります。',
      },
    },
  },

  {
    id: 'std-002',
    category: 'standard',
    title: { 'zh-TW': '黃燈——停定還是繼續？', ja: '黄信号——止まる？進む？' },
    description: {
      'zh-TW': '你接近路口，燈號突然由綠變黃。你仍在停車線前。',
      ja: '交差点に近づいたとき、信号が青から黄に変わった。まだ停止線の手前にいる。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'yellow' },
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 65, speed: 2000 },
        ],
        decisionPoint: {
          triggerAtMs: 1200,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '黃燈亮起，你仍在停車線前，你應該？',
            ja: '黄信号になった。まだ停止線の手前にいる。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '立即停車在停車線前', ja: '停止線の手前で即座に停車する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！仍在停車線前，黃燈應停車等候。',
                ja: '正解！停止線の手前では黄信号に従い停車すべきです。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '加速衝過路口', ja: 'アクセルを踏んで交差点を通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！黃燈不代表加速通過，仍在停車線前必須停車。',
                ja: '不正解！黄信号はアクセルを踏む合図ではありません。停止線の手前では停車が必要です。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '和綠燈一樣正常通過', ja: '青信号と同じように通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！黃燈不等於綠燈，停車線前必須停車。',
                ja: '不正解！黄信号は青信号ではありません。停止線の手前では停車が必要です。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'd',
              text: { 'zh-TW': '慢慢滑行通過', ja: 'ゆっくりと滑走して通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！慢行並不符合黃燈停車要求，停車線前必須停車。',
                ja: '不正解！徐行は停車義務を果たしていません。停止線の手前では完全に停車する必要があります。',
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
          '黃燈表示即將轉紅，除非已越過停車線進入路口，或緊急剎車會造成危險，否則必須停車。仍在停車線前時，必須停車等候。',
        ja: '黄信号は赤信号への切り替わりを示します。停止線を越えていない場合、または急停止が危険でない場合は、停車する義務があります。',
      },
      lawArticle: '道路交通法第7条第1項第2号',
      commonMistake: {
        'zh-TW': '黃燈不是「衝」的信號。只有已進入路口才可繼續通過，否則必須停車。',
        ja: '黄信号は「急いで通過」の合図ではありません。すでに交差点内にいる場合のみ通過が認められます。',
      },
    },
  },

  {
    id: 'std-003',
    category: 'standard',
    title: { 'zh-TW': '黃燈——已過停車線', ja: '黄信号——すでに停止線を越えた場合' },
    description: {
      'zh-TW': '你已進入路口，燈號由綠轉黃。',
      ja: '交差点に入ったところで信号が青から黄に変わった。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'yellow' },
      },
    ],
    phases: [
      {
        id: 'in_intersection',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: cy + 30 },
          { x: cx + 20, y: cy - 80, speed: 1500 },
        ],
        decisionPoint: {
          triggerAtMs: 400,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '你已在路口內，燈號轉黃，你應該？',
            ja: '交差点内にいるときに黄信号になった。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '繼續通過路口', ja: '交差点を通過し続ける' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！已進入路口，應迅速安全地通過，不可在路口中停車。',
                ja: '正解！すでに交差点内にいる場合は、安全に通過し続けることが正しい判断です。交差点内での停車は危険です。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '立即在路口中間停車', ja: '交差点の真ん中で即座に停車する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！在路口中停車非常危險，已進入路口應迅速通過。',
                ja: '不正解！交差点内での停車は非常に危険です。すでに入っている場合は速やかに通過してください。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '倒車退出路口', ja: 'バックして交差点を出る' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！在路口倒車極其危險，應繼續向前安全通過。',
                ja: '不正解！交差点でのバックは非常に危険です。前進して安全に通過してください。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '等黃燈變紅再行動', ja: '赤信号になってから行動する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！在路口等待只會阻礙交通和增加碰撞風險，應立即通過。',
                ja: '不正解！交差点内での待機は交通を妨げ、衝突リスクを高めます。即座に通過してください。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '已越過停車線進入路口時，黃燈應繼續通過，不可在路口中停車，因為會阻礙橫向來車，非常危險。',
        ja: 'すでに停止線を越えて交差点内にいる場合、黄信号でも通過を続けるのが正しい行動です。交差点内での停車は横からの車両の妨げになり、非常に危険です。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'std-004',
    category: 'standard',
    title: { 'zh-TW': '青燈（綠燈）的含義', ja: '青信号の意味' },
    description: {
      'zh-TW': '路口燈號顯示青色（綠色）。你知道日本法律上係點稱呼？',
      ja: '信号は青を示している。法律上の名称を知っていますか？',
    },
    difficulty: 1,
    mapType: 'cross',
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
        durationMs: 2500,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 55, speed: 1600 },
        ],
        decisionPoint: {
          triggerAtMs: 1000,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '日本的「綠燈」法律上正式稱為？',
            ja: '日本で「青信号」と呼ばれるこの信号、正式名称は？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '青信号（あおしんごう）', ja: '青信号（あおしんごう）' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！日本法律上稱為「青信号」，雖然燈光看起來係綠色，但正式名稱係「青」。',
                ja: '正解！法律上は「青信号」と呼びます。見た目は緑色でも、正式名称は「青」です。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '綠信号（みどりしんごう）', ja: '緑信号（みどりしんごう）' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！雖然燈色偏綠，但日本法律上正式稱為「青信号」，不是「緑信号」。',
                ja: '不正解！見た目は緑色ですが、法律上の正式名称は「青信号」です。「緑信号」とは言いません。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '進行信号（しんこうしんごう）', ja: '進行信号（しんこうしんごう）' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！正式名稱係「青信号」。',
                ja: '不正解！正式名称は「青信号」です。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '通過信号（つうかしんごう）', ja: '通過信号（つうかしんごう）' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！正式名稱係「青信号」。',
                ja: '不正解！正式名称は「青信号」です。',
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
          '日本道路交通法中，俗稱「綠燈」的信號正式名稱係「青信号（あおしんごう）」。雖然燈光呈現偏藍綠色，但日語文化中「青」（あお）可同時指藍色和綠色，因此沿用「青信号」。',
        ja: '道路交通法では、いわゆる「緑信号」は「青信号」と呼ばれます。日本語の「青（あお）」は青色と緑色の両方を指すことがあり、信号の色も「青信号」と呼ばれます。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  {
    id: 'std-005',
    category: 'standard',
    title: { 'zh-TW': '右轉時的注意事項', ja: '右折時の注意点' },
    description: {
      'zh-TW': '青燈亮起，你想右轉，但對面有直行車輛。',
      ja: '青信号で右折しようとしているが、対向車が直進してくる。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'green' },
      },
    ],
    npcs: [
      {
        id: 'oncoming',
        type: 'vehicle',
        startX: cx - 20,
        startY: cy - 120,
        path: [{ x: cx - 20, y: cy + 150 }],
        startAtMs: 800,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 20, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '青燈，你要右轉，但對面有直行來車，你應該？',
            ja: '青信号で右折したい。対向直進車がいる。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '等對面直行車通過後右轉', ja: '対向直進車が通過するのを待ってから右折する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！右轉必須讓直行車輛先行，這是日本交通規則的基本原則。',
                ja: '正解！右折時は対向直進車に進路を譲る義務があります。これは日本の基本的な交通ルールです。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '搶先右轉，對面車讓我', ja: '先に右折して、対向車に譲ってもらう' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！直行車享有優先權，右轉車必須讓路。',
                ja: '不正解！直進車が優先です。右折車が道を譲る必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '鳴號提示對面讓路', ja: 'クラクションを鳴らして対向車に道を譲らせる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！鳴號不能改變讓行義務。直行車享有優先權。',
                ja: '不正解！クラクションで優先権は変わりません。直進車が優先です。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '慢慢右轉，邊轉邊等', ja: 'ゆっくり右折しながら相手を待つ' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！佔據路口等候很危險，應先讓對面車通過，確認安全後才右轉。',
                ja: '不正解！交差点を塞ぐ形で待つのは危険です。まず対向車を通過させてから右折してください。',
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
          '日本靠左行駛，右轉需橫越對向車道。青燈時，直行車及左轉車享有優先權，右轉車必須讓路給直行對向車輛，確認安全後才可右轉。',
        ja: '日本は左側通行のため、右折時は対向車線を横断します。青信号時、直進車や左折車が優先されます。右折車は対向直進車の通過を確認してから右折しなければなりません。',
      },
      lawArticle: '道路交通法第37条',
    },
  },

  {
    id: 'std-006',
    category: 'standard',
    title: { 'zh-TW': '路口行人過馬路', ja: '交差点での歩行者保護' },
    description: {
      'zh-TW': '青燈亮，你要左轉，但有行人正在橫行過馬路。',
      ja: '青信号で左折しようとしているが、歩行者が横断中だ。',
    },
    difficulty: 1,
    mapType: 'cross',
    lights: [
      {
        id: 'main',
        x: cx + 50,
        y: cy - 60,
        state: { type: 'standard', color: 'green' },
      },
    ],
    npcs: [
      {
        id: 'ped1',
        type: 'pedestrian',
        startX: cx - 50,
        startY: cy - 45,
        path: [{ x: cx + 50, y: cy - 45 }],
        startAtMs: 500,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 20, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '青燈，你要左轉，但行人正在橫行，你應該？',
            ja: '青信号で左折したいが、歩行者が横断中。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '停車讓行人先過', ja: '歩行者が渡り終えるまで停車して待つ' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！轉彎時必須讓正在橫行的行人先過，行人享有優先權。',
                ja: '正解！転回時は横断中の歩行者を優先する義務があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '緩慢左轉，行人會讓開', ja: 'ゆっくり左折する。歩行者はよけるはずだ' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！行人享有優先權，車輛必須停車讓行人先通過。',
                ja: '不正解！歩行者が優先です。車両は歩行者の通過を待たなければなりません。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '按喇叭提醒行人讓路', ja: 'クラクションで歩行者に退くよう知らせる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！行人享有優先權，不應以鳴號要求行人讓路。',
                ja: '不正解！歩行者が優先です。クラクションで道を空けさせることはできません。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'd',
              text: { 'zh-TW': '加速左轉避開行人', ja: 'スピードを上げて歩行者を避けながら左折する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！加速在行人旁邊通過非常危險，必須停車讓行人先通過。',
                ja: '不正解！歩行者の脇を加速通過するのは非常に危険です。必ず停車して歩行者を先に通過させてください。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '即使是青燈，轉彎時遇到正在橫行過馬路的行人，車輛必須停車讓行人先通過。行人在橫行道上享有絕對優先權。',
        ja: '青信号であっても、転回時に横断中の歩行者がいる場合、車両は停車して歩行者の通過を待つ義務があります。横断歩道の歩行者には絶対的な優先権があります。',
      },
      lawArticle: '道路交通法第38条',
    },
  },

  {
    id: 'std-007',
    category: 'standard',
    title: { 'zh-TW': '夜間路口無燈', ja: '夜間の無灯交差点' },
    description: {
      'zh-TW': '夜晚在農村路上，前方路口沒有交通燈，也沒有停車標誌。',
      ja: '夜間の農道で、信号も一時停止標識もない交差点に差し掛かった。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 55, speed: 2000 },
        ],
        decisionPoint: {
          triggerAtMs: 1200,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '路口無燈也無標誌，你應該？',
            ja: '信号も標識もない交差点。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '減速確認左右安全後通過', ja: '速度を落として左右を確認してから通過する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！無信號路口必須減速，確認左右方向安全後才通過。',
                ja: '正解！信号のない交差点では徐行して左右を確認する義務があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '繼續正常速度通過', ja: '通常速度で通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！無信號路口亦需減速確認，不能保持原速通過。',
                ja: '不正解！信号のない交差点でも徐行して確認する必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '完全停車等候60秒', ja: '完全停車して60秒待つ' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '無需等候特定時間，確認安全後即可通過。',
                ja: '特定時間を待つ必要はありません。安全を確認してから通過してください。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '打開車燈閃爍，警告其他車', ja: 'ライトを点滅させて他の車に警告する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '閃燈不能代替確認安全，必須減速觀察左右才可通過。',
                ja: 'ライト点滅だけでは不十分です。徐行して左右を確認してから通過してください。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '無信號燈路口，駕駛者必須減速（徐行）並確認左右方向安全後才可通過。沖繩農村地區有不少無燈路口，需特別留意。',
        ja: '信号のない交差点では、徐行（十分に減速）して左右の安全を確認する義務があります。沖縄の農村部には信号のない交差点が多く、特に注意が必要です。',
      },
      lawArticle: '道路交通法第36条',
    },
  },
]
