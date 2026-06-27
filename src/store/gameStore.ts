import { create } from 'zustand'
import type { GameSession, AnswerRecord, Lang } from '../data/types'

interface GameStore {
  lang: Lang
  session: GameSession | null
  setLang: (lang: Lang) => void
  startSession: (scenarioIds: string[], startIndex?: number) => void
  recordAnswer: (record: AnswerRecord) => void
  nextScenario: () => void
  addScore: (points: number) => void
  resetSession: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  lang: 'zh-TW',
  session: null,

  setLang: (lang) => set({ lang }),

  startSession: (scenarioIds, startIndex = 0) =>
    set({
      session: {
        scenarioIds,
        currentIndex: startIndex,
        score: 0,
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

  addScore: (points) =>
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, score: state.session.score + points },
      }
    }),

  resetSession: () => set({ session: null }),
}))
