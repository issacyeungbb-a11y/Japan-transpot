import type { Scenario } from '../types'

// Mirrors ScenarioScene world geometry (CX=400, CY=520, WORLD_HEIGHT=1000).
const CX = 400
const CY = 520
const INT = 80
const ROAD_W = 80

const NB_X    = CX - 20            // 380 — player northbound lane
const SB_X    = CX + 20            // 420 — oncoming (southbound) lane
const CROSS_Y = CY + 4             // 524 — crossing traffic near the intersection centre
const PED_Y   = CY + INT / 2 + 48  // 608 — pedestrian crosswalk on the south approach
const HWY_SB_X = CX + 40           // 440 — expressway oncoming carriageway

// Pedestrian crossing the south crosswalk, left→right and right→left.
const PED_L = CX - ROAD_W / 2 - 12 // 348
const PED_R = CX + ROAD_W / 2 + 12 // 452

// Unified 24-scenario series: all scenarios available in all modes.
// All scenarios include 3+ NPC vehicles and cover Okinawa/Japan left-side traffic rules.
export const drivingScenarios: Scenario[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1 — T-junction left turn — fundamental left-hand traffic
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 't-left-basic',
    category: 'standard',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': 'T字路左轉——保持靠左', ja: 'T字路の左折——左側通行を守る' },
    instruction: { 'zh-TW': '左轉（T字路靠左轉入，唔好蕩去對面）', ja: '左折（突き当りを左へ・左側を維持）' },
    difficulty: 1,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Oncoming southbound car
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 500, speed: 110, startAtMs: 0, color: 0xcc2222 },
      // Cross car left→right
      { id: 'cross1', type: 'vehicle', variant: 'kei', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 120, startAtMs: 500, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['left'] },
    feedback: {
      explanation: {
        'zh-TW': '日本靠左行駛，T字路左轉要收油、靠左，轉入最近嘅左側車道，唔好扭太大蕩去對面。呢個係租車自駕最基本嘅轉彎練習，左手軚特別容易轉太闊。',
        ja: '日本は左側通行。T字路の左折は減速して左に寄り、最も近い左側車線へ入ります。大回りして対向車線に膨らまないよう注意。右ハンドルに慣れていない外国人ドライバーに多いミスです。',
      },
      lawArticle: '道路交通法第34条',
      commonMistake: {
        'zh-TW': '左轉時轉得太闊，車頭蕩咗去右邊對向車道，係外地司機嘅常見錯誤。',
        ja: '左折で大回りして対向車線にはみ出すのが、海外ドライバーの典型的なミスです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2 — T-junction right turn — wait for green, no right-on-red
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 't-right-redwait',
    category: 'standard',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': 'T字路右轉——紅燈唔可右轉', ja: 'T字路の右折——赤信号では右折不可' },
    instruction: { 'zh-TW': '右轉（紅燈先停定，轉青再右轉）', ja: '右折（赤で停止→青になってから右折）' },
    difficulty: 1,
    maneuver: 'right',
    speedLimit: 40,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 3200, state: { type: 'standard', color: 'green' } }],
    npcs: [
      // Cross car left→right during red phase
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 140, startAtMs: 400, color: 0x44bb55 },
      // Cross car right→left during red phase
      { id: 'cross2', type: 'vehicle', variant: 'kei', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 130, startAtMs: 2000, color: 0xffc107 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '紅燈唔可以右轉！日本冇「紅燈可右轉」呢條規則，必須喺停止線前完全停定，等燈轉青（綠）先再轉。呢點同美國、香港唔同，新手要特別記住。',
        ja: '赤信号では右折できません。日本に「赤信号での右折可」はありません。停止線の手前で完全に停止し、青になってから右折します。アメリカや他の国とは異なるので注意が必要です。',
      },
      lawArticle: '道路交通法第7条・第34条',
      commonMistake: {
        'zh-TW': '見冇車就趁紅燈右轉，喺日本係衝燈違規，罰款加扣分。',
        ja: '車がいないからと赤信号で右折するのは信号無視で罰則があります。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 3 — Lead car turns left, should you follow?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lead-left-follow',
    category: 'standard',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '前車左轉——你跟唔跟？', ja: 'リード車が左折——あなたも？' },
    instruction: { 'zh-TW': '左轉（前車左轉，燈係青，跟佢轉係啱）', ja: '左折（前車が左折・青信号なので左折が正解）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Lead car turning left (diagonal NW)
      { id: 'lead1', type: 'vehicle', variant: 'car', startX: NB_X, startY: 680, endX: -200, endY: 480, speed: 115, startAtMs: 1700, color: 0xff8c00 },
      // Oncoming southbound car
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 500, speed: 100, startAtMs: 0, color: 0xcc2222 },
    ],
    evaluation: { allowedManeuvers: ['left'] },
    feedback: {
      explanation: {
        'zh-TW': '前車左轉係因為燈係青，跟住轉係正確。但重點係：永遠要自己確認信號，唔好盲目跟前車——如果前車衝燈，你跟住衝就係你犯規。呢次燈係青，跟轉係啱；下次燈未必係青。',
        ja: '前の車が左折しているのは青信号だから。今回はついていくのが正解ですが、大切なのは自分で信号を確認すること。前の車が信号無視をしても、自分が従えば自分の違反になります。',
      },
      lawArticle: '道路交通法第7条・第34条',
      commonMistake: {
        'zh-TW': '盲目跟前車，唔睇信號自己係咩色——下次前車衝紅燈你唔係跟住嘛。',
        ja: '信号を確認せず前の車についていくと、信号無視の車に従って自分が違反することがあります。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 4 — Lead car rushes yellow, you should stop
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'lead-yellow-stop',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '前車衝黃燈——你跟唔跟？', ja: '前車が黄信号で突入——あなたは？' },
    instruction: { 'zh-TW': '直行（黃燈停得到就停，唔好跟前車衝）', ja: '直進（黄で止まれるなら止まる・前車に従わない）' },
    difficulty: 2,
    maneuver: 'straight',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    lightChanges: [
      { atMs: 1200, state: { type: 'standard', color: 'yellow' } },
      { atMs: 2500, state: { type: 'standard', color: 'red' } },
      { atMs: 6000, state: { type: 'standard', color: 'green' } },
    ],
    npcs: [
      // Fast lead car that rushes through yellow
      { id: 'lead1', type: 'vehicle', variant: 'car', startX: NB_X, startY: 680, endX: NB_X, endY: -100, speed: 145, startAtMs: 1700, color: 0xff4444 },
      // Cross car left→right during red phase (after player should stop)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 4500, color: 0x44bb55 },
      // Cross car right→left during red
      { id: 'cross2', type: 'vehicle', variant: 'kei', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 120, startAtMs: 3800, color: 0xffc107 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['straight'] },
    feedback: {
      explanation: {
        'zh-TW': '唔好跟前車衝黃燈！前車係因為佢已經太近煞唔切先衝；你喺後面，仲有距離，停得到就一定要停。黃燈唔係「快啲過」嘅信號，係「準備停車」嘅警告。',
        ja: '前の車が黄信号で進んだのは、すでに停止線に近すぎて止まれなかったから。あなたはまだ距離があるので止まれます。黄信号は「急いで通過」ではなく「停止の準備」です。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '以為跟住前車衝就冇問題——實際上你自己都要為自己嘅決定負責。',
        ja: '前の車についていけば大丈夫と思いがちですが、自分の行動は自分で判断・責任を持つ必要があります。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 5 — Crossroad left turn with pedestrian on crossing
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cross-left-ped',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '十字路口左轉——讓行人', ja: '十字路の左折——歩行者優先' },
    instruction: { 'zh-TW': '左轉（轉入路口有行人，停低讓佢先過）', ja: '左折（横断歩行者を先に通す）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Pedestrian crossing left→right (absolute startAtMs=2400)
      { id: 'ped1', type: 'pedestrian', startX: PED_L, startY: PED_Y, endX: PED_R, endY: PED_Y, speed: 46, startAtMs: 2400, color: 0xffd54f },
      // Cross car right→left
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 140, startAtMs: 0, color: 0x44bb55 },
      // Oncoming southbound car
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 500, speed: 100, startAtMs: 0, color: 0xcc2222 },
    ],
    evaluation: { allowedManeuvers: ['left'], yieldToPedestrians: true },
    feedback: {
      explanation: {
        'zh-TW': '即使係青燈，左轉時轉入嘅橫行道有行人正過馬路，就必須停車讓行人先過。行人喺橫行道享有絕對優先，轉彎車要特別小心車身左後方嘅死角。',
        ja: '青信号でも、左折先の横断歩道に歩行者がいれば停止して先に通します。横断歩道の歩行者は絶対優先。左後方の死角に注意します。',
      },
      lawArticle: '道路交通法第38条',
      commonMistake: {
        'zh-TW': '只顧住打軚轉彎，冇望清楚轉入方向有冇行人。',
        ja: 'ハンドル操作に気を取られ、左折先の歩行者を見落とすミスが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 6 — Arrow signal: red + right arrow only
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'arrow-right-only',
    category: 'arrow',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '紅燈＋右箭頭——只可右轉', ja: '赤信号＋右矢印——右折のみ' },
    instruction: { 'zh-TW': '右轉（主燈紅但右箭頭亮起，只可右轉）', ja: '右折（赤でも右矢印が点灯・右折のみ可）' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
    npcs: [
      // Oncoming southbound car
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 500, speed: 100, startAtMs: 0, color: 0xcc2222 },
      // Cross car left→right
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 800, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '主燈紅色但綠色右箭頭亮起時，只可以朝箭頭方向（右）行駛，唔可以直行或左轉。箭頭信號凌駕主燈，只准箭頭嗰個方向。',
        ja: '主信号が赤でも緑の右矢印が点灯していれば、矢印の方向（右）にのみ進めます。矢印信号は主信号に優先し、矢印の方向以外へは進めません。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '見有綠箭頭就當綠燈直行，其實淨係准右轉。',
        ja: '矢印が出ているからと直進すると違反です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 7 — Flashing red at T-junction: full stop then yield, then right
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'flash-red-right',
    category: 'flashing',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '紅色閃爍——停定再右轉', ja: '赤色点滅——一時停止して右折' },
    instruction: { 'zh-TW': '右轉（紅閃要完全停低，讓橫向車先過）', ja: '右折（赤点滅は一時停止し横の車を優先）' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 30,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'flashing', color: 'red' },
    npcs: [
      // Cross car left→right (fast, arrives while player should stop)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 165, startAtMs: 1400, color: 0xe69a2e },
      // Scooter cross right→left (arrives after gap)
      { id: 'cross2', type: 'vehicle', variant: 'scooter', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 120, startAtMs: 3200, color: 0x4caf50 },
    ],
    evaluation: { mustStop: true, allowedManeuvers: ['right'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '紅色閃爍燈＝一時停止：必須完全停車，確認左右安全，等橫向優先車過晒先可以右轉。淨係慢落唔算停，係日本最常被取締嘅違規之一。',
        ja: '赤色点滅は一時停止。必ず完全に停止し、左右の安全を確認、横の優先車が通過してから右折します。徐行だけでは不十分で、取り締まりの多い違反です。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '以為慢慢碌過去就得，結果未停穩就轉，同橫向車爭路。',
        ja: '徐行で済ませて横の車と交錯するのが典型的なミスです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 8 — 止まれ stop sign, crossroad, turn left
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'stop-sign-left',
    category: 'priority',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '「止まれ」停車再左轉', ja: '「止まれ」一時停止して左折' },
    instruction: { 'zh-TW': '左轉（見「止まれ」要完全停車，再左轉）', ja: '左折（「止まれ」で完全停止してから左折）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 30,
    stopSign: true,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: null,
    npcs: [
      // Truck crossing right→left (priority road)
      { id: 'cross1', type: 'vehicle', variant: 'truck', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 150, startAtMs: 1500, color: 0x78909c },
      // Car crossing left→right
      { id: 'cross2', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 3000, color: 0x44bb55 },
      // Scooter behind player
    ],
    evaluation: { mustStop: true, allowedManeuvers: ['left'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '紅色三角「止まれ」標誌：必須喺停止線前完全停定，輪胎完全靜止，望清楚橫向有冇車，先可以左轉出去。日本警察喺呢啲位最常抄牌，租車新手最易中招。',
        ja: '赤い三角の「止まれ」標識では、停止線手前でタイヤが完全に止まるまで停止し、横の交通を確認してから左折します。レンタカーの一時不停止は最多の取り締まり対象です。',
      },
      lawArticle: '道路交通法第43条',
      commonMistake: {
        'zh-TW': '「慢慢碌過去」唔算停車，一定要完全停定先合法。',
        ja: '徐行して通過は違反。完全停止が必要です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 9 — Narrow Okinawa road, yield to oncoming car
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'narrow-yield',
    category: 'priority',
    roadType: 'straight',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '窄路會車——靠左慢行', ja: '狭い道での離合——左に寄って徐行' },
    instruction: { 'zh-TW': '直行（窄路會車，靠左慢行唔好越界）', ja: '直進（左に寄り徐行・はみ出さない）' },
    difficulty: 2,
    maneuver: 'straight',
    speedLimit: 30,
    narrowRoad: true,
    trafficDensity: 'normal',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      // Oncoming kei car (close, approaching quickly)
      { id: 'oncoming1', type: 'vehicle', variant: 'kei', startX: SB_X, startY: 100, endX: SB_X, endY: 1040, speed: 90, startAtMs: 600, color: 0xcc5522 },
      // Scooter behind player
      // Distant oncoming car (slower, second encounter)
      { id: 'oncoming2', type: 'vehicle', variant: 'car', startX: SB_X, startY: 100, endX: SB_X, endY: 1040, speed: 60, startAtMs: 3000, color: 0x2255cc },
    ],
    evaluation: { yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '那霸同離島好多窄到得一架車闊嘅路（狭い道）。會車時要減速、靠左，必要時喺有位嘅地方停低等對向車先過，唔好硬闖卡死。',
        ja: '那覇や離島には車1台分しかない狭い道が多くあります。離合時は減速して左に寄り、必要なら退避スペースで停止して対向車を先に通します。',
      },
      lawArticle: '道路交通法第18条・第27条',
      commonMistake: {
        'zh-TW': '硬住頭爭路，結果兩車卡死或者刮花，自駕最常見麻煩。',
        ja: '無理に進んで離合できず立ち往生・接触するのが典型的なトラブルです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 10 — School zone T-junction, left turn, child pedestrian
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'school-zone-left',
    category: 'speed',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '學校區左轉——時速30讓細路', ja: 'スクールゾーンの左折——30km/h・子供優先' },
    instruction: { 'zh-TW': '左轉（學校區減到30以下，讓細路）', ja: '左折（スクールゾーンは30以下・子供を先に通す）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 30,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Child pedestrian crossing right→left (startAtMs absolute)
      { id: 'child1', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 48, startAtMs: 2600, color: 0xff7043 },
      // Scooter behind player
      // Car crossing left→right
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 90, startAtMs: 0, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['left'], yieldToPedestrians: true },
    feedback: {
      explanation: {
        'zh-TW': '「通学路」（學校區）限速通常30km/h，上下課時間細路會突然衝出。左轉前就要減到30以下，控制速度同煞車距離，見到細路過馬路一定要停定讓佢。',
        ja: 'スクールゾーン（通学路）の制限速度は多くが30km/h。登下校時間は子供が飛び出します。左折前から30以下に減速し、子供が渡るときは必ず停止して譲ります。',
      },
      lawArticle: '道路交通法第22条・第38条',
      commonMistake: {
        'zh-TW': '習慣咗踩50，喺學校區轉彎太快，細路一衝出就煞唔切。',
        ja: '50km/hの感覚で曲がると速すぎ、子供の飛び出しに対応できません。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 11 — One-way street, only right turn is legal
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'oneway-right',
    category: 'oneway',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '一方通行——只可右轉', ja: '一方通行——右折のみ可' },
    instruction: { 'zh-TW': '前方一方通行，只可右轉', ja: '前方は一方通行、右折のみ可' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 30,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: null,
    npcs: [
      // Main road car right→left (one-way traffic flow)
      { id: 'main1', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 130, startAtMs: 800, color: 0x2255cc },
      // Another main road car right→left
      { id: 'main2', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 120, startAtMs: 2600, color: 0x44bb55 },
      // Scooter behind player
    ],
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '一方通行（單行路）只可以朝指定方向行駛。呢條橫街只准右入，左邊係逆向，駛入即屬嚴重違規。那霸舊市區好多單行路，要睇清楚藍色箭頭路牌。',
        ja: '一方通行は指定方向にのみ進めます。この道は右方向のみ可、左は逆走で重大な違反です。那覇の旧市街は一方通行が多く、青い矢印標識を確認しましょう。',
      },
      lawArticle: '道路交通法第8条',
      commonMistake: {
        'zh-TW': '見路通就以為兩邊都行得，逆入一方通行非常危險。',
        ja: '通れそうだからと逆走するのは非常に危険です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 12 — Rush hour congestion at crossroad, red → green
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rush-hour-jam',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '繁忙時間塞車——等青燈才走', ja: '朝のラッシュアワー——青になってから' },
    instruction: { 'zh-TW': '直行（好多車，但仍係等青燈先走）', ja: '直進（混雑時も青になるまで待つ）' },
    difficulty: 2,
    maneuver: 'straight',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'urban',
    timeLimitMs: 45000,
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 4200, state: { type: 'standard', color: 'green' } }],
    npcs: [
      // Cross car left→right during red phase
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 300, color: 0x44bb55 },
      // Cross car right→left during red phase
      { id: 'cross2', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 120, startAtMs: 2000, color: 0xffc107 },
      // Oncoming slow car starts after green (absolute t=1700+4200=5900)
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: 300, endX: SB_X, endY: 1050, speed: 55, startAtMs: 5900, color: 0xcc2222 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['straight'] },
    feedback: {
      explanation: {
        'zh-TW': '朝早繁忙時間，四面八方都係車。紅燈就算係塞車都要停，唔可以因為旁邊有車就心急。等青燈後，跟住前車慢慢行，唔好搶路。沖繩市區繁忙時段尤其常見塞車。',
        ja: '朝のラッシュアワーは車が四方から来ます。渋滞していても赤信号は守ること。青になったら前の車に続いてゆっくり進みます。沖縄市内の朝夕は特に渋滞が激しいです。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '周圍嘈雜、車多，心急跟住前車衝燈。記住：塞車唔係衝燈嘅理由。',
        ja: '混雑してイライラし、前の車について信号無視をしがちです。渋滞は信号を無視する理由になりません。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 13 — Small road merges onto busy main road (side-road merge)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'side-road-merge',
    category: 'priority',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '由小路出大路——讓主路車', ja: '細い道から幹線道路へ——本線車を優先' },
    instruction: { 'zh-TW': '左轉（小路出大路，停定讓主路車先過）', ja: '左折（細道から幹線へ・止まれで本線車を優先）' },
    difficulty: 3,
    maneuver: 'left',
    speedLimit: 30,
    stopSign: true,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    timeLimitMs: 40000,
    light: null,
    npcs: [
      // Main road car 1 left→right (fast)
      { id: 'main1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 155, startAtMs: 200, color: 0xcc2222 },
      // Main road car 2 right→left (fast)
      { id: 'main2', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 140, startAtMs: 1600, color: 0x44bb55 },
      // Main road car 3 left→right (fast)
      { id: 'main3', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 150, startAtMs: 3100, color: 0x2255cc },
      // Scooter behind player in side road
    ],
    evaluation: { mustStop: true, allowedManeuvers: ['left'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '由細路轉入大路係沖繩自駕最危險嘅情況之一。主路車速度快，而且你嘅視野有限。止まれ標誌要完全停定，慢慢探頭確認兩邊，等到主路冇車先可以安全左轉入去。',
        ja: '細い道から幹線道路への合流は沖縄自駕で最も危険な場面の一つ。本線車は速く、視野も限られています。「止まれ」で完全停止し、両方向を確認してから安全な間隔ができたら左折します。',
      },
      lawArticle: '道路交通法第36条・第43条',
      commonMistake: {
        'zh-TW': '只係慢慢碌出去，冇完全停定，睇漏快嚟嘅主路車。主路車永遠有先行權。',
        ja: '完全停止せず徐行で出てしまい、速い本線車を見落とすのが典型的です。本線車は常に優先です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 14 — Crossroad right turn, yield to oncoming (busy)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cross-right-yield',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '右轉讓對向直行車', ja: '右折は対向直進車を優先' },
    instruction: { 'zh-TW': '右轉（讓對向直行車先過再轉）', ja: '右折（対向直進車を先に通す）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Oncoming car (fast, priority)
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 420, endX: SB_X, endY: CY + 420, speed: 150, startAtMs: 600, color: 0xcc2222 },
      // Cross car left→right (arrives after player should have cleared)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 120, startAtMs: 3500, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['right'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '即使青燈，右轉都要讓對向直行車先行。日本靠左行駛，右轉會橫過對向車道，所以要喺路口中央等到對向直行車過晒先可以轉。',
        ja: '青信号でも右折車は対向直進車に進路を譲ります。左側通行のため右折は対向車線を横切るので、交差点中央で待ってから曲がります。',
      },
      lawArticle: '道路交通法第37条',
      commonMistake: {
        'zh-TW': '見青燈就以為自己有先行權，搶住右轉撞對向直行車。',
        ja: '青信号で優先と思い込み、無理に右折して対向車と衝突するケースが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 15 — Tourist area crossroad: right turn, oncoming + pedestrian
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tourist-cross-ped',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '觀光區路口——右轉多障礙', ja: '観光地の交差点——右折で複数の危険' },
    instruction: { 'zh-TW': '右轉（同時留意行人同對向車）', ja: '右折（歩行者と対向車を同時に確認）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Oncoming taxi
      { id: 'oncoming1', type: 'vehicle', variant: 'taxi', startX: SB_X, startY: CY - 440, endX: SB_X, endY: CY + 420, speed: 140, startAtMs: 500, color: 0xffc107 },
      // Pedestrian right→left after oncoming clears (startAtMs absolute=3200)
      { id: 'ped1', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 38, startAtMs: 3200, color: 0xffd54f },
      // Scooter crossing left→right (late, after player turns)
      { id: 'cross1', type: 'vehicle', variant: 'scooter', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 90, startAtMs: 4500, color: 0x9c27b0 },
    ],
    evaluation: { allowedManeuvers: ['right'], yieldToVehicles: true, yieldToPedestrians: true },
    feedback: {
      explanation: {
        'zh-TW': '國際通、美國村一帶人車都多。右轉時要先讓對向直行車，轉入後又要讓橫行道嘅行人——兩個危險要同時兼顧，唔可以淨係盯住一邊。慢落、分段觀察先安全。',
        ja: '国際通りやアメリカンビレッジ周辺は人も車も多いです。右折では対向直進車を先に通し、曲がった先の横断歩行者にも譲ります。片方だけ見ず、減速して段階的に確認します。',
      },
      lawArticle: '道路交通法第37条・第38条',
      commonMistake: {
        'zh-TW': '只顧讓對向車，轉入後撞到正過馬路嘅行人。',
        ja: '対向車だけ気にして、曲がった先の歩行者を見落とすミスが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 16 — Right turn with two oncoming cars in sequence
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'right-two-oncoming',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '右轉——等兩輛對向車', ja: '右折——2台の対向車を待つ' },
    instruction: { 'zh-TW': '右轉（等兩輛對向車都過晒先轉）', ja: '右折（2台の対向車が過ぎてから）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // First oncoming car (fast)
      { id: 'opp1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 400, speed: 160, startAtMs: 0, color: 0xcc2222 },
      // Second oncoming car follows close behind
      { id: 'opp2', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 460, endX: SB_X, endY: CY + 420, speed: 130, startAtMs: 2400, color: 0x2255cc },
    ],
    evaluation: { allowedManeuvers: ['right'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '右轉時必須讓所有對向直行車先過，包括跟住嚟嘅第二輛。讓咗第一輛就以為安全立即搶轉，係右轉意外最常見嘅原因。要等到真係冇車先轉。',
        ja: '右折時は対向直進車が全て通過するまで待ちます。1台目が過ぎて安心して右折し、2台目と衝突するのが右折事故の典型例です。',
      },
      lawArticle: '道路交通法第37条',
      commonMistake: {
        'zh-TW': '讓第一輛過後即刻轉，忽略緊跟住嘅第二輛。',
        ja: '1台目の直後に発進し、2台目を見落とすケースが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 17 — Dilemma zone: green→yellow on approach, right turn
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cross-yellow-dilemma',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '黃燈抉擇——右轉', ja: '黄信号のジレンマ——右折' },
    instruction: { 'zh-TW': '右轉（燈會變黃變紅，停得到就停）', ja: '右折（黄→赤に変化・止まれるなら止まる）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    lightChanges: [
      { atMs: 2600, state: { type: 'standard', color: 'yellow' } },
      { atMs: 4200, state: { type: 'standard', color: 'red' } },
      { atMs: 8500, state: { type: 'standard', color: 'green' } },
    ],
    npcs: [
      // Cross car left→right (arrives during red)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 4500, color: 0x44bb55 },
      // Cross car right→left (arrives during red)
      { id: 'cross2', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 120, startAtMs: 5200, color: 0xffc107 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '青燈接近時突然轉黃，係考驗判斷嘅「抉擇區」：如果你仲未過停止線而又煞得到，就要停低等下一個青燈；只有當你已經太近、急煞反而危險先可以繼續。黃燈唔係「加速衝」嘅信號。',
        ja: '青信号が黄に変わる「ジレンマゾーン」。停止線手前で安全に止まれるなら停止し、次の青を待ちます。すでに近すぎて急停止が危険な場合のみ通過。黄信号は「急いで通過」の合図ではありません。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '一見黃燈就加速搶過，停止線前明明煞得切都唔停。',
        ja: '黄信号で加速して突っ込む。止まれるのに止まらないのが違反です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 18 — Busy crossroad left turn: red → green, then yield to ped
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'busy-cross-left',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '繁忙路口左轉——多重危險', ja: '繁忙交差点の左折——複数の危険' },
    instruction: { 'zh-TW': '左轉（等青燈，仲要讓行人）', ja: '左折（青を待ち、さらに歩行者を優先）' },
    difficulty: 3,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 3600, state: { type: 'standard', color: 'green' } }],
    npcs: [
      // Truck crossing left→right during red phase
      { id: 'cross1', type: 'vehicle', variant: 'truck', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 150, startAtMs: 600, color: 0x78909c },
      // Car crossing left→right during red phase
      { id: 'cross2', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 2000, color: 0x44bb55 },
      // Pedestrian left→right starts 600ms after green (absolute: 1700+3600+600=5900ms)
      { id: 'ped1', type: 'pedestrian', startX: PED_L, startY: PED_Y, endX: PED_R, endY: PED_Y, speed: 40, startAtMs: 5900, color: 0xffd54f },
      // Oncoming slow car starts after green
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: 300, endX: SB_X, endY: 1050, speed: 80, startAtMs: 5700, color: 0xcc2222 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['left'], yieldToPedestrians: true },
    feedback: {
      explanation: {
        'zh-TW': '繁忙路口要分階段處理：先等紅燈轉青，起步左轉時又要讓緊過馬路嘅行人，同時留意橫向車流。一次只專注一個危險、逐個clear，唔好心急一次過搶晒。',
        ja: '繁忙な交差点は段階的に。まず赤から青を待ち、左折時は横断中の歩行者を優先し、横の車にも注意します。危険を一つずつ処理し、焦って一気に進まないこと。',
      },
      lawArticle: '道路交通法第7条・第38条',
      commonMistake: {
        'zh-TW': '燈一青就急住起步轉，撞到仲未過完馬路嘅行人。',
        ja: '青になった瞬間に発進し、横断中の歩行者と接触するミスが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 19 — Carpark / convenience store exit: stop, yield, turn left
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'parking-exit-left',
    category: 'priority',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '停車場出口——停定再左轉', ja: '駐車場出口——停止して左折' },
    instruction: { 'zh-TW': '左轉（出口先停定，讓主路車先過）', ja: '左折（出口で停止・本線車を優先）' },
    difficulty: 3,
    maneuver: 'left',
    speedLimit: 30,
    stopSign: true,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      // Main road car right→left (fast)
      { id: 'main1', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 160, startAtMs: 1300, color: 0x2255cc },
      // Main road car left→right
      { id: 'main2', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 145, startAtMs: 2800, color: 0xcc2222 },
      // Scooter right→left (fast, narrower)
      { id: 'main3', type: 'vehicle', variant: 'scooter', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 100, startAtMs: 4200, color: 0x44bb55 },
      // Scooter behind player in the carpark
    ],
    evaluation: { mustStop: true, allowedManeuvers: ['left'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '便利店、油站、景點停車場出口好多都好窄，而且主路車速比你估計快好多。見「止まれ」要完全停定，望右、望左、再望右，確認主路冇車先左轉出街。',
        ja: 'コンビニ・ガソリンスタンド・観光地駐車場の出口は狭く、本線車は思ったより速いです。「止まれ」で完全停止し、右・左・右を確認してから左折します。',
      },
      lawArticle: '道路交通法第36条・第43条',
      commonMistake: {
        'zh-TW': '只係慢慢碌出去，望漏右邊嚟車；租車新手好容易喺出口位出事。',
        ja: '徐行だけで出てしまい、右から来る車を見落とすのが典型的です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 20 — Rain, right turn with oncoming + pedestrian
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rain-right-turn',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '雨天右轉——提早收油', ja: '雨天の右折——早めに減速' },
    instruction: { 'zh-TW': '右轉（落雨路滑，提早煞車讓對向車）', ja: '右折（雨で滑る・早めに減速し対向車を優先）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 40,
    weather: 'rain',
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Oncoming car (priority)
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 440, endX: SB_X, endY: CY + 420, speed: 150, startAtMs: 700, color: 0xaa3333 },
      // Pedestrian right→left in rain (slow)
      { id: 'ped1', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 34, startAtMs: 3400, color: 0x80deea },
      // Cross car left→right (late, after turn)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 80, startAtMs: 5000, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['right'], yieldToVehicles: true, yieldToPedestrians: true },
    feedback: {
      explanation: {
        'zh-TW': '沖繩成日驟雨，濕滑路面煞車距離會長好多，抓地力又差。右轉前要提早收油、提早輕煞，留多啲時間讓對向車同行人，唔好等到最後一刻先死踩。',
        ja: '沖縄は急な雨が多く、濡れた路面では制動距離が伸びグリップも落ちます。右折前は早めにアクセルを戻して早めにブレーキし、対向車・歩行者に余裕を持って譲ります。',
      },
      lawArticle: '道路交通法第37条・第70条',
      commonMistake: {
        'zh-TW': '當乾地咁踩，落雨先發現煞唔切，尤其轉彎讓緊行人嗰陣。',
        ja: '乾いた路面の感覚で運転し、雨天の右折で止まりきれないのが典型例です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 21 — Bus lane: keep right, no driving in bus-only lane
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bus-lane-right',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '巴士專用線——唔好行錯線', ja: 'バス専用レーン——侵入禁止' },
    instruction: { 'zh-TW': '右轉（靠右行，唔好入藍色巴士專用線）', ja: '右折（右車線を走る・青いバス専用レーンに入らない）' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 40,
    busLane: true,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      // Oncoming car
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 500, speed: 100, startAtMs: 0, color: 0xcc2222 },
      // Cross car right→left
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 130, startAtMs: 1000, color: 0x44bb55 },
    ],
    evaluation: { allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '藍色「バス専用」車道喺規定時間內（通常平日早晚繁忙時段）只准巴士使用，其他車輛係違規。要靠右行走正常車道，唔好入左邊嘅巴士專用線。那霸市內有幾條路係有巴士專用線嘅。',
        ja: '青い「バス専用」レーンは規定時間内（通常平日の朝夕ラッシュ時）はバスのみ通行可。他の車両は違反です。右側の一般車線を走り、左のバス専用レーンに入らないようにします。那覇市内にも数路線あります。',
      },
      lawArticle: '道路交通法第20条の2',
      commonMistake: {
        'zh-TW': '唔知道藍色係巴士專用，當普通行車線咁行入去。',
        ja: '青いラインをただの車線と思い込んで走行してしまうケースが多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 22 — ETC toll gate + expressway merge
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'etc-merge',
    category: 'standard',
    roadType: 'highway',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': 'ETC收費站＋合流', ja: 'ETC料金所＋合流' },
    instruction: { 'zh-TW': '直行（ETC閘口減到20以下，再加速合流）', ja: '直進（ETCは20以下に減速→加速して合流）' },
    difficulty: 3,
    maneuver: 'straight',
    speedLimit: 80,
    tollGate: true,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      // Highway car 1 southbound (oncoming carriageway)
      { id: 'main1', type: 'vehicle', variant: 'car', startX: HWY_SB_X, startY: 80, endX: HWY_SB_X, endY: 1050, speed: 150, startAtMs: 800, color: 0x4455ff },
      // Highway truck 2 southbound
      { id: 'main2', type: 'vehicle', variant: 'truck', startX: HWY_SB_X, startY: 80, endX: HWY_SB_X, endY: 1050, speed: 150, startAtMs: 3200, color: 0xff5544 },
      // Highway car 3 southbound (third NPC)
      { id: 'main3', type: 'vehicle', variant: 'car', startX: HWY_SB_X, startY: 80, endX: HWY_SB_X, endY: 1050, speed: 140, startAtMs: 5500, color: 0x44bb55 },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '上沖繩自動車道要經收費站：ETC車道唔使停但要減到20km/h以下俾閘門開（太快會撞桿）；冇ETC就行「一般」車道攞票／俾現金。過閘後喺加速車道加速到接近本線車速，望後鏡睇空檔先順暢合流。',
        ja: '沖縄自動車道の料金所：ETCレーンは止まらないが20km/h以下に減速（速すぎるとバーに衝突）。ETCが無ければ「一般」レーンで発券・現金。通過後は加速車線で本線速度近くまで加速し、後方を確認して合流します。',
      },
      lawArticle: '道路交通法第75条の4・道路整備特別措置法',
      commonMistake: {
        'zh-TW': '高速衝過ETC閘門撞桿，或者合流時唔加速、停喺加速車道度等，好危險。',
        ja: 'ETCを高速で通過してバーに衝突、または加速せず合流車線で止まるのは危険です。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 23 — Okinawa Expressway: hold lane at 80 km/h limit
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'highway-express',
    category: 'standard',
    roadType: 'highway',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '沖繩自動車道——保持車道', ja: '沖縄自動車道——車線を守れ' },
    instruction: { 'zh-TW': '高速直行（限速80，保持車道）', ja: '高速直進（80km/h・車線を維持）' },
    difficulty: 3,
    maneuver: 'straight',
    speedLimit: 80,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      // Highway truck 1 (oncoming carriageway)
      { id: 'hwy1', type: 'vehicle', variant: 'truck', startX: HWY_SB_X, startY: 100, endX: HWY_SB_X, endY: 1050, speed: 140, startAtMs: 0, color: 0xff5544 },
      // Highway car 2
      { id: 'hwy2', type: 'vehicle', variant: 'car', startX: HWY_SB_X, startY: 100, endX: HWY_SB_X, endY: 1050, speed: 140, startAtMs: 2000, color: 0x4455ff },
      // Highway kei car 3
      { id: 'hwy3', type: 'vehicle', variant: 'kei', startX: HWY_SB_X, startY: 100, endX: HWY_SB_X, endY: 1050, speed: 120, startAtMs: 4000, color: 0x44bb55 },
    ],
    evaluation: {},
    feedback: {
      explanation: {
        'zh-TW': '沖繩自動車道（許田～那霸）最高限速80 km/h、最低50 km/h，係日本少數限速80嘅高速。要保持車道、收費站用ETC或現金，唔可以喺路肩停車（緊急除外）。',
        ja: '沖縄自動車道は最高速度80km/h・最低50km/h。車線を守り、料金所はETCか現金、路肩への駐停車は緊急時以外禁止です。',
      },
      lawArticle: '道路交通法第75条の4・高速自動車国道法',
      commonMistake: {
        'zh-TW': '以為日本高速一律100，喺沖繩踩100就超速；又或者過度扭軚衝出車道。',
        ja: '日本の高速は一律100と思い込み超過しがち。過剰なハンドル操作で車線を外す事故も多いです。',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 24 — Peak hour crossroad straight, long red with multiple cycles
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'peak-hour-cross-straight',
    category: 'standard',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '晚繁忙時間——耐心等候', ja: '夕方ラッシュ——信号を守って待機' },
    instruction: { 'zh-TW': '直行（晚繁忙時間，長紅燈，等青燈先走）', ja: '直進（夕方ラッシュ・長い赤信号・青まで待つ）' },
    difficulty: 3,
    maneuver: 'straight',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    timeLimitMs: 50000,
    light: { type: 'standard', color: 'red' },
    lightChanges: [
      { atMs: 5000, state: { type: 'standard', color: 'green' } },
      { atMs: 9000, state: { type: 'standard', color: 'yellow' } },
      { atMs: 10500, state: { type: 'standard', color: 'red' } },
      { atMs: 14000, state: { type: 'standard', color: 'green' } },
    ],
    npcs: [
      // Cross car left→right (during red, early)
      { id: 'cross1', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 130, startAtMs: 300, color: 0x44bb55 },
      // Cross car left→right (during red, second wave)
      { id: 'cross2', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 120, startAtMs: 2100, color: 0x9c27b0 },
      // Cross car right→left (during red)
      { id: 'cross3', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 140, startAtMs: 1200, color: 0xffc107 },
      // Oncoming slow car starts after first green (absolute: 1700+5000=6700ms)
      { id: 'oncoming1', type: 'vehicle', variant: 'car', startX: SB_X, startY: 300, endX: SB_X, endY: 1050, speed: 55, startAtMs: 6700, color: 0xcc2222 },
    ],
    evaluation: { waitForGo: true, allowedManeuvers: ['straight'] },
    feedback: {
      explanation: {
        'zh-TW': '傍晚繁忙時間，交叉路口四面八方都係車，紅燈係好長。就算旁邊有車、後面有車催，都要堅持等青燈。有時候第一個青燈會太短，要等下一個。保持冷靜係安全駕駛嘅關鍵。',
        ja: '夕方のラッシュアワーは四方向すべてから車が来て、赤信号が長くなります。周りの車やクラクションに焦らされても、青信号まで落ち着いて待ちましょう。1回目の青が短い場合もあります。冷静さが安全運転の鍵です。',
      },
      lawArticle: '道路交通法第7条',
      commonMistake: {
        'zh-TW': '長時間等待心煩，見有人衝燈就跟住，或者黃燈未轉青就起步。',
        ja: '長く待ってイライラし、他の車の信号無視について行ったり、黄信号で発進してしまうのが典型的なミスです。',
      },
    },
  },
]
