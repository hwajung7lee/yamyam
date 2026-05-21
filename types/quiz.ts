/** 가격 구간 보기. min 이상 max 미만을 의미한다. */
export interface PriceRange {
  min: number;
  max: number;
}

/** KAMIS·Gemini에서 가져온(또는 캐시된) 단일 품목 가격. */
export interface PriceData {
  itemName: string;
  unit: string;
  price: number;
  date: string;
  market: string;
  /** 실데이터가 아니라 AI(LLM) 추정 시세인지. 캐시를 통과해도 출처가 유지된다. */
  estimated: boolean;
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
  /** 실데이터가 아니라 AI(LLM) 추정 시세인지 여부. */
  estimated: boolean;
}
