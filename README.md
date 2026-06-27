# 沖繩交通挑戰 / 沖縄交通チャレンジ

沖繩自駕前的交通情境熟習工具。目標不是背答案，而是在接近真實路面壓力下練習靠左行駛、讓行、速度控制、盲點確認與即時判斷。

## Tech Stack

- React + TypeScript + Vite
- Phaser 3 top-down 2D driving scene
- Zustand state management
- i18next Traditional Chinese / Japanese
- Tailwind CSS

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
```

## Scenarios

Current content: 24 playable driving scenarios in one focused practice path.

| Theme | Examples | Law Reference |
| --- | --- | --- |
| Standard 3-color lights | red / green / yellow, right-turn yield | 道路交通法第7条・第37条 |
| Arrow signals | red main + right arrow | 道路交通法第7条 |
| Flashing signals | yellow caution, red full-stop | 道路交通法第7条・施行令第2条 |
| Stop sign | mandatory full stop at unsignalised junction | 道路交通法第43条 |
| Pedestrian / school zone | crosswalk yield, school-zone 30 km/h | 道路交通法第38条・第22条 |
| Priority / narrow roads | priority road, narrow-road meeting | 道路交通法第36条・第18条 |
| One-way / bus lane | one-way direction, Naha bus-only lane | 道路交通法第8条・第20条の2 |
| Weather / expressway | rain, ETC toll gate, expressway lane discipline | 道路交通法第70条・第75条の4 |

## Realism Features

- Single practice entry with all 24 scenarios available for repeated training.
- Live km/h speedometer and Japanese round speed-limit sign.
- Speeding tolerance scales with the posted limit, so 30 km/h zones stay strict while expressways still allow tiny control overshoots.
- ETC toll gate must be cleared at 20 km/h or below; arriving faster hits the barrier.
- Scenario enhancer adds longer time limits, busier traffic, mixed vehicle types, and richer road markings.
- Blind-spot controls: hold `👀左後` or `👀右後`, or swipe on the game canvas, to check behind before turning.
- Left-turn scenarios require left-rear blind-spot confirmation, with scooter traffic added to train 巻き込み awareness.
- Weak-area analysis on the results screen tallies failure reasons and gives targeted practice advice.

Note: No railroad crossing scenarios are included because Okinawa's Yui Rail monorail runs elevated and has no at-grade crossings.
