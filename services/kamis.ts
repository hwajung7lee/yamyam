import type { PriceData } from "@/types/quiz";
import { readCache, writeCache } from "@/lib/price-cache";

const KAMIS_ENDPOINT = "https://www.kamis.or.kr/service/price/xml.do";

interface KamisItem {
  item_name?: string;
  unit?: string;
  dpr1?: string;
}

/** "3,200" 같은 콤마 포함 문자열 또는 "-"를 숫자로. 무효 시 NaN. */
function parsePrice(s: string | undefined): number {
  if (!s) return NaN;
  return Number(s.replace(/,/g, ""));
}

/**
 * KAMIS 일별 부류별 가격(채소류·소매)을 조회해 유효한 품목 가격 목록을 반환한다.
 * 인증 정보 누락, 네트워크/HTTP 오류, 형식 오류, 유효 데이터 없음 시 throw.
 */
export async function fetchPricesFromKamis(date: string): Promise<PriceData[]> {
  const certKey = process.env.KAMIS_CERT_KEY;
  const certId = process.env.KAMIS_CERT_ID;
  if (!certKey || !certId) {
    throw new Error("KAMIS 인증 정보(KAMIS_CERT_KEY/KAMIS_CERT_ID)가 없습니다");
  }

  const params = new URLSearchParams({
    action: "dailyPriceByCategoryList",
    p_product_cls_code: "01", // 01: 소매
    p_item_category_code: "200", // 200: 채소류
    p_regday: date,
    p_convert_kg_yn: "N",
    p_cert_key: certKey,
    p_cert_id: certId,
    p_returntype: "json",
  });

  const res = await fetch(`${KAMIS_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error(`KAMIS 응답 오류: ${res.status}`);

  const json = await res.json();
  const items: unknown = json?.data?.item;
  if (!Array.isArray(items)) throw new Error("KAMIS 데이터 형식 오류");

  const prices: PriceData[] = (items as KamisItem[])
    .map((it) => ({
      itemName: (it.item_name ?? "").trim(),
      unit: (it.unit ?? "").trim(),
      price: parsePrice(it.dpr1),
      date,
      market: "소매",
    }))
    .filter((p) => p.itemName && Number.isFinite(p.price) && p.price > 0);

  if (prices.length === 0) throw new Error("유효한 가격 데이터가 없습니다");
  return prices;
}

export interface PriceResult {
  data: PriceData[];
  fromCache: boolean;
}

/**
 * 가격 데이터를 가져온다. 성공 시 캐시에 저장하고, 실패 시 직전 캐시로 폴백한다.
 * 캐시도 없으면 원래 에러를 던진다.
 */
export async function getPrices(date: string): Promise<PriceResult> {
  try {
    const data = await fetchPricesFromKamis(date);
    writeCache(data);
    return { data, fromCache: false };
  } catch (err) {
    const cached = readCache();
    if (cached && cached.length > 0) {
      return { data: cached, fromCache: true };
    }
    throw err;
  }
}
