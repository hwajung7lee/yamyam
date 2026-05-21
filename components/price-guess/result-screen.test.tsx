import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultScreen } from "./result-screen";

const noop = () => {};

const baseProps = {
  finalScore: 3,
  total: 10,
  onRegistered: noop,
  onRestart: noop,
  onShowRanking: noop,
};

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => [] }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResultScreen", () => {
  it("최종 점수(맞힌 개수 / 총 문제)를 표시한다", () => {
    render(<ResultScreen {...baseProps} />);
    expect(screen.getByText("최종 점수")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 10")).toBeInTheDocument();
  });

  it("닉네임 입력 후 등록 → onRegistered(닉네임) 호출", async () => {
    mockFetchOk();
    const onRegistered = vi.fn();
    render(<ResultScreen {...baseProps} onRegistered={onRegistered} />);
    await userEvent.type(screen.getByPlaceholderText("닉네임 입력"), "홍길동");
    await userEvent.click(screen.getByRole("button", { name: "등록" }));
    await waitFor(() => expect(onRegistered).toHaveBeenCalledWith("홍길동"));
  });

  it("빈 닉네임으로 등록 → '닉네임을 입력하세요' 안내, 등록되지 않음", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const onRegistered = vi.fn();
    render(<ResultScreen {...baseProps} onRegistered={onRegistered} />);
    await userEvent.click(screen.getByRole("button", { name: "등록" }));
    expect(screen.getByText("닉네임을 입력하세요")).toBeInTheDocument();
    expect(onRegistered).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("등록 완료 후에는 버튼이 '등록됨' 비활성 (중복 등록 방지)", async () => {
    mockFetchOk();
    render(<ResultScreen {...baseProps} />);
    await userEvent.type(screen.getByPlaceholderText("닉네임 입력"), "홍길동");
    await userEvent.click(screen.getByRole("button", { name: "등록" }));
    const registeredBtn = await screen.findByRole("button", { name: "등록됨" });
    expect(registeredBtn).toBeDisabled();
  });

  it("'다시 하기' 클릭 → onRestart 호출", async () => {
    const onRestart = vi.fn();
    render(<ResultScreen {...baseProps} onRestart={onRestart} />);
    await userEvent.click(screen.getByRole("button", { name: /다시 하기/ }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
