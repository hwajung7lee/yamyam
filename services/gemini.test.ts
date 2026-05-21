import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPricesFromGemini } from "./gemini";

function mockGeminiText(text: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => ({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
    }),
  );
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPricesFromGemini", () => {
  it("JSON 배열 응답 → market='AI 추정'인 PriceData[]로 파싱", async () => {
    mockGeminiText(
      '[{"itemName":"배추","unit":"1포기","price":3200},{"itemName":"무","unit":"1개","price":1500}]',
    );
    const prices = await fetchPricesFromGemini("2026-05-21");
    expect(prices).toHaveLength(2);
    expect(prices[0]).toMatchObject({
      itemName: "배추",
      price: 3200,
      market: "AI 추정",
      date: "2026-05-21",
    });
  });

  it("코드블록/잡텍스트로 감싼 JSON도 추출한다", async () => {
    mockGeminiText('```json\n[{"itemName":"사과","unit":"1개","price":2000}]\n```');
    const prices = await fetchPricesFromGemini("2026-05-21");
    expect(prices[0].itemName).toBe("사과");
  });

  it("API 키가 없으면 에러를 던진다", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(fetchPricesFromGemini("2026-05-21")).rejects.toThrow();
  });

  it("유효 데이터가 없으면 에러를 던진다", async () => {
    mockGeminiText("죄송합니다 가격을 모릅니다");
    await expect(fetchPricesFromGemini("2026-05-21")).rejects.toThrow();
  });
});
