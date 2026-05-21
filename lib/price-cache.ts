import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { PriceData } from "@/types/quiz";

/**
 * 캐시 파일 경로. 테스트에서 PRICE_CACHE_FILE로 덮어쓸 수 있다.
 * 기본값은 OS 임시 디렉토리 — Vercel 등 서버리스는 /tmp만 쓰기 가능하다.
 */
function cacheFile(): string {
  return (
    process.env.PRICE_CACHE_FILE ??
    path.join(os.tmpdir(), "yamyam-price-cache.json")
  );
}

/** 마지막으로 성공한 가격 데이터를 읽는다. 없거나 손상 시 null. */
export function readCache(): PriceData[] | null {
  try {
    const raw = fs.readFileSync(cacheFile(), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PriceData[]) : null;
  } catch {
    return null;
  }
}

/**
 * 가격 데이터를 캐시에 저장한다. 캐싱은 best-effort —
 * 읽기 전용 파일시스템 등에서 실패해도 게임 진행을 막지 않는다.
 */
export function writeCache(data: PriceData[]): void {
  try {
    const file = cacheFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data), "utf-8");
  } catch {
    // 캐시 저장 실패는 무시 (다음 요청에서 다시 조회/생성)
  }
}
