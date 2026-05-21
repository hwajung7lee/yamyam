import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RankingScreen } from "./ranking-screen";
import type { RankEntry } from "@/types/ranking";

const noop = () => {};

function mockRanking(list: RankEntry[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => list }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RankingScreen", () => {
  it("점수 내림차순으로 표시한다 (50, 42, 30)", async () => {
    mockRanking([
      { nickname: "높음", score: 50, createdAt: "" },
      { nickname: "중간", score: 42, createdAt: "" },
      { nickname: "낮음", score: 30, createdAt: "" },
    ]);
    render(<RankingScreen myNickname={null} onRestart={noop} />);

    await screen.findByText("높음");
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("높음");
    expect(items[0]).toHaveTextContent("50");
    expect(items[2]).toHaveTextContent("낮음");
    expect(items[2]).toHaveTextContent("30");
  });

  it("내가 등록한 항목이 강조(표식 '(나)' + data-me)된다", async () => {
    mockRanking([
      { nickname: "달려라참치", score: 50, createdAt: "" },
      { nickname: "홍길동", score: 30, createdAt: "" },
    ]);
    render(<RankingScreen myNickname="홍길동" onRestart={noop} />);

    const myRow = (await screen.findByText(/홍길동/)).closest("li");
    expect(myRow).toHaveAttribute("data-me", "true");
    expect(within(myRow as HTMLElement).getByText(/\(나\)/)).toBeInTheDocument();
  });

  it("'다시 도전' 클릭 → onRestart 호출", async () => {
    mockRanking([]);
    const onRestart = vi.fn();
    render(<RankingScreen myNickname={null} onRestart={onRestart} />);
    await userEvent.click(screen.getByRole("button", { name: /다시 도전/ }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
