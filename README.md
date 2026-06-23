# 沖繩交通挑戰 / 沖縄交通チャレンジ

Japan traffic rules educational game simulating real driving situations in Okinawa.

## Tech Stack

- React + TypeScript + Vite
- Phaser 3 (top-down 2D game canvas)
- Zustand (state management)
- i18next (Traditional Chinese / Japanese bilingual)
- Tailwind CSS

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Scenarios (18 total)

| Theme | Examples | Law Reference |
|----------|-------|---------------|
| Standard 3-color lights | red / green / yellow, right-turn yield | 道路交通法第7条・第37条 |
| Arrow signals (矢印信号) | red main + right arrow | 道路交通法第7条 |
| Flashing signals (点滅信号) | yellow caution, red full-stop | 道路交通法第7条第4項 |
| Stop sign (止まれ・一時停止) | mandatory full stop at unsignalised junction | 道路交通法第43条 |
| Pedestrian / school zone | crosswalk yield, 通学路 30 km/h | 道路交通法第38条・第22条 |
| Speed limits | Okinawa local 40–50, Okinawa Expressway 80 | 道路交通法第22条 |
| Priority / narrow roads | yield to priority road, 狭い道での離合 | 道路交通法第36条・第18条 |
| One-way / bus lane | 一方通行, Naha 国道58号 バス専用レーン | 道路交通法第8条・第20条の2 |

Realism features:
- **Live km/h speedometer** (bottom-left) and **Japanese round speed-limit sign** (top-right).
- **Speeding fails the run** if you stay over the posted limit too long — trains real speed discipline.
- Speed scale tuned so a natural cruise reads ~50 km/h (the common Okinawa local limit).

Note: No railroad crossing (踏切) scenarios — Okinawa's Yui Rail monorail runs elevated and has no at-grade crossings.

## Game Modes

- **学習モード** (Study): No timer, unlimited lives — learn the rules
- **クイズモード** (Normal): 10-second timer, 3 lives
- **挑戦モード** (Challenge): Decreasing timer, 1 life per scenario — unlocked after Normal
