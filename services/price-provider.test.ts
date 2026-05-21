import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./kamis", () => ({ fetchPricesFromKamis: vi.fn() }));
vi.mock("./gemini", () => ({ fetchPricesFromGemini: vi.fn() }));
vi.mock("@/lib/price-cache", () => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
}));

import { fetchPricesFromKamis } from "./kamis";
import { fetchPricesFromGemini } from "./gemini";
import { readCache, writeCache } from "@/lib/price-cache";
import { getPrices } from "./price-provider";

const kamisData = [
  { itemName: "배추", unit: "1포기", price: 3200, date: "2026-05-21", market: "소매" },
];
const aiData = [
  { itemName: "무", unit: "1개", price: 1500, date: "2026-05-21", market: "AI 추정" },
];

beforeEach(() => {
  vi.mocked(fetchPricesFromKamis).mockReset();
  vi.mocked(fetchPricesFromGemini).mockReset();
  vi.mocked(readCache).mockReset();
  vi.mocked(writeCache).mockReset();
});

describe("getPrices 폴백 체인", () => {
  it("KAMIS 성공 → fromCache=false, estimated=false, 캐시에 저장", async () => {
    vi.mocked(fetchPricesFromKamis).mockResolvedValue(kamisData);
    const result = await getPrices("2026-05-21");
    expect(result).toMatchObject({ fromCache: false, estimated: false });
    expect(result.data).toEqual(kamisData);
    expect(writeCache).toHaveBeenCalledOnce();
  });

  it("KAMIS 실패 + 캐시 존재 → fromCache=true, estimated=false", async () => {
    vi.mocked(fetchPricesFromKamis).mockRejectedValue(new Error("kamis down"));
    vi.mocked(readCache).mockReturnValue(kamisData);
    const result = await getPrices("2026-05-21");
    expect(result).toMatchObject({ fromCache: true, estimated: false });
    expect(fetchPricesFromGemini).not.toHaveBeenCalled();
  });

  it("KAMIS 실패 + 캐시 없음 → Gemini 폴백, estimated=true", async () => {
    vi.mocked(fetchPricesFromKamis).mockRejectedValue(new Error("kamis down"));
    vi.mocked(readCache).mockReturnValue(null);
    vi.mocked(fetchPricesFromGemini).mockResolvedValue(aiData);
    const result = await getPrices("2026-05-21");
    expect(result).toMatchObject({ fromCache: false, estimated: true });
    expect(result.data).toEqual(aiData);
  });

  it("KAMIS·캐시·Gemini 모두 실패 → 에러를 던진다", async () => {
    vi.mocked(fetchPricesFromKamis).mockRejectedValue(new Error("kamis down"));
    vi.mocked(readCache).mockReturnValue(null);
    vi.mocked(fetchPricesFromGemini).mockRejectedValue(new Error("gemini down"));
    await expect(getPrices("2026-05-21")).rejects.toThrow();
  });
});
