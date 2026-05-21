import type { PriceRange } from "@/types/quiz";

/** 가격 크기에 따른 "보기 좋은" 구간 폭을 고른다. 좁을수록 난이도가 높다. */
function niceStep(price: number): number {
  if (price < 1000) return 100;
  if (price < 5000) return 500;
  if (price < 10000) return 1000;
  if (price < 50000) return 2000;
  return 5000;
}

export interface BuiltOptions {
  options: PriceRange[];
  correctIndex: number;
}

/**
 * 실제 가격을 포함하는 구간 1개 + 인접 구간 3개로 보기 4개를 만든다.
 * - 4개 구간은 폭이 같고 서로 겹치지 않는다 (연속 사다리).
 * - 정확히 1개 구간만 실제 가격을 포함하며, 그 위치(correctIndex)는 랜덤.
 */
export function buildOptions(actualPrice: number): BuiltOptions {
  const width = niceStep(actualPrice);
  const correctLow = Math.floor(actualPrice / width) * width;

  // 정답 구간이 놓일 슬롯(0-3)을 랜덤하게 정한다.
  let slot = Math.floor(Math.random() * 4);
  let base = correctLow - slot * width;

  // 사다리가 음수 구간으로 내려가면 정답을 첫 슬롯에 고정해 0 이상으로 맞춘다.
  if (base < 0) {
    slot = 0;
    base = correctLow;
  }

  const options: PriceRange[] = Array.from({ length: 4 }, (_, i) => ({
    min: base + i * width,
    max: base + (i + 1) * width,
  }));

  return { options, correctIndex: slot };
}
