import type { Leg } from './types'
import { JUNCTION, PLAYER_T, ONCOMING_T } from './geometry'

// ─────────────────────────────────────────────────────────────────────────────
// 沖繩路試 — one continuous course, 17 examined events across 6 zones.
// NPC coords are LEG-LOCAL (s along the leg, t right of centreline).
// Cross traffic runs on the crossing road through the junction centre:
//   from the LEFT  (t −45 → +45) drives on lane s = centre − 1.75
//   from the RIGHT (t +45 → −45) drives on lane s = centre + 1.75
// delayMs is measured from EVENT ACTIVATION (player ~45 m before the line).
// NPCs are visible (parked at `from`) as soon as the event activates.
// ─────────────────────────────────────────────────────────────────────────────

const J = JUNCTION
const P = PLAYER_T   // -1.75
const O = ONCOMING_T // +1.75

export const COURSE: Leg[] = [

  // ══ ZONE 1 那霸市區 ══════════════════════════════════════════════════════

  // 1) Warm-up: straight through a green crossroad, feel the car, hold ≤50.
  {
    approach: 100, junction: 'cross', turn: 'straight',
    event: {
      id: 'warmup-green', zone: 'naha',
      title: { 'zh-TW': '起步——青燈直行', ja: 'スタート——青信号を直進' },
      gps: { 'zh-TW': '直行通過路口（限速50）', ja: '交差点を直進（制限速度50）' },
      light: { type: 'standard', color: 'green' },
      speedLimit: 50,
      npcs: [
        { id: 'onc1', kind: 'vehicle', variant: 'kei', from: { s: 100 + J + 60, t: O }, to: { s: -30, t: O }, speed: 11, delayMs: 0, color: 0x26a69a },
        { id: 'onc2', kind: 'vehicle', variant: 'car', from: { s: 100 + J + 95, t: O }, to: { s: -30, t: O }, speed: 12, delayMs: 2400, color: 0x8d6e63 },
      ],
      rules: { waitForGo: true },
      law: '道路交通法第22条',
      lesson: {
        'zh-TW': '起步先感受油門同煞車。沖繩市區大多限速40–50，儀錶要成日望住，超速喺日本罰則好重。',
        ja: 'まずはアクセルとブレーキの感覚を掴みましょう。沖縄市街地の制限速度は40〜50km/hが多く、超過の取り締まりは厳しいです。',
      },
    },
  },

  // 2) Left turn with a pedestrian on the exit crosswalk (左折巻き込み).
  {
    approach: 80, junction: 'cross', turn: 'left',
    event: {
      id: 'left-ped', zone: 'naha',
      title: { 'zh-TW': '左轉讓行人', ja: '左折——横断歩行者優先' },
      gps: { 'zh-TW': '下個路口左轉，讓晒行人先', ja: '次の交差点を左折・歩行者優先' },
      light: { type: 'standard', color: 'green' },
      speedLimit: 40,
      npcs: [
        // Pedestrian on the LEFT arm's crosswalk — the arm the player turns into.
        // In leg-local coords that crosswalk lies along s at t ≈ -(J/2+2.4).
        { id: 'ped', kind: 'pedestrian', from: { s: 80 + J / 2 - 6, t: -(J / 2 + 2.4) - 0 }, to: { s: 80 + J / 2 + 6, t: -(J / 2 + 2.4) }, speed: 1.35, delayMs: 1200, color: 0xffd54f },
        { id: 'onc', kind: 'vehicle', variant: 'car', from: { s: 80 + J + 55, t: O }, to: { s: -25, t: O }, speed: 11, delayMs: 500, color: 0xcc2222 },
      ],
      rules: { waitForGo: true, yieldPed: true },
      law: '道路交通法第38条',
      lesson: {
        'zh-TW': '青燈左轉都要讓緊過馬路嘅行人——「左折巻き込み」係日本最常見嘅意外之一，轉彎前望清楚左後方同橫行道。',
        ja: '青信号の左折でも横断中の歩行者を優先します。左折巻き込みは典型的な事故で、左後方と横断歩道の確認が必須です。',
      },
    },
  },

  // 3) Right turn: give way to TWO oncoming cars — don't take the gap.
  {
    approach: 80, junction: 'cross', turn: 'right',
    event: {
      id: 'right-oncoming', zone: 'naha',
      title: { 'zh-TW': '右轉讓對向車', ja: '右折——対向直進車優先' },
      gps: { 'zh-TW': '下個路口右轉，等對向車過晒', ja: '次の交差点を右折・対向車が全部通過してから' },
      light: { type: 'standard', color: 'green' },
      speedLimit: 40,
      npcs: [
        { id: 'opp1', kind: 'vehicle', variant: 'car', from: { s: 80 + J + 62, t: O }, to: { s: -25, t: O }, speed: 12, delayMs: 0, color: 0xcc2222 },
        { id: 'opp2', kind: 'vehicle', variant: 'taxi', from: { s: 80 + J + 66, t: O }, to: { s: -25, t: O }, speed: 11, delayMs: 2600, color: 0xffc107 },
      ],
      rules: { waitForGo: true, yieldVeh: true },
      law: '道路交通法第37条',
      lesson: {
        'zh-TW': '右轉要等所有對向直行車，包括第二架。讓完第一架就搶轉係右轉意外主因——「右直事故」。',
        ja: '右折は対向直進車が全て通過するまで待ちます。1台目の直後に発進して2台目と衝突する「右直事故」が多発しています。',
      },
    },
  },

  // 4) Dilemma zone: green → yellow → red exactly on your approach.
  {
    approach: 85, junction: 'cross', turn: 'straight',
    event: {
      id: 'yellow-dilemma', zone: 'naha',
      title: { 'zh-TW': '黃燈抉擇', ja: '黄信号のジレンマ' },
      gps: { 'zh-TW': '直行——黃燈停得到就要停', ja: '直進——黄色で止まれるなら停止' },
      light: { type: 'standard', color: 'green' },
      lightPhases: [
        { atMs: 2100, state: { type: 'standard', color: 'yellow' } },
        { atMs: 4300, state: { type: 'standard', color: 'red' } },
        { atMs: 10500, state: { type: 'standard', color: 'green' } },
      ],
      speedLimit: 50,
      npcs: [
        { id: 'x1', kind: 'vehicle', variant: 'car', from: { s: 85 + J / 2 - 1.75, t: -45 }, to: { s: 85 + J / 2 - 1.75, t: 45 }, speed: 11, delayMs: 5300, color: 0x44bb55 },
        { id: 'x2', kind: 'vehicle', variant: 'kei', from: { s: 85 + J / 2 + 1.75, t: 45 }, to: { s: 85 + J / 2 + 1.75, t: -45 }, speed: 10, delayMs: 6600, color: 0x26a69a },
      ],
      rules: { waitForGo: true },
      law: '道路交通法施行令第2条',
      lesson: {
        'zh-TW': '黃燈=「停止線前停得到就必須停」，唔係加速搶過嘅信號。只有已經太近、急煞反而危險先可以通過。',
        ja: '黄信号は「安全に停止できるなら停止」の合図。加速して突っ込むものではありません。停止線に近すぎる場合のみ通過できます。',
      },
    },
  },

  // 5) Red main light + green RIGHT arrow — the arrow direction may go.
  {
    approach: 80, junction: 'cross', turn: 'right',
    event: {
      id: 'arrow-right', zone: 'naha',
      title: { 'zh-TW': '紅燈＋右箭頭', ja: '赤信号＋右矢印' },
      gps: { 'zh-TW': '右轉——右箭頭亮住可以轉', ja: '右折——右矢印が点灯中は進めます' },
      light: { type: 'arrow', mainColor: 'red', activeArrows: ['right'] },
      speedLimit: 40,
      npcs: [
        // Oncoming cars are held by their own red — parked at their stop line.
        { id: 'held1', kind: 'vehicle', variant: 'car', from: { s: 80 + J + 8, t: O }, to: { s: 80 + J + 8, t: O }, speed: 0, delayMs: 0, color: 0x5c6bc0 },
        { id: 'held2', kind: 'vehicle', variant: 'kei', from: { s: 80 + J + 15, t: O }, to: { s: 80 + J + 15, t: O }, speed: 0, delayMs: 0, color: 0x26a69a },
      ],
      rules: { waitForGo: true },
      law: '道路交通法施行令第2条',
      lesson: {
        'zh-TW': '主燈紅但綠色右箭頭亮起＝只可以向箭頭方向（右）行。對向車全部被紅燈扣住，所以呢個時候右轉係安全嘅——呢個就係「時差式信号」嘅設計。',
        ja: '赤信号でも緑の右矢印が点灯していれば右折のみ可能。対向車は赤で止まっているため安全に右折できます（時差式信号の仕組み）。',
      },
    },
  },

  // ══ ZONE 2 學校區 ═══════════════════════════════════════════════════════

  // 6) School zone 30 km/h — a child crosses an unsignalised zebra.
  {
    approach: 78, junction: 'none', turn: 'straight', crosswalkAtS: 52,
    event: {
      id: 'school-child', zone: 'school',
      title: { 'zh-TW': '通學路——讓學童', ja: 'スクールゾーン——児童優先' },
      gps: { 'zh-TW': '學校區限速30，前方斑馬線注意學童', ja: 'スクールゾーン30km/h・横断歩道で児童に注意' },
      light: null,
      speedLimit: 30,
      npcs: [
        { id: 'child', kind: 'pedestrian', from: { s: 52, t: 7 }, to: { s: 52, t: -7 }, speed: 1.7, delayMs: 1200, color: 0xff7043 },
        { id: 'onc', kind: 'vehicle', variant: 'kei', from: { s: 120, t: O }, to: { s: -20, t: O }, speed: 8, delayMs: 2500, color: 0x26a69a },
      ],
      rules: { yieldPed: true },
      law: '道路交通法第38条',
      lesson: {
        'zh-TW': '無燈號斑馬線有人想過就必須停。通學路限速30，學童會突然衝出，見到斑馬線就預備踩煞車。',
        ja: '信号のない横断歩道は渡ろうとする人がいれば必ず停止。通学路は30km/h制限で、子どもの飛び出しに備えます。',
      },
    },
  },

  // 7) 止まれ stop sign at a T-junction — full stop, yield to the truck, turn left.
  {
    approach: 80, junction: 't-junction', turn: 'left',
    event: {
      id: 'stop-sign-left', zone: 'school',
      title: { 'zh-TW': '「止まれ」完全停車', ja: '「止まれ」一時停止' },
      gps: { 'zh-TW': 'T字路口：完全停定，再左轉', ja: 'T字路：完全に停止してから左折' },
      light: null,
      stopSign: true,
      speedLimit: 30,
      npcs: [
        { id: 'truck', kind: 'vehicle', variant: 'truck', from: { s: 80 + J / 2 + 1.75, t: 48 }, to: { s: 80 + J / 2 + 1.75, t: -48 }, speed: 11, delayMs: 1600, color: 0x78909c },
        { id: 'car2', kind: 'vehicle', variant: 'car', from: { s: 80 + J / 2 - 1.75, t: -48 }, to: { s: 80 + J / 2 - 1.75, t: 48 }, speed: 10, delayMs: 4200, color: 0x2255cc },
      ],
      rules: { mustStop: true, yieldVeh: true },
      law: '道路交通法第43条',
      lesson: {
        'zh-TW': '紅色倒三角「止まれ」＝輪胎要完全靜止。慢慢碌過去唔算停，係日本被抄得最多嘅違規，租車客尤其小心。',
        ja: '「止まれ」標識ではタイヤが完全に止まるまで停止。徐行での通過は違反で、レンタカー利用者の取り締まり最多項目です。',
      },
    },
  },

  // ══ ZONE 3 舊市區窄巷 ═══════════════════════════════════════════════════

  // 8) Narrow back street — squeeze past the oncoming kei car.
  {
    approach: 75, junction: 'none', turn: 'straight', narrow: true,
    event: {
      id: 'narrow-pass', zone: 'oldtown',
      title: { 'zh-TW': '窄巷會車', ja: '細道での離合' },
      gps: { 'zh-TW': '窄路慢行靠左，同對向車互相讓', ja: '細い道は徐行・左寄せで離合' },
      light: null,
      speedLimit: 30,
      npcs: [
        { id: 'kei', kind: 'vehicle', variant: 'kei', from: { s: 88, t: 1.3 }, to: { s: -20, t: 1.3 }, speed: 6.5, delayMs: 400, color: 0xcc5522 },
        { id: 'scooter', kind: 'vehicle', variant: 'scooter', from: { s: 108, t: 1.3 }, to: { s: -20, t: 1.3 }, speed: 7.5, delayMs: 3800, color: 0xef5350 },
      ],
      rules: {},
      law: '道路交通法第18条・第27条',
      lesson: {
        'zh-TW': '那霸舊市區好多得一架車闊嘅巷仔。減速、靠左、必要時停低等對向車過——硬闖會卡死或者刮花。',
        ja: '那覇の旧市街には車1台分の細道が多くあります。減速して左に寄り、必要なら停止して対向車を先に通します。',
      },
    },
  },

  // 9) One-way street: the left arm is 進入禁止 — only right is legal.
  {
    approach: 78, junction: 't-junction', turn: 'right',
    event: {
      id: 'oneway-right', zone: 'oldtown',
      title: { 'zh-TW': '一方通行——只可右轉', ja: '一方通行——右折のみ' },
      gps: { 'zh-TW': '前面左邊係單行禁入，右轉', ja: '左は進入禁止・右折してください' },
      light: null,
      speedLimit: 30,
      npcs: [
        { id: 'main1', kind: 'vehicle', variant: 'car', from: { s: 78 + J / 2 - 1.75, t: -48 }, to: { s: 78 + J / 2 - 1.75, t: 48 }, speed: 10, delayMs: 900, color: 0x2255cc },
        { id: 'main2', kind: 'vehicle', variant: 'kei', from: { s: 78 + J / 2 + 1.75, t: 48 }, to: { s: 78 + J / 2 + 1.75, t: -48 }, speed: 9, delayMs: 3400, color: 0x26a69a },
      ],
      rules: { yieldVeh: true },
      law: '道路交通法第8条',
      lesson: {
        'zh-TW': '藍底白箭頭＝一方通行；紅圈白橫線＝進入禁止。逆入單行路係嚴重違規，那霸舊市區周街都係，轉彎前睇清楚牌。',
        ja: '青地に白矢印は一方通行、赤丸に白横線は進入禁止。逆走は重大違反です。那覇旧市街では標識確認を徹底しましょう。',
      },
    },
  },

  // 10) Side road → busy main road: stop sign, wait for a real gap, turn left.
  {
    approach: 70, junction: 'side-merge', turn: 'left',
    event: {
      id: 'side-merge', zone: 'oldtown',
      title: { 'zh-TW': '小路出大路', ja: '細道から幹線道路へ' },
      gps: { 'zh-TW': '出大路：停定，等有位先左轉', ja: '幹線道路へ：停止して間隔を待ち左折' },
      light: null,
      stopSign: true,
      speedLimit: 30,
      npcs: [
        { id: 'm1', kind: 'vehicle', variant: 'car', from: { s: 70 + J / 2 + 1.75, t: 55 }, to: { s: 70 + J / 2 + 1.75, t: -55 }, speed: 13, delayMs: 600, color: 0xcc2222 },
        { id: 'm2', kind: 'vehicle', variant: 'taxi', from: { s: 70 + J / 2 - 1.75, t: -55 }, to: { s: 70 + J / 2 - 1.75, t: 55 }, speed: 12, delayMs: 2400, color: 0xffc107 },
        { id: 'm3', kind: 'vehicle', variant: 'car', from: { s: 70 + J / 2 + 1.75, t: 55 }, to: { s: 70 + J / 2 + 1.75, t: -55 }, speed: 13, delayMs: 5200, color: 0x5c6bc0 },
      ],
      rules: { mustStop: true, yieldVeh: true },
      law: '道路交通法第36条・第43条',
      lesson: {
        'zh-TW': '由小路cut出大路：主路車有絕對優先，而且速度快過你想像。停定→右望→左望→再右望，有真正嘅空位先出去。',
        ja: '細道から幹線道路へ出るときは本線が絶対優先。想像より速いので、停止して右・左・右を確認し、確実な間隔で合流します。',
      },
    },
  },

  // ══ ZONE 4 國道58號 ═════════════════════════════════════════════════════

  // 11) Bus lane on the left — stay out of it, straight through the green.
  {
    approach: 90, junction: 'cross', turn: 'straight', busLane: true,
    event: {
      id: 'bus-lane', zone: 'route58',
      title: { 'zh-TW': '巴士專用線', ja: 'バス専用レーン' },
      gps: { 'zh-TW': '左邊藍線係巴士專用，行自己線直行', ja: '左の青いレーンはバス専用・自分の車線を直進' },
      light: { type: 'standard', color: 'green' },
      speedLimit: 50,
      npcs: [
        { id: 'bus', kind: 'vehicle', variant: 'bus', from: { s: -15, t: -5.25 }, to: { s: 90 + J + 40, t: -5.25 }, speed: 8.5, delayMs: 0, color: 0x2e7d32 },
        { id: 'onc', kind: 'vehicle', variant: 'car', from: { s: 90 + J + 70, t: O }, to: { s: -25, t: O }, speed: 13, delayMs: 1200, color: 0x8d6e63 },
      ],
      rules: { waitForGo: true },
      law: '道路交通法第20条の2',
      lesson: {
        'zh-TW': '國道58號市區段朝夕繁忙時間有「バス専用」線。私家車喺專用時段駛入係違規，跟住藍色油漆同路牌行。',
        ja: '国道58号の市街区間には時間帯バス専用レーンがあります。指定時間に一般車が走ると違反。青い舗装と標識に従いましょう。',
      },
    },
  },

  // 12) Morning rush: long red, a queue, pull away slowly on green.
  {
    approach: 85, junction: 'cross', turn: 'straight',
    event: {
      id: 'rush-hour', zone: 'route58',
      title: { 'zh-TW': '繁忙時間車龍', ja: 'ラッシュアワーの渋滞' },
      gps: { 'zh-TW': '塞車：跟隊等青燈，咪心急', ja: '渋滞中：列に並んで青を待つ' },
      light: { type: 'standard', color: 'red' },
      lightPhases: [
        { atMs: 5200, state: { type: 'standard', color: 'green' } },
      ],
      speedLimit: 50,
      npcs: [
        // The car ahead of you in the queue — parked at the line, pulls away on green.
        { id: 'lead', kind: 'vehicle', variant: 'car', from: { s: 85 - 11, t: P }, to: { s: 85 + J + 70, t: P }, speed: 9, delayMs: 5800, color: 0xff8c00 },
        // Oncoming queue released at the same time.
        { id: 'oq1', kind: 'vehicle', variant: 'car', from: { s: 85 + J + 13, t: O }, to: { s: -25, t: O }, speed: 8, delayMs: 6100, color: 0x5c6bc0 },
        { id: 'oq2', kind: 'vehicle', variant: 'kei', from: { s: 85 + J + 21, t: O }, to: { s: -25, t: O }, speed: 8, delayMs: 6900, color: 0x26a69a },
        // Cross traffic clearing during the red phase.
        { id: 'x1', kind: 'vehicle', variant: 'truck', from: { s: 85 + J / 2 - 1.75, t: -50 }, to: { s: 85 + J / 2 - 1.75, t: 50 }, speed: 10, delayMs: 800, color: 0x78909c },
        { id: 'x2', kind: 'vehicle', variant: 'car', from: { s: 85 + J / 2 + 1.75, t: 50 }, to: { s: 85 + J / 2 + 1.75, t: -50 }, speed: 11, delayMs: 2600, color: 0x44bb55 },
      ],
      rules: { waitForGo: true },
      law: '道路交通法第7条・第26条',
      lesson: {
        'zh-TW': '繁忙時間跟車要留兩秒距離，前車起步唔代表你可以貼住衝。紅燈幾長都要停足，塞車唔係衝燈嘅理由。',
        ja: 'ラッシュ時は車間2秒を確保。前車が動いてもすぐ詰めず、赤信号はどれだけ長くても守ります。渋滞は信号無視の理由になりません。',
      },
    },
  },

  // 13) Flashing red at a T-junction — full stop, yield, then right.
  {
    approach: 80, junction: 't-junction', turn: 'right',
    event: {
      id: 'flash-red', zone: 'route58',
      title: { 'zh-TW': '紅色閃爍信號', ja: '赤色点滅信号' },
      gps: { 'zh-TW': '紅閃＝完全停車，確認安全再右轉', ja: '赤点滅＝一時停止・安全確認後に右折' },
      light: { type: 'flashing', color: 'red' },
      speedLimit: 40,
      npcs: [
        { id: 'x1', kind: 'vehicle', variant: 'car', from: { s: 80 + J / 2 - 1.75, t: -50 }, to: { s: 80 + J / 2 - 1.75, t: 50 }, speed: 11, delayMs: 2000, color: 0xe69a2e },
        { id: 'x2', kind: 'vehicle', variant: 'scooter', from: { s: 80 + J / 2 + 1.75, t: 50 }, to: { s: 80 + J / 2 + 1.75, t: -50 }, speed: 8, delayMs: 4600, color: 0xef5350 },
      ],
      rules: { mustStop: true, yieldVeh: true },
      law: '道路交通法施行令第2条',
      lesson: {
        'zh-TW': '深夜同郊區好多路口轉紅色閃爍：意思係「一時停止」——同「止まれ」一樣要完全停定再確認。唔係「慢啲就得」。',
        ja: '深夜や郊外の交差点は赤点滅に切り替わります。意味は「一時停止」で、完全停止と安全確認が必要。徐行では足りません。',
      },
    },
  },

  // ══ ZONE 5 沖繩自動車道 ══════════════════════════════════════════════════

  // 14) ETC toll gate — slow to ≤20 km/h or you hit the bar.
  {
    approach: 110, junction: 'none', turn: 'straight', tollGate: true, highway: true,
    event: {
      id: 'etc-gate', zone: 'expressway',
      title: { 'zh-TW': 'ETC收費站', ja: 'ETC料金所' },
      gps: { 'zh-TW': 'ETC閘口：減到20以下慢慢過', ja: 'ETCレーン：20km/h以下に減速して通過' },
      light: null,
      speedLimit: 80,
      npcs: [],
      rules: {},
      law: '道路整備特別措置法',
      lesson: {
        'zh-TW': 'ETC唔使停但一定要減到20km/h以下，閘桿係感應開——衝得太快桿未開就撞正。過閘之後先至加速上高速。',
        ja: 'ETCレーンは停止不要ですが20km/h以下に減速が必要。速すぎるとバーの開放が間に合わず衝突します。通過後に加速しましょう。',
      },
    },
  },

  // 15) Okinawa Expressway cruise — 80 limit, don't dawdle below the minimum.
  {
    approach: 230, junction: 'none', turn: 'straight', highway: true,
    event: {
      id: 'expressway', zone: 'expressway',
      title: { 'zh-TW': '沖繩自動車道', ja: '沖縄自動車道' },
      gps: { 'zh-TW': '高速巡航：限速80、最低50', ja: '高速走行：最高80・最低50km/h' },
      light: null,
      speedLimit: 80,
      minSpeed: 50,
      npcs: [
        { id: 'ovt1', kind: 'vehicle', variant: 'truck', from: { s: -40, t: 5.5 }, to: { s: 300, t: 5.5 }, speed: 20, delayMs: 500, color: 0x78909c, loop: true },
        { id: 'ovt2', kind: 'vehicle', variant: 'car', from: { s: -60, t: 5.5 }, to: { s: 300, t: 5.5 }, speed: 24, delayMs: 4500, color: 0x4455ff, loop: true },
      ],
      rules: {},
      law: '道路交通法第75条の4',
      lesson: {
        'zh-TW': '沖繩自動車道最高80、最低50——日本少數限80嘅高速。太慢都係違規，保持穩定車速同車距。',
        ja: '沖縄自動車道は最高80km/h・最低50km/h。遅すぎても違反です。安定した速度と車間距離を維持しましょう。',
      },
    },
  },

  // ══ ZONE 6 美濱美國村（雨）═══════════════════════════════════════════════

  // 16) Rain starts — right turn with oncoming AND a pedestrian, wet grip.
  {
    approach: 85, junction: 'cross', turn: 'right', rainFrom: true,
    event: {
      id: 'rain-right', zone: 'mihama',
      title: { 'zh-TW': '雨天右轉', ja: '雨天の右折' },
      gps: { 'zh-TW': '落雨路滑：提早減速，右轉讓車讓人', ja: '雨で滑りやすい：早めに減速し右折' },
      light: { type: 'standard', color: 'green' },
      speedLimit: 40,
      npcs: [
        { id: 'onc', kind: 'vehicle', variant: 'taxi', from: { s: 85 + J + 60, t: O }, to: { s: -25, t: O }, speed: 11, delayMs: 400, color: 0xffc107 },
        // Pedestrian on the RIGHT arm's crosswalk (the arm the player turns into).
        { id: 'ped', kind: 'pedestrian', from: { s: 85 + J / 2 + 6, t: J / 2 + 2.4 }, to: { s: 85 + J / 2 - 6, t: J / 2 + 2.4 }, speed: 1.25, delayMs: 3000, color: 0x80deea },
      ],
      rules: { waitForGo: true, yieldVeh: true, yieldPed: true },
      law: '道路交通法第37条・第38条・第70条',
      lesson: {
        'zh-TW': '沖繩驟雨多，濕地煞車距離長一截。雨天右轉要提早收油，先讓對向車、再讓轉入嗰邊嘅行人，一樣都唔可以漏。',
        ja: '沖縄はスコールが多く、濡れた路面は制動距離が伸びます。雨天の右折は早めに減速し、対向車→横断歩行者の順に必ず譲ります。',
      },
    },
  },

  // 17) American Village finale — tourists on a zebra, then the goal.
  {
    approach: 95, junction: 'none', turn: 'straight', crosswalkAtS: 48,
    event: {
      id: 'mihama-goal', zone: 'mihama',
      title: { 'zh-TW': '美國村衝線', ja: 'アメリカンビレッジ・ゴール' },
      gps: { 'zh-TW': '最後一段：讓晒遊客，衝過終點！', ja: 'ラスト：観光客に譲ってゴールへ！' },
      light: null,
      speedLimit: 40,
      npcs: [
        { id: 'tourist1', kind: 'pedestrian', from: { s: 48, t: -7 }, to: { s: 48, t: 7 }, speed: 1.2, delayMs: 1400, color: 0xffd54f },
        { id: 'tourist2', kind: 'pedestrian', from: { s: 48, t: 7 }, to: { s: 48, t: -7 }, speed: 1.05, delayMs: 2600, color: 0xba68c8 },
      ],
      rules: { yieldPed: true },
      law: '道路交通法第38条',
      lesson: {
        'zh-TW': '觀光區行人多過車，斑馬線前預備停。順利讓晒行人，你就完成成個沖繩路試喇！',
        ja: '観光エリアは歩行者優先が徹底されます。横断歩道の手前で停止準備。全員に譲れば路上試験は完走です！',
      },
    },
  },
]
