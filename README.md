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

Current content: 27 playable driving scenarios in one focused practice path.

| Theme | Examples | Law Reference |
| --- | --- | --- |
| Standard 3-color lights | red / green / yellow, right-turn yield | 道路交通法第7条・第37条 |
| Arrow signals | red main + right arrow | 道路交通法第7条 |
| Flashing signals | yellow caution, red full-stop | 道路交通法第7条・施行令第2条 |
| Stop sign | mandatory full stop at unsignalised junction | 道路交通法第43条 |
| Pedestrian / school zone | crosswalk yield, school-zone 30 km/h | 道路交通法第38条・第22条 |
| Priority / narrow roads | priority road, narrow-road meeting | 道路交通法第36条・第18条 |
| Okinawa judgement drills | roundabout yield, left-side priority, multilane right-turn lane | 道路交通法第35条の2・第36条・第37条 |
| One-way / bus lane | one-way direction, Naha bus-only lane | 道路交通法第8条・第20条の2 |
| Weather / expressway | rain, ETC toll gate, expressway lane discipline | 道路交通法第70条・第75条の4 |

## Realism Features

- Single practice entry with all 27 scenarios available for repeated training.
- Live km/h speedometer and Japanese round speed-limit sign.
- Player starts from rest and must actively manage throttle, braking, and speed.
- Speeding tolerance scales with the posted limit, so 30 km/h zones stay strict while expressways still allow tiny control overshoots.
- Braking distance is tuned to require earlier slowing; rain further lengthens the stop.
- Mandatory stops require a full 0.6 second stop close to the stop line, with a `✓已停定` HUD cue.
- Pedestrian-yield scenarios require stopping for pedestrians in front of the vehicle, not merely rolling past slowly.
- Turn-signal controls are part of the driving sequence; turning without signalling fails as `no_signal`.
- ETC toll gate must be cleared at 20 km/h or below; arriving faster hits the barrier.
- Scenario enhancer adds longer time limits, busier traffic, mixed vehicle types, and richer road markings.
- Reactive NPC vehicles can cruise, brake, yield, behave aggressively, turn with indicators, or use deterministic random yielding.
- New road geometry covers roundabouts and multilane junctions, with uncontrolled junction drills for left-side priority.
- Blind-spot controls: hold `👀左後` or `👀右後`, or swipe on the game canvas, to check behind before turning.
- High-risk turning scenarios can require mirror/blind-spot confirmation, with scooter traffic added to train 巻き込み awareness without turning every basic left turn into a hidden fail trap.
- Failed scenarios restart the same scenario by default; after 3 failed attempts the player may skip.
- Weak-area analysis on the results screen tallies failure reasons and gives targeted practice advice.

Note: No railroad crossing scenarios are included because Okinawa's Yui Rail monorail runs elevated and has no at-grade crossings.

## Planned From Third-Party Review

The review also calls for larger upgrades that are intentionally not marked as complete yet: parking and reverse gear, route-style multi-junction graduation tests, visibility/gradient/wind rendering, replay snapshots, persistent progress history, bus-lane time/day variants after checking current Okinawa police notices, and a full stage-0-to-stage-6 curriculum expansion.
