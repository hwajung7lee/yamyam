"use client";

import { useState, useCallback } from "react";
import type { Question } from "@/types/quiz";

export type QuizStatus =
  | "idle"
  | "loading"
  | "playing"
  | "correct"
  | "wrong"
  | "error";

export interface UseQuiz {
  question: Question | null;
  status: QuizStatus;
  streak: number;
  selectedIndex: number | null;
  start: () => Promise<void>;
  answer: (index: number) => void;
  next: () => Promise<void>;
}

/** 게임 한 판의 문제 흐름·연속 정답·정답 판정을 관리한다. */
export function useQuiz(): UseQuiz {
  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [streak, setStreak] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fetchQuestion = useCallback(async () => {
    setStatus("loading");
    setSelectedIndex(null);
    try {
      const res = await fetch("/api/quiz");
      if (!res.ok) throw new Error(`quiz fetch failed: ${res.status}`);
      const q: Question = await res.json();
      setQuestion(q);
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }, []);

  const start = useCallback(async () => {
    setStreak(0);
    await fetchQuestion();
  }, [fetchQuestion]);

  const next = useCallback(async () => {
    await fetchQuestion();
  }, [fetchQuestion]);

  const answer = useCallback(
    (index: number) => {
      if (!question || status !== "playing") return;
      setSelectedIndex(index);
      if (index === question.correctIndex) {
        setStreak((s) => s + 1);
        setStatus("correct");
      } else {
        setStatus("wrong");
      }
    },
    [question, status],
  );

  return { question, status, streak, selectedIndex, start, answer, next };
}
