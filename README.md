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

## Scenarios (24 total)

| Category | Count | Law Reference |
|----------|-------|---------------|
| Standard 3-color lights | 7 | 道路交通法第7条 |
| Arrow signals (矢印信号) | 5 | 道路交通法第7条 |
| Flashing signals (点滅信号) | 4 | 道路交通法第7条第4項 |
| Pedestrian signals | 4 | 道路交通法第38条 |
| Priority road intersections | 2 | 道路交通法第36条 |
| One-way streets (一方通行) | 2 | 道路交通法第8条 |

Note: No railroad crossing (踏切) scenarios — Okinawa's Yui Rail monorail runs elevated and has no at-grade crossings.

## Game Modes

- **学習モード** (Study): No timer, unlimited lives — learn the rules
- **クイズモード** (Normal): 10-second timer, 3 lives
- **挑戦モード** (Challenge): Decreasing timer, 1 life per scenario — unlocked after Normal
