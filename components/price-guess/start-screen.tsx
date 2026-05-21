"use client";

import { Carrot, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface StartScreenProps {
  bestScore: number | null;
  onStart: () => void;
  onShowRanking: () => void;
}

export function StartScreen({
  bestScore,
  onStart,
  onShowRanking,
}: StartScreenProps) {
  return (
    <div className="@container mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 py-10 text-center">
      <Carrot className="size-12 text-primary" />
      <div>
        <h1 className="text-2xl font-bold">물가 맞히기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          오늘의 농수산물 시세, 가격대를 맞혀보세요
        </p>
      </div>

      <Card className="w-full max-w-xs">
        <CardContent className="flex flex-col items-center gap-1 py-2">
          <span className="text-xs text-muted-foreground">내 최고 점수</span>
          <span className="text-3xl font-bold tabular-nums">{bestScore ?? "-"}</span>
          <span className="text-xs text-muted-foreground">10문제 중</span>
        </CardContent>
      </Card>

      <Button size="lg" onClick={onStart}>
        <Play data-icon="inline-start" />
        게임 시작
      </Button>
      <Button variant="ghost" onClick={onShowRanking}>
        <Trophy data-icon="inline-start" />
        랭킹 보기
      </Button>
    </div>
  );
}
