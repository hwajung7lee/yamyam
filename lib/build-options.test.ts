import { describe, it, expect } from "vitest";
import { buildOptions } from "./build-options";
import type { PriceRange } from "@/types/quiz";

function contains(range: PriceRange, price: number): boolean {
  return price >= range.min && price < range.max;
}

describe("buildOptions", () => {
  it("실제 가격 3,200원 → 보기 4개, 정확히 1개 구간만 3,200을 포함", () => {
    const { options } = buildOptions(3200);
    expect(options).toHaveLength(4);
    const containing = options.filter((o) => contains(o, 3200));
    expect(containing).toHaveLength(1);
  });

  it("4개 구간은 서로 겹치지 않는다 (정렬 시 max <= 다음 min)", () => {
    const { options } = buildOptions(3200);
    const sorted = [...options].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].max).toBeLessThanOrEqual(sorted[i + 1].min);
    }
  });

  it("correctIndex가 가리키는 구간이 실제 가격을 포함한다 (여러 호출·여러 가격에서 성립)", () => {
    const prices = [320, 3200, 8500, 32000, 125000, 999, 1000];
    for (const price of prices) {
      for (let i = 0; i < 50; i++) {
        const { options, correctIndex } = buildOptions(price);
        expect(options).toHaveLength(4);
        expect(contains(options[correctIndex], price)).toBe(true);
        // 정답은 정확히 하나
        expect(options.filter((o) => contains(o, price))).toHaveLength(1);
        // 구간 폭은 모두 양수
        for (const o of options) expect(o.max).toBeGreaterThan(o.min);
      }
    }
  });

  it("구간 경계가 음수가 되지 않는다", () => {
    const { options } = buildOptions(300);
    for (const o of options) expect(o.min).toBeGreaterThanOrEqual(0);
  });

  it("구간 폭보다 낮은 가격(예: 150원)도 정답 구간이 가격을 포함한다", () => {
    for (let i = 0; i < 50; i++) {
      const { options, correctIndex } = buildOptions(150);
      expect(options).toHaveLength(4);
      expect(contains(options[correctIndex], 150)).toBe(true);
      expect(options.filter((o) => contains(o, 150))).toHaveLength(1);
      for (const o of options) expect(o.min).toBeGreaterThanOrEqual(0);
    }
  });
});
