import type { PriceData } from "@/types/quiz";
import { fetchPricesFromKamis } from "./kamis";
import { fetchPricesFromGemini } from "./gemini";
import { readCache, writeCache } from "@/lib/price-cache";

export interface PriceResult {
  data: PriceData[];
  fromCache: boolean;
  estimated: boolean;
}

/**
 * 가격 데이터를 폴백 체인으로 가져온다: KAMIS 실시간 → 직전 캐시 → Gemini 추정.
 * KAMIS 성공 시 캐시에 저장한다. 셋 다 실패하면 마지막 에러를 던진다.
 */
export async function getPrices(date: string): Promise<PriceResult> {
  // 1) KAMIS 실시간
  try {
    const data = await fetchPricesFromKamis(date);
    writeCache(data);
    return { data, fromCache: false, estimated: false };
  } catch {
    // 2) 직전 캐시
    const cached = readCache();
    if (cached && cached.length > 0) {
      return { data: cached, fromCache: true, estimated: false };
    }
    // 3) Gemini 추정 (실패 시 throw 전파 → 호출측 503)
    const aiData = await fetchPricesFromGemini(date);
    return { data: aiData, fromCache: false, estimated: true };
  }
}
