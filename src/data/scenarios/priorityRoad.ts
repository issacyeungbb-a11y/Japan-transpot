import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const priorityRoadScenarios: Scenario[] = [
  {
    id: 'priority-001',
    category: 'priority',
    title: { 'zh-TW': '優先道路——讓主幹道車輛先行', ja: '優先道路——幹線道路の車両を優先' },
    description: {
      'zh-TW': '你從細街駛出，要進入一條主幹道。前方沒有信號燈，只有路面標誌。',
      ja: '脇道から幹線道路に出ようとしている。信号はなく、路面標示のみ。',
    },
    difficulty: 2,
    mapType: 'priority_road',
    lights: [],
    npcs: [
      {
        id: 'main_road_car',
        type: 'vehicle',
        startX: 30,
        startY: cy - 20,
        path: [{ x: GAME_WIDTH - 30, y: cy - 20 }],
        startAtMs: 1200,
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
            'zh-TW': '從細街駛出主幹道，右邊有車輛接近，你應該？',
            ja: '脇道から幹線道路に出る。右から車が近づいている。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '停車讓主幹道車輛先行', ja: '停車して幹線道路の車両を先に通す' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！從支路進入主幹道，必須讓主幹道行駛中的車輛先行，這係讓行規則。',
                ja: '正解！脇道から幹線道路に出る際は、幹線道路を走行中の車両に道を譲らなければなりません。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '我先出，主幹道車輛會讓我', ja: '先に出る。幹線道路の車が譲ってくれる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！主幹道車輛享有優先權，從支路出來的車輛必須讓路。',
                ja: '不正解！幹線道路の車両が優先です。脇道から出る車両が道を譲る必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '鳴號提示對方，然後駛出', ja: 'クラクションで知らせてから出る' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！鳴號不能改變讓行義務，必須讓主幹道車輛先行。',
                ja: '不正解！クラクションで優先権は変わりません。幹線道路の車両を先に通してください。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '快速衝出，在對方到達前通過', ja: '素早く出て、相手が来る前に通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '極度危險！在主幹道有車輛接近時強行衝出，極易引起嚴重事故。',
                ja: '非常に危険！幹線道路に車が来ているのに強引に出るのは重大事故を引き起こす可能性があります。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '從支路（細街）進入主幹道時，支路車輛必須讓主幹道行駛中的車輛先行。沖繩縣道和農村地區有很多這類路口，需特別留意。',
        ja: '脇道から幹線道路に出る際、脇道の車両は幹線道路を走行中の車両を優先しなければなりません。沖縄の県道や農村部にはこのような交差点が多くあります。',
      },
      lawArticle: '道路交通法第36条',
    },
  },

  {
    id: 'priority-002',
    category: 'priority',
    title: { 'zh-TW': '同等道路路口的讓行規則', ja: '同幅の道路での優先順位' },
    description: {
      'zh-TW': '兩條同等寬度的路口，沒有信號燈，左邊有車輛駛來。',
      ja: '同幅の道路が交わる交差点。信号なし。左から車が来ている。',
    },
    difficulty: 3,
    mapType: 'cross',
    lights: [],
    npcs: [
      {
        id: 'left_car',
        type: 'vehicle',
        startX: cx - 150,
        startY: cy - 20,
        path: [{ x: cx + 150, y: cy - 20 }],
        startAtMs: 1000,
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
          triggerAtMs: 1400,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '無信號路口，兩條路同樣寬，左邊有車，你應該？',
            ja: '信号なし交差点、同幅の道路。左から車が来ている。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '讓左邊來車先行（左方優先）', ja: '左からの車を優先する（左方優先）' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！日本在同等道路的無信號路口，左方車輛享有優先權（左方優先）。',
                ja: '正解！日本では同幅の道路の信号なし交差点では、左から来る車両が優先されます（左方優先）。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '右邊車優先，所以我先過', ja: '右方の車が優先なので私が先に通る' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！日本係左方優先，不是右方優先。左邊來的車輛享有優先權。',
                ja: '不正解！日本は左方優先です。右方優先ではありません。左から来る車両が優先されます。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '誰先到路口誰先行', ja: '先に交差点に着いた方が先に行く' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！日本有明確的左方優先規則，不是先到先得。',
                ja: '不正解！日本では明確な左方優先ルールがあります。先着順ではありません。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'd',
              text: { 'zh-TW': '互相禮讓，誰讓誰就先過', ja: 'お互いに譲り合い、譲った方が先に行く' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '禮讓精神可取，但日本有明確法規：左方車輛優先，遵守法規更安全可靠。',
                ja: '譲り合いの精神は良いですが、日本には明確な法規があります。左方優先を守る方が安全です。',
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
          '日本道路交通法規定，在同等道路的無信號交叉路口，左方來車享有優先通行權（左方優先原則）。這係日本獨特的讓行規則，來自香港或其他地方的駕駛者需要特別注意。',
        ja: '日本の道路交通法では、同幅道路の信号なし交差点では、左から来る車両が優先されます（左方優先の原則）。これは日本独自の規則であり、他の国からの運転者は特に注意が必要です。',
      },
      lawArticle: '道路交通法第36条第1項',
    },
  },
]
