import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuiz, TOTAL_QUESTIONS } from "./use-quiz";
import type { Question } from "@/types/quiz";

const sampleQuestion: Question = {
  itemName: "배추",
  unit: "1포기",
  options: [
    { min: 1000, max: 2000 },
    { min: 2000, max: 3000 },
    { min: 3000, max: 4000 },
    { min: 4000, max: 5000 },
  ],
  correctIndex: 2,
  actualPrice: 3200,
  date: "2026-05-21",
  market: "소매",
  fromCache: false,
  estimated: false,
};

function mockFetchOnce(q: Question, ok = true) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => q }));
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useQuiz", () => {
  it("start() → 1번 문제, status=playing, correctCount=0, total=10", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("playing");
    expect(result.current.questionNumber).toBe(1);
    expect(result.current.correctCount).toBe(0);
    expect(result.current.total).toBe(TOTAL_QUESTIONS);
    expect(result.current.isLastQuestion).toBe(false);
  });

  it("정답 선택 → status=correct, correctCount 1 증가", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.answer(2));
    expect(result.current.status).toBe("correct");
    expect(result.current.correctCount).toBe(1);
  });

  it("오답 선택 → status=wrong, correctCount 유지(게임 계속)", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.answer(0));
    expect(result.current.status).toBe("wrong");
    expect(result.current.correctCount).toBe(0);
  });

  it("next() → 문제 번호 증가, status=playing", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.answer(0)); // 오답이어도
    mockFetchOnce({ ...sampleQuestion, itemName: "무" });
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.questionNumber).toBe(2);
    expect(result.current.status).toBe("playing");
    expect(result.current.question?.itemName).toBe("무");
  });

  it("10번째 문제에서 isLastQuestion=true", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    for (let i = 1; i < TOTAL_QUESTIONS; i++) {
      mockFetchOnce(sampleQuestion);
      await act(async () => {
        await result.current.next();
      });
    }
    expect(result.current.questionNumber).toBe(TOTAL_QUESTIONS);
    expect(result.current.isLastQuestion).toBe(true);
  });

  it("조회 실패 → status=error", async () => {
    mockFetchOnce(sampleQuestion, false);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
