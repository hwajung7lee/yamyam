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
};

const noop = () => {};

describe("QuestionScreen", () => {
  it("진입 시 품목·단위, 보기 4개, 연속 정답 수를 표시한다", () => {
    render(
      <QuestionScreen
        question={question}
        status="playing"
        streak={3}
        selectedIndex={null}
        onAnswer={noop}
        onNext={noop}
        onSeeResult={noop}
      />,
    );
    expect(screen.getByText("배추")).toBeInTheDocument();
    expect(screen.getByText("1포기 가격은?")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // 보기 4개 (옵션 버튼)
    expect(screen.getByRole("button", { name: /1,000원 ~ 2,000원/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /4,000원 ~ 5,000원/ })).toBeInTheDocument();
  });

  it("보기 클릭 → onAnswer(인덱스) 호출", async () => {
    const onAnswer = vi.fn();
    render(
      <QuestionScreen
        question={question}
        status="playing"
        streak={0}
        selectedIndex={null}
        onAnswer={onAnswer}
        onNext={noop}
        onSeeResult={noop}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /2,000원 ~ 3,000원/ }));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("정답 공개 → '정답' + 실제 가격/출처 + '다음 문제', 보기 비활성", () => {
    render(
      <QuestionScreen
        question={question}
        status="correct"
        streak={4}
        selectedIndex={2}
        onAnswer={noop}
        onNext={noop}
        onSeeResult={noop}
      />,
    );
    expect(screen.getByText("정답!")).toBeInTheDocument();
    expect(screen.getByText("배추 1포기 3,200원")).toBeInTheDocument();
    expect(screen.getByText(/서울 도매 · 5월 21일 기준/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeInTheDocument();
    // 보기 버튼 비활성
    expect(screen.getByRole("button", { name: /1,000원 ~ 2,000원/ })).toBeDisabled();
  });

  it("오답 공개 → '오답' + 실제 가격 + 정답 보기 표시 + '결과 보기', 보기 비활성", () => {
    render(
      <QuestionScreen
        question={question}
        status="wrong"
        streak={3}
        selectedIndex={0}
        onAnswer={noop}
        onNext={noop}
        onSeeResult={noop}
      />,
    );
    expect(screen.getByText("오답!")).toBeInTheDocument();
    expect(screen.getByText("배추 1포기 3,200원")).toBeInTheDocument();
    // 정답 보기에 정답 표식
    expect(screen.getByLabelText("정답")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3,000원 ~ 4,000원/ })).toBeDisabled();
  });

  it("정답 공개에서 '다음 문제' 클릭 → onNext 호출", async () => {
    const onNext = vi.fn();
    render(
      <QuestionScreen
        question={question}
        status="correct"
        streak={1}
        selectedIndex={2}
        onAnswer={noop}
        onNext={onNext}
        onSeeResult={noop}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "다음 문제" }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
