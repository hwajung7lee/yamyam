"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorScreenProps {
  onRetry: () => void;
}

/** 가격 데이터를 불러올 수 없을 때(캐시도 없음) 표시한다. */
export function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <div className="@container mx-auto flex max-w-2xl flex-col items-center gap-4 p-6 py-16 text-center">
      <CloudOff className="size-12 text-muted-foreground" />
      <div>
        <p className="text-lg font-bold">가격 정보를 불러올 수 없어요</p>
        <p className="mt-2 text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요
        </p>
      </div>
      <Button onClick={onRetry}>
        <RefreshCw data-icon="inline-start" />
        다시 시도
      </Button>
    </div>
  );
}
