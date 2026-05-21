import type { PriceData } from "@/types/quiz";

// 과부하/쿼터에 대비해 여러 모델을 순서대로 시도한다.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];
const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiItem {
  itemName?: string;
  unit?: string;
  price?: number | string;
}

/** 모델 응답 텍스트에서 첫 JSON 배열을 추출한다. 실패 시 null. */
function extractJsonArray(text: string): unknown {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/**
 * KAMIS·캐시가 모두 없을 때의 폴백. Gemini로 한국 농수산물 추정 시세를 생성한다.
 * 반환 항목의 market은 "AI 추정"으로 표시되어 실데이터와 구분된다.
 */
export async function fetchPricesFromGemini(date: string): Promise<PriceData[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY가 없습니다");

  const prompt =
    '한국의 대표적인 농수산물 소매 가격 8개를 JSON 배열로만 답하라. ' +
    '각 원소는 {"itemName":"품목명","unit":"단위(예: 1포기, 1kg)","price":원_단위_정수} 형식이다. ' +
    "실제 한국 시세에 가깝게 추정하라. 코드블록 없이 JSON 배열만 출력하라.";
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

  let text = "";
  let lastError: unknown = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${endpoint(model)}?key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!res.ok) {
        lastError = new Error(`Gemini 응답 오류: ${res.status}`);
        continue; // 다음 모델 시도
      }
      const json = await res.json();
      text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text) break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!text) throw lastError ?? new Error("Gemini 응답 없음");

  const parsed = extractJsonArray(text);

  const prices: PriceData[] = (Array.isArray(parsed) ? (parsed as GeminiItem[]) : [])
    .map((p) => ({
      itemName: String(p.itemName ?? "").trim(),
      unit: String(p.unit ?? "").trim(),
      price: Number(p.price),
      date,
      market: "AI 추정",
    }))
    .filter((p) => p.itemName && Number.isFinite(p.price) && p.price > 0);

  if (prices.length === 0) throw new Error("Gemini 유효 데이터가 없습니다");
  return prices;
}
