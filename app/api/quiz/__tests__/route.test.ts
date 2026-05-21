import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PriceRange } from "@/types/quiz";

vi.mock("@/services/kamis", () => ({
  getPrices: vi.fn(),
}));

import { getPrices } from "@/services/kamis";
import { GET } from "../route";

function contains(range: PriceRange, price: number): boolean {
  return price >= range.min && price < range.max;
}

beforeEach(() => {
  vi.mocked(getPrices).mockReset();
});

describe("GET /api/quiz", () => {
  it("200과 Question 형태(보기 4개, 정답 구간이 실제 가격 포함)를 반환한다", async () => {
    vi.mocked(getPrices).mockResolvedValue({
      data: [{ itemName: "배추", unit: "1포기", price: 3200, date: "2026-05-21", market: "소매" }],
      fromCache: false,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const q = await res.json();

    expect(q.itemName).toBe("배추");
    expect(q.unit).toBe("1포기");
    expect(q.actualPrice).toBe(3200);
    expect(q.market).toBe("소매");
    expect(q.fromCache).toBe(false);
    expect(q.options).toHaveLength(4);
    // correctIndex 구간만 실제 가격을 포함
    expect(contains(q.options[q.correctIndex], 3200)).toBe(true);
    expect(q.options.filter((o: PriceRange) => contains(o, 3200))).toHaveLength(1);
  });

  it("캐시 폴백 시 200 + fromCache=true, date는 캐시 날짜", async () => {
    vi.mocked(getPrices).mockResolvedValue({
      data: [{ itemName: "무", unit: "1개", price: 1500, date: "2026-05-20", market: "소매" }],
      fromCache: true,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const q = await res.json();
    expect(q.fromCache).toBe(true);
    expect(q.date).toBe("2026-05-20");
  });

  it("가격 데이터를 못 가져오면 503을 반환한다", async () => {
    vi.mocked(getPrices).mockRejectedValue(new Error("no data"));
    const res = await GET();
    expect(res.status).toBe(503);
  });
});
