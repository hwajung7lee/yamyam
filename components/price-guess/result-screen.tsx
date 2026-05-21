"use client";

import { useState } from "react";
import { Flame, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface ResultScreenProps {
  finalScore: number;
  total: number;
  onRegistered: (nickname: string) => void;
  onRestart: () => void;
  onShowRanking: () => void;
}

export function ResultScreen({
  finalScore,
  total,
  onRegistered,
  onRestart,
  onShowRanking,
}: ResultScreenProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력하세요");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/ranking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: trimmed, score: finalScore }),
      });
      if (!res.ok) throw new Error("등록 실패");
      setRegistered(true);
      onRegistered(trimmed);
    } catch {
      setError("등록에 실패했어요. 다시 시도해 주세요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="@container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Flame className="size-10 text-primary" />
        <span className="text-sm text-muted-foreground">최종 점수</span>
        <span className="text-5xl font-bold tabular-nums">
          {finalScore}
          <span className="text-2xl text-muted-foreground"> / {total}</span>
        </span>
      </div>

      <form onSubmit={submit}>
        <FieldGroup>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="nickname"
                name="nickname"
                autoComplete="off"
                spellCheck={false}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력"
                disabled={registered}
                aria-invalid={error ? true : undefined}
              />
              <Button type="submit" disabled={submitting || registered}>
                {registered ? "등록됨" : "등록"}
              </Button>
            </div>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </FieldGroup>
      </form>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onRestart}>
          <RotateCcw data-icon="inline-start" />
          다시 하기
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onShowRanking}>
          <Trophy data-icon="inline-start" />
          랭킹 보기
        </Button>
      </div>
    </div>
  );
}
