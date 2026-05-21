import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionScreen } from "./question-screen";
import type { Question } from "@/types/quiz";

const question: Question = {
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
  market: "서울 도매",
  fromCache: false,
  estimated: false,
};

const noop = () => {};

const baseProps = {
  question,
  questionNumber: 4,
  total: 10,
  correctCount: 3,
  isLast: false,
  selectedIndex: null as number | null,
  onAnswer: noop,
  onNext: noop,
  onFinish: noop,
};

describe("QuestionScreen", () => {
  it("진입 시 품목·단위, 보기 4개, 진행도(N/총)·맞힌 개수를 표시한다", () => {
    render(<QuestionScreen {...baseProps} status="playing" />);
    expect(screen.getByText("배추")).toBeInTheDocument();
    expect(screen.getByText("1포기 가격은?")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument(); // 현재 문제
    expect(screen.getByText("/ 10")).toBeInTheDocument(); // 총 문제
    expect(screen.getByText("3")).toBeInTheDocument(); // 맞힌 개수
    expect(screen.getByRole("button", { name: /1,000원 ~ 2,000원/ })).toBeInTheDocument();
  });

  it("보기 클릭 → onAnswer(인덱스) 호출", async () => {
    const onAnswer = vi.fn();
    render(<QuestionScreen {...baseProps} status="playing" onAnswer={onAnswer} />);
    await userEvent.click(screen.getByRole("button", { name: /2,000원 ~ 3,000원/ }));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("정답 공개 → '정답' + 실제 가격/출처 + '다음 문제', 보기 비활성", () => {
    render(<QuestionScreen {...baseProps} status="correct" selectedIndex={2} />);
    expect(screen.getByText("정답!")).toBeInTheDocument();
    expect(screen.getByText("배추 1포기 3,200원")).toBeInTheDocument();
    expect(screen.getByText(/서울 도매 · 5월 21일 기준/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1,000원 ~ 2,000원/ })).toBeDisabled();
  });

  it("오답 공개 → '오답' + 정답 보기 표시 + '다음 문제'(게임 계속), 보기 비활성", () => {
    render(<QuestionScreen {...baseProps} status="wrong" selectedIndex={0} />);
    expect(screen.getByText("오답!")).toBeInTheDocument();
    expect(screen.getByText("배추 1포기 3,200원")).toBeInTheDocument();
    expect(screen.getByLabelText("정답")).toBeInTheDocument();
    // 오답이어도 게임은 계속되므로 '결과 보기'가 아니라 '다음 문제'
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3,000원 ~ 4,000원/ })).toBeDisabled();
  });

  it("마지막 문제 공개 → '결과 보기' 버튼", () => {
    render(<QuestionScreen {...baseProps} status="correct" isLast selectedIndex={2} />);
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다음 문제" })).not.toBeInTheDocument();
  });

  it("AI 추정 가격이면 'AI 추정' 배지를 표시한다", () => {
    render(
      <QuestionScreen
        {...baseProps}
        question={{ ...question, estimated: true, market: "AI 추정" }}
        status="correct"
        selectedIndex={2}
      />,
    );
    expect(screen.getByText("AI 추정")).toBeInTheDocument();
  });

  it("정답 공개에서 '다음 문제' 클릭 → onNext 호출", async () => {
    const onNext = vi.fn();
    render(<QuestionScreen {...baseProps} status="correct" selectedIndex={2} onNext={onNext} />);
    await userEvent.click(screen.getByRole("button", { name: "다음 문제" }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("마지막 문제에서 '결과 보기' 클릭 → onFinish 호출", async () => {
    const onFinish = vi.fn();
    render(
      <QuestionScreen {...baseProps} status="correct" isLast selectedIndex={2} onFinish={onFinish} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(onFinish).toHaveBeenCalledOnce();
  });
});
