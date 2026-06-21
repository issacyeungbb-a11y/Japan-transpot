import type { Scenario } from '../types'
import { GAME_WIDTH, GAME_HEIGHT } from '../../game/GameConfig'

const cx = GAME_WIDTH / 2
const cy = GAME_HEIGHT / 2

export const pedestrianScenarios: Scenario[] = [
  {
    id: 'ped-001',
    category: 'pedestrian',
    title: { 'zh-TW': '行人閃爍燈——行人仍在橫道', ja: '歩行者信号点滅——歩行者が横断中' },
    description: {
      'zh-TW': '行人信號閃爍，一位老伯仍在橫行過馬路。',
      ja: '歩行者信号が点滅している。お年寄りがまだ横断中だ。',
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
      {
        id: 'ped',
        x: cx - 60,
        y: cy - 70,
        state: { type: 'pedestrian', phase: 'flashing' },
      },
    ],
    npcs: [
      {
        id: 'elderly',
        type: 'pedestrian',
        startX: cx - 40,
        startY: cy - 42,
        path: [{ x: cx + 40, y: cy - 42 }],
        startAtMs: 200,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 30, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '你轉彎時，行人燈閃爍，老伯仍在橫道，你應該？',
            ja: '曲がろうとしたとき、歩行者信号が点滅し、お年寄りが横断中。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '停車讓老伯安全通過', ja: 'お年寄りが安全に渡るまで停車する' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！行人燈閃爍不代表行人必須馬上離開橫道，仍在橫道的行人享有優先權，必須讓行。',
                ja: '正解！歩行者信号の点滅は、横断中の歩行者に直ちに退くことを求めるものではありません。横断中の歩行者には優先権があり、停車して待つ必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '行人燈閃爍，行人應該快點過，我可以慢慢開', ja: '点滅中なので歩行者は急ぐべき。ゆっくり進む' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！仍在橫道的行人，無論燈號如何，車輛都必須讓路。',
                ja: '不正解！横断中の歩行者は信号の状態に関わらず優先されます。車両は譲る義務があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '按喇叭讓老伯加快', ja: 'クラクションでお年寄りを急かす' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！不應按喇叭催促行人，且仍需讓行人先過。',
                ja: '不正解！歩行者を急かすためのクラクション使用は不適切です。歩行者優先を守ってください。',
              },
              consequence: 'near_miss',
            },
            {
              id: 'd',
              text: { 'zh-TW': '閃燈提示老伯讓路', ja: 'ライト点滅でお年寄りに退くよう知らせる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！橫道上的行人享有優先權，不應以任何方式催促其讓路。',
                ja: '不正解！横断歩道の歩行者には優先権があります。いかなる方法でも退かせようとしてはいけません。',
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
          '行人燈閃爍代表行人不應開始橫行，但已在橫道上的行人仍有繼續通過的權利，車輛必須讓路。即使行人燈已轉紅，車輛亦必須等待橫道上的行人安全通過。',
        ja: '歩行者信号の点滅は新たな横断の開始を禁止しますが、すでに横断中の歩行者には通過する権利があります。車両は必ず停車して待つ必要があります。歩行者信号が赤になっても、横断中の歩行者が安全に渡るまで待たなければなりません。',
      },
      lawArticle: '道路交通法第38条',
    },
  },

  {
    id: 'ped-002',
    category: 'pedestrian',
    title: { 'zh-TW': '橫道前行人等候', ja: '横断歩道前で待っている歩行者' },
    description: {
      'zh-TW': '行人在橫道旁等候，但行人燈顯示紅色（停止）。',
      ja: '歩行者が横断歩道の脇で待っている。歩行者信号は赤（停止）。',
    },
    difficulty: 1,
    mapType: 'cross',
    lights: [
      {
        id: 'ped',
        x: cx - 60,
        y: cy - 70,
        state: { type: 'pedestrian', phase: 'stop' },
      },
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
          { x: cx + 20, y: cy + 30, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '青燈，行人在橫道旁等候（行人燈紅），你應該？',
            ja: '青信号。歩行者が横断歩道の脇で待っている（歩行者信号は赤）。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '正常通過，行人燈紅色行人不應橫行', ja: '通常通過。歩行者信号が赤なので歩行者は横断しないはず' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！行人燈紅色時，行人不應橫行。你的青燈有效，可正常通過，但仍需留意行人動態。',
                ja: '正解！歩行者信号が赤のとき、歩行者は横断すべきではありません。あなたの青信号は有効です。ただし歩行者の動きには注意してください。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '停車讓行人先過', ja: '停車して歩行者を先に渡らせる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '不必要。行人燈紅色，行人不應橫行，你可正常通過。但如行人突然橫行則需讓路。',
                ja: '不要な対応です。歩行者信号が赤で歩行者は横断すべきではありません。ただし突然横断する場合は停車が必要です。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'c',
              text: { 'zh-TW': '任何時候有行人在附近都要停車', ja: '歩行者が近くにいたら常に停車する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！行人燈紅色時，行人在橫道旁等候是正常狀態，你可按信號通過。',
                ja: '不正解！歩行者信号が赤のとき、歩行者が待っているのは正常な状態です。信号に従って通過できます。',
              },
              consequence: 'penalty_stop',
            },
            {
              id: 'd',
              text: { 'zh-TW': '慢慢通過，盯著行人防止突然闖入', ja: '徐行しながら歩行者を注視する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '留意行人是對的，但正常速度通過亦可，不需特別減速。若行人突然橫行則需立即讓路。',
                ja: '歩行者への注意は正しいですが、通常速度での通過も可能です。歩行者が突然横断した場合は即座に停車が必要です。',
              },
              consequence: 'near_miss',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '行人燈紅色時，行人不應開始橫行，車輛按自身信號（青燈）正常通過即可。但仍需保持警覺，因為有行人可能突然闖入橫道。',
        ja: '歩行者信号が赤のとき、歩行者は横断を開始すべきではありません。車両は自分の信号（青）に従って通過できます。ただし、歩行者が突然横断することもあるので注意が必要です。',
      },
      lawArticle: '道路交通法第38条',
    },
  },

  {
    id: 'ped-003',
    category: 'pedestrian',
    title: { 'zh-TW': '行人燈倒數計時', ja: '歩行者信号のカウントダウン' },
    description: {
      'zh-TW': '現代行人燈附有倒數計時，顯示「3」秒，行人仍在橫道。',
      ja: 'カウントダウン付きの歩行者信号が「3」秒を表示。歩行者はまだ横断中。',
    },
    difficulty: 2,
    mapType: 'cross',
    lights: [
      {
        id: 'ped',
        x: cx - 60,
        y: cy - 70,
        state: { type: 'pedestrian', phase: 'flashing', countdown: 3 },
      },
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
        startX: cx - 10,
        startY: cy - 42,
        path: [{ x: cx + 40, y: cy - 42 }],
        startAtMs: 0,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 30, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1500,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '倒數3秒，行人仍在橫道未過完，你應該？',
            ja: 'カウントダウン3秒。歩行者がまだ横断中。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '等行人完全通過橫道才前進', ja: '歩行者が完全に渡り終えるまで待つ' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！倒數計時只是給行人的提示，車輛仍必須等待橫道上所有行人通過。',
                ja: '正解！カウントダウンは歩行者への案内です。車両は横断中の全ての歩行者が通過するまで待つ必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '倒數到0行人燈轉紅後立即前進', ja: 'カウントダウンが0になったら即座に前進する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！燈轉紅後，仍在橫道的行人仍需完成橫行，車輛需再等行人離開橫道。',
                ja: '不正解！信号が赤になっても、横断中の歩行者は通過を完了する必要があります。歩行者が横断歩道を離れるまで待つ必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '還有3秒，夠時間讓我過去', ja: 'まだ3秒ある。通過する時間は十分ある' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！倒數是給行人的，不是給車輛的通過時間提示，車輛必須等行人通過。',
                ja: '不正解！カウントダウンは歩行者のためのものです。車両の通過時間を示すものではありません。歩行者の通過を待ってください。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '慢慢開進去，行人會閃開', ja: 'ゆっくり入っていく。歩行者は避けてくれる' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！強行進入橫道非常危險且違法，必須等行人全部通過。',
                ja: '不正解！横断歩道への強行侵入は非常に危険で違法です。歩行者が全員通過するまで待ってください。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '行人燈倒數計時是為行人設計的提示，告知剩餘橫行時間。對車輛而言，橫道上有行人就必須讓路，直到所有行人安全離開橫道為止。',
        ja: '歩行者信号のカウントダウンは、残りの横断時間を歩行者に知らせるものです。車両にとっては、横断歩道に歩行者がいる限り、全員が安全に渡り終えるまで停車義務があります。',
      },
      lawArticle: '道路交通法第38条',
    },
  },

  {
    id: 'ped-004',
    category: 'pedestrian',
    title: { 'zh-TW': '橫道無信號燈——如何讓行人優先', ja: '信号のない横断歩道——歩行者優先' },
    description: {
      'zh-TW': '路口沒有行人信號燈，只有斑馬線，行人正要橫行。',
      ja: '歩行者信号のない交差点。横断歩道のみ。歩行者が渡ろうとしている。',
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
        id: 'ped1',
        type: 'pedestrian',
        startX: cx - 45,
        startY: cy - 42,
        path: [{ x: cx + 45, y: cy - 42 }],
        startAtMs: 600,
      },
    ],
    phases: [
      {
        id: 'approach',
        durationMs: 3000,
        playerPath: [
          { x: cx + 20, y: GAME_HEIGHT - 60 },
          { x: cx + 20, y: cy + 30, speed: 1800 },
        ],
        decisionPoint: {
          triggerAtMs: 1400,
          timerSeconds: 10,
          promptText: {
            'zh-TW': '無行人信號燈，只有斑馬線，行人開始橫行，你應該？',
            ja: '歩行者信号なし、横断歩道あり。歩行者が渡り始めた。どうしますか？',
          },
          choices: [
            {
              id: 'a',
              text: { 'zh-TW': '停車讓行人先通過', ja: '停車して歩行者を先に通過させる' },
              isCorrect: true,
              feedbackText: {
                'zh-TW': '正確！無論有無信號燈，在斑馬線橫行的行人享有絕對優先權，車輛必須讓路。',
                ja: '正解！信号の有無に関わらず、横断歩道を渡る歩行者には絶対的な優先権があります。車両は必ず停車して待つ必要があります。',
              },
              consequence: 'smooth_pass',
            },
            {
              id: 'b',
              text: { 'zh-TW': '沒有行人信號燈，車輛優先', ja: '歩行者信号がなければ車両が優先' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '大錯！斑馬線上的行人永遠享有優先權，與有無信號燈無關。',
                ja: '大間違い！横断歩道の歩行者は常に優先されます。信号の有無は関係ありません。',
              },
              consequence: 'crash',
            },
            {
              id: 'c',
              text: { 'zh-TW': '慢慢通過，行人看到我會讓開', ja: 'ゆっくり通過する。歩行者は私を見て道を空けるだろう' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！不能期望行人讓路，車輛必須讓行人先行。',
                ja: '不正解！歩行者に道を空けることを期待してはいけません。車両が歩行者に道を譲る必要があります。',
              },
              consequence: 'crash',
            },
            {
              id: 'd',
              text: { 'zh-TW': '鳴號提示行人，然後通過', ja: 'クラクションで知らせてから通過する' },
              isCorrect: false,
              feedbackText: {
                'zh-TW': '錯誤！鳴號不能代替讓行義務，必須停車讓行人先過。',
                ja: '不正解！クラクションで譲歩義務は免除されません。停車して歩行者を先に通過させてください。',
              },
              consequence: 'crash',
            },
          ],
        },
      },
    ],
    feedback: {
      explanation: {
        'zh-TW': '根據道路交通法第38條，在橫道（斑馬線）上橫行的行人，無論有無信號燈，車輛都必須停車讓路。這係日本最基本的行人保護法規之一。',
        ja: '道路交通法第38条により、横断歩道を渡る歩行者には、信号の有無に関わらず車両が必ず停車して道を譲る義務があります。これは日本の最も基本的な歩行者保護規定の一つです。',
      },
      lawArticle: '道路交通法第38条',
    },
  },
]
