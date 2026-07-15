import { create } from 'zustand'
import type { Lang } from '../data/types'
import { START_POINTS, type ViolationRecord } from '../course/types'

interface GameStore {
  lang: Lang
  violations: ViolationRecord[]
  finishedTimeMs: number | null
  setLang: (lang: Lang) => void
  startCourse: () => void
  addViolation: (v: ViolationRecord) => void
  completeCourse: (timeMs: number) => void
}

export const useGameStore = create<GameStore>((set) => ({
  lang: 'zh-TW',
  violations: [],
  finishedTimeMs: null,

  setLang: (lang) => set({ lang }),

  startCourse: () => set({ violations: [], finishedTimeMs: null }),

  addViolation: (v) => set((s) => ({ violations: [...s.violations, v] })),

  completeCourse: (timeMs) => set({ finishedTimeMs: timeMs }),
}))

export function pointsOf(violations: ViolationRecord[]): number {
  return Math.max(0, START_POINTS - violations.reduce((a, v) => a + v.deduction, 0))
}
