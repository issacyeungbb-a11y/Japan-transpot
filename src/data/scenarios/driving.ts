import type { Scenario } from '../types'

// Mirrors ScenarioScene world geometry (CY=520, WORLD_HEIGHT=1000).
const CX = 400
const CY = 520
const INT = 80
const ROAD_W = 80

const SB_X      = CX + 20           // 420 — oncoming southbound lane
const CROSS_Y   = CY + 4            // 524 — crossing traffic near intersection centre
const PED_Y     = CY + INT / 2 + 48 // 608 — pedestrian crosswalk on south approach
const HWY_SB_X  = CX + 40           // 440 — highway southbound lane (NPC)

export const drivingScenarios: Scenario[] = [

  // ── Study + Normal + Challenge ─────────────────────────────────────────────

  // 1) Solid red — stop and wait for green
  {
    id: 'std-red',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '紅燈停車', ja: '赤信号で停止' },
    instruction: { 'zh-TW': '直行通過路口', ja: '交差点を直進' },
    difficulty: 1,
    maneuver: 'straight',
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 3500, state: { type: 'standard', color: 'green' } }],
    evaluation: { waitForGo: true },
    feedback: {
      explanation: {
        'zh-TW': '紅燈必須喺停車線前完全停車，唔可以衝過去。等燈轉青（綠）先再起步。',
        ja: '赤信号では停止線の手前で完全に停止します。青信号になってから発進しましょう。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '見冇車就衝紅燈係違法，唔論有冇車都要停。',
        ja: '車がいなくても赤信号無視は違反です。',
      },
    },
  },

  // 2) Green — proceed
  {
    id: 'std-green',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '青燈通行', ja: '青信号で進行' },
    instruction: { 'zh-TW': '直行通過路口', ja: '交差点を直進' },
    difficulty: 1,
    maneuver: 'straight',
    light: { type: 'standard', color: 'green' },
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '青信号（綠燈）表示可以通行。日本法律上「綠燈」正式叫「青信号」。通過時仍要留意行人同對向車。',
        ja: '青信号は進行可を意味します。通過時も歩行者や対向車に注意しましょう。',
      },
      lawArticle: '道路交通法第7条',
    },
  },

  // 3) Yellow before the line — stop
  {
    id: 'std-yellow',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '黃燈——停車線前', ja: '黄信号——停止線の手前' },
    instruction: { 'zh-TW': '直行通過路口', ja: '交差点を直進' },
    difficulty: 2,
    maneuver: 'straight',
    light: { type: 'standard', color: 'yellow' },
    lightChanges: [{ atMs: 3500, state: { type: 'standard', color: 'green' } }],
    evaluation: { waitForGo: true },
    feedback: {
      explanation: {
        'zh-TW': '黃燈表示即將轉紅。仲未過停車線就必須停低，唔係「加速衝」嘅信號。',
        ja: '黄信号は赤への変わり目。停止線を越えていなければ停止が必要で、「急いで通過」の合図ではありません。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '好多人見黃燈反而加速，其實未過線就要停。',
        ja: '黄信号で加速するのは間違い。停止線手前なら止まります。',
      },
    },
  },

  // 4) Flashing yellow — proceed with caution
  {
    id: 'flash-yellow',
    category: 'flashing',
    roadType: 'straight',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '黃色閃爍——注意通行', ja: '黄色点滅——注意して進行' },
    instruction: { 'zh-TW': '直行（注意減速通過）', ja: '直進（注意して通過）' },
    difficulty: 1,
    maneuver: 'straight',
    light: { type: 'flashing', color: 'yellow' },
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '黃色閃爍燈＝注意：可以通過，但要減速並留意其他車輛同行人。唔使完全停車。',
        ja: '黄色点滅は注意。徐行して他の車や歩行者に注意すれば通過できます。完全停止は不要です。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
    },
  },

  // 5) Pedestrian on the crosswalk — yield
  {
    id: 'ped-cross',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '行人橫過——讓行', ja: '横断歩行者に道を譲る' },
    instruction: { 'zh-TW': '直行通過路口', ja: '交差点を直進' },
    difficulty: 1,
    maneuver: 'straight',
    light: { type: 'standard', color: 'green' },
    npcs: [
      {
        id: 'ped',
        type: 'pedestrian',
        startX: CX - ROAD_W / 2 - 10, startY: PED_Y,
        endX:   CX + ROAD_W / 2 + 10, endY:   PED_Y,
        speed: 52, startAtMs: 3000, color: 0xffd54f,
      },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '即使係青燈，橫行道上有行人就必須停車讓佢哋先過。行人喺橫行道享有絕對優先。',
        ja: '青信号でも横断歩道に歩行者がいれば停止して譲ります。横断歩道の歩行者は絶対優先です。',
      },
      lawArticle: '道路交通法第38条',
      commonMistake: {
        'zh-TW': '青燈唔代表可以唔理行人，撞到行人責任重大。',
        ja: '青信号でも歩行者を無視できません。',
      },
    },
  },

  // 6) Flashing red — full stop, then go
  {
    id: 'flash-red',
    category: 'flashing',
    roadType: 'straight',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '紅色閃爍——一時停止', ja: '赤色点滅——一時停止' },
    instruction: { 'zh-TW': '直行（紅閃要完全停低先過）', ja: '直進（赤点滅は一時停止）' },
    difficulty: 2,
    maneuver: 'straight',
    light: { type: 'flashing', color: 'red' },
    evaluation: { mustStop: true },
    feedback: {
      explanation: {
        'zh-TW': '紅色閃爍燈＝一時停止：必須完全停車，確認左右安全後先可以通過。淨係慢落唔夠。',
        ja: '赤色点滅は一時停止。必ず完全に停止し、左右の安全を確認してから通過します。徐行だけでは不十分です。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '好多人以為慢落就得，其實紅閃一定要停定。',
        ja: '徐行で十分と思いがちですが、赤点滅は完全停止が必要です。',
      },
    },
  },

  // ── Normal + Challenge ─────────────────────────────────────────────────────

  // 7) Left turn with a pedestrian crossing the exit
  {
    id: 'left-ped',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '左轉遇行人', ja: '左折時の歩行者' },
    instruction: { 'zh-TW': '左轉（讓橫過嘅行人）', ja: '左折（横断歩行者を優先）' },
    difficulty: 2,
    maneuver: 'left',
    light: { type: 'standard', color: 'green' },
    npcs: [
      {
        id: 'ped',
        type: 'pedestrian',
        startX: CX - ROAD_W / 2 - 10, startY: PED_Y,
        endX:   CX + ROAD_W / 2 + 10, endY:   PED_Y,
        speed: 42, startAtMs: 3000, color: 0xffd54f,
      },
    ],
    evaluation: { allowedManeuvers: ['left'] },
    feedback: {
      explanation: {
        'zh-TW': '左轉時轉入嘅路口若有行人橫過，必須停車讓行人先過先可以轉。',
        ja: '左折先の横断歩道に歩行者がいれば、停止して歩行者を先に通します。',
      },
      lawArticle: '道路交通法第38条',
    },
  },

  // 8) One-way street — only the legal direction (left)
  {
    id: 'oneway-left',
    category: 'oneway',
    roadType: 't-junction',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '一方通行——揀啱方向', ja: '一方通行——正しい方向へ' },
    instruction: { 'zh-TW': '前方一方通行，只可左轉', ja: '前方は一方通行、左折のみ可' },
    difficulty: 2,
    maneuver: 'left',
    light: null,
    evaluation: { allowedManeuvers: ['left'] },
    feedback: {
      explanation: {
        'zh-TW': '一方通行（單行路）只可以朝指定方向行駛。逆方向駛入屬嚴重違規，那霸舊市區好多單行路。',
        ja: '一方通行は指定方向にのみ進めます。逆走は重大な違反です。那覇の旧市街には一方通行が多くあります。',
      },
      lawArticle: '道路交通法第8条',
      commonMistake: {
        'zh-TW': '見路通就以為兩邊都行得，要睇清楚一方通行標誌。',
        ja: '一方通行の標識を見落とさないようにしましょう。',
      },
    },
  },

  // ── Challenge only ─────────────────────────────────────────────────────────

  // 9) Right turn — yield to oncoming straight traffic
  {
    id: 'std-right-yield',
    category: 'standard',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '右轉讓直行車', ja: '右折時は直進車を優先' },
    instruction: { 'zh-TW': '右轉（讓對向直行車先行）', ja: '右折（対向直進車を先に）' },
    difficulty: 3,
    maneuver: 'right',
    light: { type: 'standard', color: 'green' },
    npcs: [
      {
        id: 'oncoming',
        type: 'vehicle',
        startX: SB_X, startY: -40,
        endX: SB_X, endY: 1040,
        speed: 150, startAtMs: 0, color: 0xcc2222,
      },
    ],
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '即使青燈，右轉都要讓對向直行車先行。日本靠左行駛，右轉會橫過對向車道。',
        ja: '青信号でも右折車は対向直進車に進路を譲ります。左側通行のため右折は対向車線を横切ります。',
      },
      lawArticle: '道路交通法第37条',
    },
  },

  // 10) Red main + right arrow — only right turn allowed
  {
    id: 'arrow-red-right',
    category: 'arrow',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '紅燈＋右箭頭', ja: '赤信号＋右矢印' },
    instruction: { 'zh-TW': '右轉（紅燈但右箭頭亮起）', ja: '右折（赤でも右矢印が点灯）' },
    difficulty: 3,
    maneuver: 'right',
    light: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '主燈紅色但右箭頭亮起時，只可以向箭頭方向（右）行駛，唔可以直行或左轉。',
        ja: '主信号が赤でも右矢印が点灯していれば、矢印の方向（右）にのみ進めます。直進・左折は不可。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '箭頭只准箭頭方向，當成綠燈直行就違規。',
        ja: '矢印の方向以外へ進むと違反です。',
      },
    },
  },

  // 11) No signal — yield to priority (crossing) road
  {
    id: 'priority-yield',
    category: 'priority',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '無燈路口——讓優先道路', ja: '無信号——優先道路に譲る' },
    instruction: { 'zh-TW': '直行（橫向為優先道路）', ja: '直進（横は優先道路）' },
    difficulty: 3,
    maneuver: 'straight',
    light: null,
    npcs: [
      {
        id: 'cross',
        type: 'vehicle',
        startX: -40, startY: CROSS_Y,
        endX: 840,   endY: CROSS_Y,
        speed: 210, startAtMs: 0, color: 0xe69a2e,
      },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '無信號路口要減速，橫向係優先道路（較闊／有標誌）就要讓佢哋先過，確認安全先通過。',
        ja: '無信号交差点では徐行し、横が優先道路なら通過を待ちます。安全を確認してから進みます。',
      },
      lawArticle: '道路交通法第36条',
    },
  },

  // 12) Busy intersection — green light but pedestrian + oncoming car
  {
    id: 'busy-intersection',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '繁忙路口——小心多個障礙', ja: '繁忙交差点——複数の危険' },
    instruction: { 'zh-TW': '直行（留意行人同對向車）', ja: '直進（歩行者・対向車に注意）' },
    difficulty: 3,
    maneuver: 'straight',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Pedestrian crossing in the player's path (south crosswalk)
      {
        id: 'ped',
        type: 'pedestrian',
        startX: CX - ROAD_W / 2 - 8, startY: PED_Y,
        endX:   CX + ROAD_W / 2 + 8, endY:   PED_Y,
        speed: 40, startAtMs: 3000, color: 0xffd54f,
      },
      // Oncoming vehicle also in the scene (adds cognitive load)
      {
        id: 'oncoming',
        type: 'vehicle',
        startX: SB_X, startY: CY - 300,
        endX:   SB_X, endY:   CY + 300,
        speed: 130, startAtMs: 0, color: 0xaa3333,
      },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '即使係青燈，行人橫道有人就必須讓行。繁忙路口要同時留意行人同對向車，千祈唔好分心。',
        ja: '青信号でも横断歩道の歩行者は優先。繁忙な交差点では歩行者と対向車を同時に確認しましょう。',
      },
      lawArticle: '道路交通法第38条',
      commonMistake: {
        'zh-TW': '對向車吸引目光，忽略埋行人係常見錯誤。',
        ja: '対向車に気を取られて歩行者を見落とすのが典型的なミスです。',
      },
    },
  },

  // 13) Right turn — TWO oncoming vehicles in sequence
  {
    id: 'right-two-oncoming',
    category: 'standard',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '右轉——兩輛對向車', ja: '右折——2台の対向車' },
    instruction: { 'zh-TW': '右轉（等兩輛對向車都過先轉）', ja: '右折（2台の対向車が過ぎてから）' },
    difficulty: 3,
    maneuver: 'right',
    light: { type: 'standard', color: 'green' },
    npcs: [
      {
        id: 'opp1',
        type: 'vehicle',
        startX: SB_X, startY: CY - 380,
        endX:   SB_X, endY:   CY + 380,
        speed: 160, startAtMs: 0, color: 0xcc2222,
      },
      {
        id: 'opp2',
        type: 'vehicle',
        startX: SB_X, startY: CY - 380,
        endX:   SB_X, endY:   CY + 380,
        speed: 130, startAtMs: 2400, color: 0x2255cc,
      },
    ],
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '右轉時必須讓所有對向直行車輛先過，包括第二輛。急於搶轉係引致意外嘅常見原因。',
        ja: '右折時は対向直進車が全て通過するまで待ちます。2台目を見落としての無理な右折は事故の原因です。',
      },
      lawArticle: '道路交通法第37条',
      commonMistake: {
        'zh-TW': '讓第一輛過後以為安全就立即轉，但第二輛跟住就嚟。',
        ja: '1台目が過ぎると安心して右折し、2台目と衝突するケースが多いです。',
      },
    },
  },

  // 14) Highway — maintain lane, oncoming fast vehicles
  {
    id: 'highway-express',
    category: 'standard',
    roadType: 'highway',
    modes: ['challenge'],
    title: { 'zh-TW': '高速公路——保持車道', ja: '高速道路——車線を守れ' },
    instruction: { 'zh-TW': '高速直行（唔好偏離車道）', ja: '高速直進（車線を維持）' },
    difficulty: 3,
    maneuver: 'straight',
    light: null,
    npcs: [
      // Three southbound vehicles zooming past in the opposite carriageway
      {
        id: 'hwy1',
        type: 'vehicle',
        startX: HWY_SB_X, startY: 100,
        endX:   HWY_SB_X, endY:   1050,
        speed: 140, startAtMs: 0, color: 0xff5544,
      },
      {
        id: 'hwy2',
        type: 'vehicle',
        startX: HWY_SB_X, startY: 100,
        endX:   HWY_SB_X, endY:   1050,
        speed: 140, startAtMs: 2000, color: 0x4455ff,
      },
      {
        id: 'hwy3',
        type: 'vehicle',
        startX: HWY_SB_X, startY: 100,
        endX:   HWY_SB_X, endY:   1050,
        speed: 120, startAtMs: 4000, color: 0x44bb55,
      },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '日本高速公路（高速道路）限速100 km/h，最低時速50 km/h。必須保持車道，唔可以喺路肩停車（緊急除外）。',
        ja: '日本の高速道路は最高速度100km/h、最低速度50km/h。車線を守り、路肩への駐停車は緊急時以外禁止です。',
      },
      lawArticle: '道路交通法第75条の4・高速自動車国道法',
      commonMistake: {
        'zh-TW': '對向高速車嚇親，反應過大轉波，衝出車道係常見危機。',
        ja: '対向車に驚いて過剰にハンドルを切り、車線を逸脱する事故が多いです。',
      },
    },
  },
]
