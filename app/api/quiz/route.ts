import { NextResponse } from "next/server";
import { getPrices } from "@/services/price-provider";
import { buildOptions } from "@/lib/build-options";
import type { Question } from "@/types/quiz";

// 매 요청 실시간 가격을 반영하므로 캐싱하지 않는다.
export const dynamic = "force-dynamic";

export async function GET() {
  // KAMIS는 한국 날짜 기준이므로 KST(UTC+9)로 오늘 날짜를 계산한다.
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const { data, fromCache } = await getPrices(today);
    const item = data[Math.floor(Math.random() * data.length)];
    const { options, correctIndex } = buildOptions(item.price);

    const question: Question = {
      itemName: item.itemName,
      unit: item.unit,
      options,
      correctIndex,
      actualPrice: item.price,
      date: item.date,
      market: item.market,
      fromCache,
      estimated: item.estimated,
    };

    return NextResponse.json(question);
  } catch {
    return NextResponse.json(
      { error: "가격 정보를 불러올 수 없습니다" },
      { status: 503 },
    );
  }
}
