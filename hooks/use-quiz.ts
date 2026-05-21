"use client";

import { useState, useCallback } from "react";
import type { Question } from "@/types/quiz";

/** 한 게임의 총 문제 수. */
export const TOTAL_QUESTIONS = 10;

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
  selectedIndex: number | null;
  /** 현재 문제 번호 (1-based). */
  questionNumber: number;
  /** 지금까지 맞힌 개수. */
  correctCount: number;
  /** 한 게임 총 문제 수. */
  total: number;
  /** 현재 문제가 마지막 문제인지. */
  isLastQuestion: boolean;
  start: () => Promise<void>;
  answer: (index: number) => void;
  next: () => Promise<void>;
  retry: () => Promise<void>;
}

/** 10문제 한 판의 진행·정답 개수·판정을 관리한다. 오답이어도 게임은 계속된다. */
export function useQuiz(): UseQuiz {
  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

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
    setCorrectCount(0);
    setQuestionNumber(1);
    await fetchQuestion();
  }, [fetchQuestion]);

  const next = useCallback(async () => {
    setQuestionNumber((n) => n + 1);
    await fetchQuestion();
  }, [fetchQuestion]);

  // 현재 문제 번호를 유지한 채 다시 불러온다(조회 실패 복구용).
  const retry = useCallback(async () => {
    await fetchQuestion();
  }, [fetchQuestion]);

  const answer = useCallback(
    (index: number) => {
      if (!question || status !== "playing") return;
      setSelectedIndex(index);
      if (index === question.correctIndex) {
        setCorrectCount((c) => c + 1);
        setStatus("correct");
      } else {
        setStatus("wrong");
      }
    },
    [question, status],
  );

  return {
    question,
    status,
    selectedIndex,
    questionNumber,
    correctCount,
    total: TOTAL_QUESTIONS,
    isLastQuestion: questionNumber >= TOTAL_QUESTIONS,
    start,
    answer,
    next,
    retry,
  };
}
