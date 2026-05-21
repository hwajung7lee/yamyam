import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Game } from "./game";
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

function mockFetch(q: Question, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => q }),
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Game", () => {
  it("시작 화면: '게임 시작' 버튼과 최고 기록 '-'(없음)을 표시", () => {
    render(<Game />);
    expect(screen.getByRole("button", { name: /게임 시작/ })).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("최고 기록이 저장돼 있으면 숫자로 표시", () => {
    localStorage.setItem("price-guess:best", "12");
    render(<Game />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("'게임 시작' 클릭 → 문제 화면으로 전환", async () => {
    mockFetch(sampleQuestion);
    render(<Game />);
    await userEvent.click(screen.getByRole("button", { name: /게임 시작/ }));
    expect(await screen.findByText("배추")).toBeInTheDocument();
  });

  it("조회 실패(캐시 없음) → '가격 정보를 불러올 수 없어요' + '다시 시도'", async () => {
    mockFetch(sampleQuestion, false);
    render(<Game />);
    await userEvent.click(screen.getByRole("button", { name: /게임 시작/ }));
    expect(
      await screen.findByText("가격 정보를 불러올 수 없어요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시 시도/ })).toBeInTheDocument();
  });

  it("'다시 시도' 후 조회 성공 → 문제 화면으로 전환", async () => {
    mockFetch(sampleQuestion, false);
    render(<Game />);
    await userEvent.click(screen.getByRole("button", { name: /게임 시작/ }));
    await screen.findByText("가격 정보를 불러올 수 없어요");

    mockFetch(sampleQuestion, true);
    await userEvent.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(await screen.findByText("배추")).toBeInTheDocument();
  });

  it("시작 화면 '랭킹 보기' 클릭 → 랭킹 화면으로 전환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    render(<Game />);
    await userEvent.click(screen.getByRole("button", { name: /랭킹 보기/ }));
    expect(await screen.findByText("전체 랭킹")).toBeInTheDocument();
  });
});
