import type { PriceData } from "@/types/quiz";
import { fetchPricesFromKamis } from "./kamis";
import { fetchPricesFromGemini } from "./gemini";
import { readCache, writeCache } from "@/lib/price-cache";

export interface PriceResult {
  data: PriceData[];
  fromCache: boolean;
}

/**
 * 가격 데이터를 폴백 체인으로 가져온다: KAMIS 실시간 → 직전 캐시 → Gemini 추정.
 * KAMIS·Gemini 성공 시 모두 캐시에 저장하므로, 이후 요청은 LLM을 다시 호출하지 않고
 * 캐시를 재사용한다(로딩 지연 방지). 데이터의 estimated 플래그로 출처를 구분한다.
 */
export async function getPrices(date: string): Promise<PriceResult> {
  // 1) KAMIS 실시간
  try {
    const data = await fetchPricesFromKamis(date);
    writeCache(data);
    return { data, fromCache: false };
  } catch {
    // 2) 직전 캐시 (KAMIS 또는 이전 Gemini 결과)
    const cached = readCache();
    if (cached && cached.length > 0) {
      return { data: cached, fromCache: true };
    }
    // 3) Gemini 추정 — 생성 결과를 캐시에 저장해 다음 문제부터 재사용
    const aiData = await fetchPricesFromGemini(date);
    writeCache(aiData);
    return { data: aiData, fromCache: false };
  }
}
