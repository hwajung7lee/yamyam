"use client";

import { Flame, CheckCircle2, XCircle, Check, ArrowRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/quiz";

const CIRCLED = ["①", "②", "③", "④"] as const;

function formatPrice(won: number): string {
  return `${won.toLocaleString("ko-KR")}원`;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export interface QuestionScreenProps {
  question: Question;
  status: "playing" | "correct" | "wrong";
  streak: number;
  selectedIndex: number | null;
  onAnswer: (index: number) => void;
  onNext: () => void;
  onSeeResult: () => void;
}

export function QuestionScreen({
  question,
  status,
  streak,
  selectedIndex,
  onAnswer,
  onNext,
  onSeeResult,
}: QuestionScreenProps) {
  const revealed = status !== "playing";
  const { itemName, unit, options, correctIndex, actualPrice, market, date } =
    question;

  return (
    <div className="@container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Flame className="size-5 text-primary" />
          연속 정답 <span className="text-lg font-bold">{streak}</span>
        </span>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-1 py-8 text-center">
          <div className="text-2xl font-bold">{itemName}</div>
          <div className="text-muted-foreground">{unit} 가격은?</div>
        </CardContent>
      </Card>

      {revealed && (
        <div
          className="flex items-center gap-2 font-bold"
          role="status"
          aria-live="polite"
        >
          {status === "correct" ? (
            <>
              <CheckCircle2 className="size-6 text-primary" />
              <span>정답!</span>
            </>
          ) : (
            <>
              <XCircle className="size-6 text-destructive" />
              <span>오답!</span>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isSelected = i === selectedIndex;
          return (
            <Button
              key={i}
              variant="outline"
              disabled={revealed}
              onClick={() => onAnswer(i)}
              data-correct={revealed && isCorrect ? "true" : undefined}
              className={cn(
                "h-auto justify-between py-4 text-base font-bold disabled:opacity-100",
                revealed && isCorrect && "border-primary ring-2 ring-primary",
                revealed && isSelected && !isCorrect && "border-destructive",
              )}
            >
              <span>
                {CIRCLED[i]} {formatPrice(opt.min)} ~ {formatPrice(opt.max)}
              </span>
              {revealed && isCorrect && (
                <Check className="size-4 text-primary" aria-label="정답" />
              )}
            </Button>
          );
        })}
      </div>

      {revealed && (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">실제 가격</span>
            <span className="text-lg font-bold">
              {itemName} {unit} {formatPrice(actualPrice)}
            </span>
            <span className="text-xs text-muted-foreground">
              {market} · {formatDate(date)} 기준
              {question.fromCache && (
                <Badge variant="secondary" className="ml-2">
                  최근 시세
                </Badge>
              )}
            </span>
          </CardContent>
        </Card>
      )}

      {status === "correct" && (
        <Button onClick={onNext} className="w-full">
          다음 문제
          <ArrowRight data-icon="inline-end" />
        </Button>
      )}
      {status === "wrong" && (
        <Button onClick={onSeeResult} className="w-full">
          결과 보기
          <Flag data-icon="inline-end" />
        </Button>
      )}
    </div>
  );
}
