import { create } from 'zustand'
import type { GameSession, AnswerRecord, Lang } from '../data/types'

interface GameStore {
  lang: Lang
  session: GameSession | null
  setLang: (lang: Lang) => void
  startSession: (mode: GameSession['mode'], scenarioIds: string[], startIndex?: number) => void
  recordAnswer: (record: AnswerRecord) => void
  nextScenario: () => void
  loseLife: () => void
  addScore: (points: number) => void
  resetSession: () => void
}

const INITIAL_LIVES: Record<GameSession['mode'], number> = {
  study: Infinity,
  normal: 3,
  challenge: 1,
}

export const useGameStore = create<GameStore>((set) => ({
  lang: 'zh-TW',
  session: null,

  setLang: (lang) => set({ lang }),

  startSession: (mode, scenarioIds, startIndex = 0) =>
    set({
      session: {
        mode,
        scenarioIds,
        currentIndex: startIndex,
        score: 0,
        lives: INITIAL_LIVES[mode],
        streak: 0,
        answers: [],
      },
    }),

  recordAnswer: (record) =>
    set((state) => {
      if (!state.session) return state
      const streak = record.isCorrect ? state.session.streak + 1 : 0
      return {
        session: {
          ...state.session,
          streak,
          answers: [...state.session.answers, record],
        },
      }
    }),

  nextScenario: () =>
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          currentIndex: state.session.currentIndex + 1,
        },
      }
    }),

  loseLife: () =>
    set((state) => {
      if (!state.session) return state
      return {
        session: {
          ...state.session,
          lives: Math.max(0, state.session.lives - 1),
          streak: 0,
        },
      }
    }),

  addScore: (points) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, score: state.session.score + points },
      }
    }),

  resetSession: () => set({ session: null }),
}))
