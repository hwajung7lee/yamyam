import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPricesFromKamis } from "./kamis";

const okPayload = {
  data: {
    error_code: "000",
    item: [
      { item_name: "배추", unit: "1포기", dpr1: "3,200" },
      { item_name: "무", unit: "1개", dpr1: "1,500" },
      { item_name: "상추", unit: "100g", dpr1: "-" }, // 무효 → 필터됨
    ],
  },
};

beforeEach(() => {
  process.env.KAMIS_CERT_KEY = "test-key";
  process.env.KAMIS_CERT_ID = "test-id";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPricesFromKamis", () => {
  it("정상 KAMIS 응답 → 유효 가격만 파싱한 PriceData[] 반환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => okPayload }),
    );
    const prices = await fetchPricesFromKamis("2026-05-21");
    expect(prices).toHaveLength(2); // 상추(가격 "-")는 제외
    expect(prices[0]).toMatchObject({
      itemName: "배추",
      unit: "1포기",
      price: 3200,
      date: "2026-05-21",
      market: "소매",
    });
  });

  it("인증 정보가 없으면 에러를 던진다", async () => {
    delete process.env.KAMIS_CERT_KEY;
    delete process.env.KAMIS_CERT_ID;
    await expect(fetchPricesFromKamis("2026-05-21")).rejects.toThrow();
  });

  it("HTTP 오류 응답이면 에러를 던진다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(fetchPricesFromKamis("2026-05-21")).rejects.toThrow();
  });
});
