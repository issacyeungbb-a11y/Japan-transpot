import type { Scenario } from '../types'

// Mirrors ScenarioScene world geometry (CX=400, CY=520, WORLD_HEIGHT=1000).
const CX = 400
const CY = 520
const INT = 80
const ROAD_W = 80

const SB_X    = CX + 20            // 420 — oncoming (southbound) lane
const CROSS_Y = CY + 4             // 524 — crossing traffic near the intersection centre
const PED_Y   = CY + INT / 2 + 48  // 608 — pedestrian crosswalk on the south approach
const HWY_SB_X = CX + 40           // 440 — expressway oncoming carriageway

// Pedestrian crossing the south crosswalk, left→right and right→left.
const PED_L = CX - ROAD_W / 2 - 12 // 348
const PED_R = CX + ROAD_W / 2 + 12 // 452

// The scenario set is deliberately TURN-HEAVY and road-VARIED: T-junctions,
// crossroads with left/right turns, a narrow back street, and the expressway.
// There are no plain "drive straight through a crossroad" levels — every city
// junction asks the driver to actually steer through a turn, judge right-of-way,
// react to changing signals, and read a busier traffic scene.
export const drivingScenarios: Scenario[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1 — Fundamentals taught through turns (study + normal + challenge)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1) T-junction left turn — the first turn, settle into left-hand traffic
  {
    id: 't-left-basic',
    category: 'standard',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': 'T字路左轉——保持靠左', ja: 'T字路の左折——左側通行' },
    instruction: { 'zh-TW': '左轉（前方掂頭路，靠左轉入左邊）', ja: '左折（突き当りを左へ・左側を維持）' },
    difficulty: 1,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    evaluation: { allowedManeuvers: ['left'] },
    feedback: {
      explanation: {
        'zh-TW': '日本好多細路係T字（丁字）路口，唔可以直行，只可以左轉或右轉。左轉時收油、靠左、轉入最近嘅左側車道，唔好扭太大蕩去對面。呢個係租車自駕最基本嘅轉彎練習。',
        ja: '日本にはT字路が多く、直進はできず左折か右折のみです。左折は減速して左に寄り、最も近い左側車線へ。大回りして対向車線に膨らまないようにします。',
      },
      lawArticle: '道路交通法第34条',
      commonMistake: {
        'zh-TW': '左轉時轉得太闊，車頭蕩咗去右邊對向車道，係香港／外地司機嘅常見錯誤。',
        ja: '左折で大回りして対向車線にはみ出すのが、海外ドライバーの典型的なミスです。',
      },
    },
  },

  // 2) T-junction right turn — wait for the light to go green, then turn
  {
    id: 't-right-redwait',
    category: 'standard',
    roadType: 't-junction',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': 'T字路右轉——等青燈', ja: 'T字路の右折——青を待つ' },
    instruction: { 'zh-TW': '右轉（紅燈先停定，轉青再右轉）', ja: '右折（赤で停止→青になってから右折）' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 40,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 3200, state: { type: 'standard', color: 'green' } }],
    evaluation: { waitForGo: true, allowedManeuvers: ['right'] },
    feedback: {
      explanation: {
        'zh-TW': '紅燈唔可以右轉，必須喺停止線前完全停定，等燈轉青（綠）先再轉。日本冇「紅燈可右轉」呢回事，同某啲地方唔同，新手要特別記住。',
        ja: '赤信号では右折できません。停止線の手前で完全に停止し、青になってから右折します。日本に「赤信号での右折可」はありません。',
      },
      lawArticle: '道路交通法第7条・第34条',
      commonMistake: {
        'zh-TW': '見冇車就趁紅燈右轉，喺日本係衝燈違規。',
        ja: '車がいないからと赤信号で右折するのは信号無視です。',
      },
    },
  },

  // 3) Crossroad left turn — yield to the pedestrian crossing your path
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
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      { id: 'ped', type: 'pedestrian', startX: PED_L, startY: PED_Y, endX: PED_R, endY: PED_Y, speed: 46, startAtMs: 2400, color: 0xffd54f },
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

  // 4) Red main + right arrow — only the arrow direction may go
  {
    id: 'arrow-right-only',
    category: 'arrow',
    roadType: 'cross',
    modes: ['study', 'normal', 'challenge'],
    title: { 'zh-TW': '紅燈＋右箭頭——只可右轉', ja: '赤信号＋右矢印——右折のみ' },
    instruction: { 'zh-TW': '右轉（主燈紅但右箭頭亮起）', ja: '右折（赤でも右矢印が点灯）' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
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

  // 5) Flashing red at a T-junction — full stop, then yield and turn right
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
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'flashing', color: 'red' },
    npcs: [
      { id: 'cross', type: 'vehicle', variant: 'car', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 165, startAtMs: 1400, color: 0xe69a2e },
    ],
    evaluation: { mustStop: true, allowedManeuvers: ['right'], yieldToVehicles: true },
    feedback: {
      explanation: {
        'zh-TW': '紅色閃爍燈＝一時停止：必須完全停車，確認左右安全，等橫向優先車過晒先可以右轉。淨係慢落唔算停，係日本最常被取締嘅違規之一。',
        ja: '赤色点滅は一時停止。必ず完全に停止し、左右の安全を確認、横の優先車が通過してから右折します。徐行だけでは不十分で、取り締まりの多い違反です。',
      },
      lawArticle: '道路交通法第7条・施行令第2条',
      commonMistake: {
        'zh-TW': '以為慢落就得，結果未停穩就轉，同橫向車爭路。',
        ja: '徐行で済ませて横の車と交錯するのが典型的なミスです。',
      },
    },
  },

  // 6) 止まれ stop sign — full stop, watch cross traffic, then turn left
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
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: null,
    npcs: [
      { id: 'cross', type: 'vehicle', variant: 'truck', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 150, startAtMs: 1500, color: 0x78909c },
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
  // TIER 2 — Busier roads, harder right-of-way (normal + challenge)
  // ═══════════════════════════════════════════════════════════════════════════

  // 7) Crossroad right turn — yield to oncoming straight traffic
  {
    id: 'cross-right-yield',
    category: 'standard',
    roadType: 'cross',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '右轉讓對向直行車', ja: '右折は対向直進車を優先' },
    instruction: { 'zh-TW': '右轉（讓對向直行車先過再轉）', ja: '右折（対向直進車を先に通す）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      { id: 'oncoming', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 420, endX: SB_X, endY: CY + 420, speed: 150, startAtMs: 600, color: 0xcc2222 },
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

  // 8) Narrow Okinawa back street — give way to the oncoming car
  {
    id: 'narrow-yield',
    category: 'priority',
    roadType: 'straight',
    modes: ['normal', 'challenge'],
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
      { id: 'oncoming', type: 'vehicle', variant: 'kei', startX: SB_X, startY: 120, endX: SB_X, endY: 1040, speed: 95, startAtMs: 600, color: 0xcc5522 },
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

  // 9) One-way street — only the legal turn direction is allowed
  {
    id: 'oneway-right',
    category: 'oneway',
    roadType: 't-junction',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '一方通行——只可右轉', ja: '一方通行——右折のみ可' },
    instruction: { 'zh-TW': '前方一方通行，只可右轉', ja: '前方は一方通行、右折のみ可' },
    difficulty: 2,
    maneuver: 'right',
    speedLimit: 30,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: null,
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

  // 10) Car-park / convenience-store exit — stop, look, then turn left into traffic
  {
    id: 'parking-exit-left',
    category: 'priority',
    roadType: 't-junction',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '停車場出口——停定再左轉', ja: '駐車場出口——停止して左折' },
    instruction: { 'zh-TW': '左轉（出口先停定，讓主路車先過）', ja: '左折（出口で停止・本線車を優先）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 30,
    stopSign: true,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      { id: 'main-road', type: 'vehicle', variant: 'car', startX: 860, startY: CROSS_Y, endX: -40, endY: CROSS_Y, speed: 160, startAtMs: 1300, color: 0x2255cc },
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

  // 11) Tourist-area junction — right turn with pedestrians AND oncoming traffic
  {
    id: 'tourist-cross-ped',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '觀光區路口——右轉多障礙', ja: '観光地の交差点——右折で複数の危険' },
    instruction: { 'zh-TW': '右轉（同時留意行人同對向車）', ja: '右折（歩行者と対向車を同時に確認）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      { id: 'oncoming', type: 'vehicle', variant: 'taxi', startX: SB_X, startY: CY - 440, endX: SB_X, endY: CY + 420, speed: 140, startAtMs: 500, color: 0xffc107 },
      { id: 'ped', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 38, startAtMs: 3200, color: 0xffd54f },
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

  // 12) School zone — slow to 30 and turn left as a child crosses
  {
    id: 'school-zone-left',
    category: 'speed',
    roadType: 't-junction',
    modes: ['normal', 'challenge'],
    title: { 'zh-TW': '學校區左轉——時速30', ja: 'スクールゾーンの左折——30km/h' },
    instruction: { 'zh-TW': '左轉（學校區減到30以下，讓細路）', ja: '左折（スクールゾーンは30以下・子供優先）' },
    difficulty: 2,
    maneuver: 'left',
    speedLimit: 30,
    trafficDensity: 'normal',
    roadComplexity: 'urban',
    light: { type: 'standard', color: 'green' },
    npcs: [
      { id: 'child', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 48, startAtMs: 2600, color: 0xff7043 },
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
  // TIER 3 — Busiest scenes, changing signals, the expressway (challenge only)
  // ═══════════════════════════════════════════════════════════════════════════

  // 13) Dilemma zone — the light goes green→yellow→red on your approach
  {
    id: 'cross-yellow-dilemma',
    category: 'standard',
    roadType: 'cross',
    modes: ['challenge'],
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

  // 14) Right turn — TWO oncoming vehicles in sequence, don't go on the gap
  {
    id: 'right-two-oncoming',
    category: 'standard',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '右轉——兩輛對向車', ja: '右折——2台の対向車' },
    instruction: { 'zh-TW': '右轉（等兩輛對向車都過晒先轉）', ja: '右折（2台の対向車が過ぎてから）' },
    difficulty: 3,
    maneuver: 'right',
    speedLimit: 50,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'green' },
    npcs: [
      { id: 'opp1', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 400, endX: SB_X, endY: CY + 400, speed: 160, startAtMs: 0, color: 0xcc2222 },
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

  // 15) Busy junction left turn — pedestrian + cross traffic + a signal that cycles
  {
    id: 'busy-cross-left',
    category: 'pedestrian',
    roadType: 'cross',
    modes: ['challenge'],
    title: { 'zh-TW': '繁忙路口左轉——多重危險', ja: '繁忙交差点の左折——複数の危険' },
    instruction: { 'zh-TW': '左轉（燈會轉紅，行人車流都要兼顧）', ja: '左折（信号が変化・歩行者と車に注意）' },
    difficulty: 3,
    maneuver: 'left',
    speedLimit: 40,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: { type: 'standard', color: 'red' },
    lightChanges: [{ atMs: 3600, state: { type: 'standard', color: 'green' } }],
    npcs: [
      { id: 'cross1', type: 'vehicle', variant: 'truck', startX: -40, startY: CROSS_Y, endX: 860, endY: CROSS_Y, speed: 150, startAtMs: 600, color: 0x78909c },
      { id: 'ped', type: 'pedestrian', startX: PED_L, startY: PED_Y, endX: PED_R, endY: PED_Y, speed: 40, startAtMs: 4200, color: 0xffd54f },
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

  // 16) Rain — right turn on a wet road, longer braking distance
  {
    id: 'rain-right-turn',
    category: 'standard',
    roadType: 'cross',
    modes: ['challenge'],
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
      { id: 'oncoming', type: 'vehicle', variant: 'car', startX: SB_X, startY: CY - 440, endX: SB_X, endY: CY + 420, speed: 150, startAtMs: 700, color: 0xaa3333 },
      { id: 'ped', type: 'pedestrian', startX: PED_R, startY: PED_Y, endX: PED_L, endY: PED_Y, speed: 34, startAtMs: 3400, color: 0x80deea },
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

  // 17) ETC toll gate + merge onto the Okinawa Expressway
  {
    id: 'etc-merge',
    category: 'standard',
    roadType: 'highway',
    modes: ['challenge'],
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
      { id: 'main1', type: 'vehicle', variant: 'car', startX: HWY_SB_X, startY: 80, endX: HWY_SB_X, endY: 1050, speed: 150, startAtMs: 800, color: 0x4455ff },
      { id: 'main2', type: 'vehicle', variant: 'truck', startX: HWY_SB_X, startY: 80, endX: HWY_SB_X, endY: 1050, speed: 150, startAtMs: 3200, color: 0xff5544 },
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

  // 18) Okinawa Expressway — hold your lane at the 80 km/h limit
  {
    id: 'highway-express',
    category: 'standard',
    roadType: 'highway',
    modes: ['challenge'],
    title: { 'zh-TW': '沖繩自動車道——保持車道', ja: '沖縄自動車道——車線を守れ' },
    instruction: { 'zh-TW': '高速直行（限速80，保持車道）', ja: '高速直進（80km/h・車線を維持）' },
    difficulty: 3,
    maneuver: 'straight',
    speedLimit: 80,
    trafficDensity: 'busy',
    roadComplexity: 'complex',
    light: null,
    npcs: [
      { id: 'hwy1', type: 'vehicle', variant: 'truck', startX: HWY_SB_X, startY: 100, endX: HWY_SB_X, endY: 1050, speed: 140, startAtMs: 0, color: 0xff5544 },
      { id: 'hwy2', type: 'vehicle', variant: 'car', startX: HWY_SB_X, startY: 100, endX: HWY_SB_X, endY: 1050, speed: 140, startAtMs: 2000, color: 0x4455ff },
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
]
