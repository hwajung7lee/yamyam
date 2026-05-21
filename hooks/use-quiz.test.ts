import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuiz } from "./use-quiz";
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
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => q }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useQuiz", () => {
  it("start() → 문제를 불러오고 status=playing, streak=0", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.status).toBe("playing");
    expect(result.current.question?.itemName).toBe("배추");
    expect(result.current.streak).toBe(0);
  });

  it("정답 선택 → status=correct, streak 1 증가", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      result.current.answer(2); // correctIndex
    });
    expect(result.current.status).toBe("correct");
    expect(result.current.streak).toBe(1);
  });

  it("오답 선택 → status=wrong, streak 유지", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      result.current.answer(0); // 오답
    });
    expect(result.current.status).toBe("wrong");
    expect(result.current.streak).toBe(0);
  });

  it("next() → 새 문제를 불러오고 status=playing", async () => {
    mockFetchOnce(sampleQuestion);
    const { result } = renderHook(() => useQuiz());
    await act(async () => {
      await result.current.start();
    });
    act(() => result.current.answer(2));
    mockFetchOnce({ ...sampleQuestion, itemName: "무" });
    await act(async () => {
      await result.current.next();
    });
    expect(result.current.status).toBe("playing");
    expect(result.current.question?.itemName).toBe("무");
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
