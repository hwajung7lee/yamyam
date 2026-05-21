import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/price-cache", () => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
}));

import { readCache, writeCache } from "@/lib/price-cache";
import { fetchPricesFromKamis, getPrices } from "./kamis";

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
  vi.mocked(readCache).mockReset();
  vi.mocked(writeCache).mockReset();
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
});

describe("getPrices", () => {
  it("성공 시 캐시에 저장하고 fromCache=false 반환", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => okPayload }),
    );
    const result = await getPrices("2026-05-21");
    expect(result.fromCache).toBe(false);
    expect(result.data).toHaveLength(2);
    expect(writeCache).toHaveBeenCalledOnce();
  });

  it("API 실패 + 캐시 존재 → 캐시 반환, fromCache=true, 기준일은 캐시 날짜", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    vi.mocked(readCache).mockReturnValue([
      { itemName: "배추", unit: "1포기", price: 3200, date: "2026-05-20", market: "소매" },
    ]);
    const result = await getPrices("2026-05-21");
    expect(result.fromCache).toBe(true);
    expect(result.data[0].date).toBe("2026-05-20");
  });

  it("API 실패 + 캐시 없음 → 에러를 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    vi.mocked(readCache).mockReturnValue(null);
    await expect(getPrices("2026-05-21")).rejects.toThrow();
  });
});
