"use client";

import { useEffect, useState } from "react";
import { Trophy, Play, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RankEntry } from "@/types/ranking";

const TOP_N = 10;

export interface RankingScreenProps {
  myNickname: string | null;
  onRestart: () => void;
}

export function RankingScreen({ myNickname, onRestart }: RankingScreenProps) {
  const [entries, setEntries] = useState<RankEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ranking")
      .then((r) => r.json())
      .then((data: RankEntry[]) => {
        if (active) setEntries(data);
      })
      .catch(() => {
        if (active) setEntries([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const list = (entries ?? []).slice(0, TOP_N);

  return (
    <div className="@container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Trophy className="size-5" />
        전체 랭킹
      </h2>

      {entries === null ? (
        <p role="status" className="text-muted-foreground">
          불러오는 중…
        </p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">아직 기록이 없어요</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {list.map((entry, i) => {
            const isMe = myNickname !== null && entry.nickname === myNickname;
            return (
              <li
                key={i}
                data-me={isMe || undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3",
                  isMe && "border-primary bg-primary/5 font-bold",
                )}
              >
                <span className="w-6 text-center font-bold">{i + 1}</span>
                <span className="flex flex-1 items-center gap-1">
                  {isMe && <User className="size-4" aria-hidden />}
                  {entry.nickname}
                  {isMe && " (나)"}
                </span>
                <span className="font-bold tabular-nums">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}

      <Button onClick={onRestart} className="w-full">
        <Play data-icon="inline-start" />
        다시 도전
      </Button>
    </div>
  );
}
