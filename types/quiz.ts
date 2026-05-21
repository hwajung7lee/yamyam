/** 가격 구간 보기. min 이상 max 미만을 의미한다. */
export interface PriceRange {
  min: number;
  max: number;
}

/** 한 문제. `/api/quiz`가 반환하는 형태. */
export interface Question {
  itemName: string;
  unit: string;
  options: PriceRange[];
  correctIndex: number;
  actualPrice: number;
  date: string;
  market: string;
  fromCache: boolean;
}
