/**
 * The session — E4.1 / E4.4 / E4.6.
 *
 * design.md §7: a session is ten sentences. Fixed. No endless mode, no "just
 * one more". No timer during a puzzle, because timing pressure degrades the
 * exact processing this app trains.
 *
 * The in-progress session lives here and is mirrored to SQLite as it goes, so
 * closing the app mid-session and reopening resumes rather than restarts.
 */
import { create } from 'zustand';

import type { SeedSentence } from '@/content/seed';
import type { Verdict } from '@/engine/validate';

export type SessionAttempt = {
  sentenceId: string;
  submittedOrder: string[];
  verdict: Verdict;
};

type SessionState = {
  /** Stable id; attempts key on it so a session can be reviewed later. */
  sessionId: string | null;
  sentences: SeedSentence[];
  /** Index of the sentence being played. */
  index: number;
  /** One per sentence answered, in play order. */
  attempts: SessionAttempt[];

  start: (sessionId: string, sentences: SeedSentence[]) => void;
  /** Records the verdict for the current sentence. */
  record: (attempt: SessionAttempt) => void;
  /** Moves to the next sentence. */
  advance: () => void;
  /** Restores an interrupted session. */
  resume: (
    sessionId: string,
    sentences: SeedSentence[],
    attempts: SessionAttempt[],
  ) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  sentences: [],
  index: 0,
  attempts: [],

  start: (sessionId, sentences) =>
    set({ sessionId, sentences, index: 0, attempts: [] }),

  record: (attempt) =>
    set((state) => {
      // Re-answering the current sentence replaces its attempt rather than
      // appending: a learner who fixes a wrong answer has one result for that
      // sentence, not two.
      const attempts = state.attempts.filter(
        (a) => a.sentenceId !== attempt.sentenceId,
      );
      return { attempts: [...attempts, attempt] };
    }),

  advance: () =>
    set((state) => ({
      index: Math.min(state.index + 1, state.sentences.length),
    })),

  resume: (sessionId, sentences, attempts) =>
    set({
      sessionId,
      sentences,
      attempts,
      // Resume at the first unanswered sentence, not at the end.
      index: Math.min(attempts.length, sentences.length),
    }),

  clear: () => set({ sessionId: null, sentences: [], index: 0, attempts: [] }),
}));

/** The sentence currently in play, or undefined once the session is over. */
export function currentSentence(
  state: Pick<SessionState, 'sentences' | 'index'>,
): SeedSentence | undefined {
  return state.sentences[state.index];
}

export function isSessionComplete(
  state: Pick<SessionState, 'sentences' | 'index'>,
): boolean {
  return state.sentences.length > 0 && state.index >= state.sentences.length;
}

/**
 * How many of the session's answers were correct.
 *
 * Tier advance needs 8/10 canonical-or-valid across three consecutive
 * sessions, so the three accepted classes count equally here — a learner who
 * reaches for a marked-but-grammatical order has not made a mistake.
 */
export function correctCount(attempts: readonly SessionAttempt[]): number {
  return attempts.filter((a) => a.verdict !== 'falsch').length;
}

/** A session id that sorts by time and needs no uuid dependency. */
export function newSessionId(now: number = Date.now()): string {
  return `s-${now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
