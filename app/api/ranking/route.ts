import { NextResponse } from "next/server";
import { readRanking, addRanking } from "@/lib/ranking-store";
import type { RankEntry } from "@/types/ranking";

export const dynamic = "force-dynamic";

const TOP_N = 10;
const MAX_NICKNAME = 20;

export async function GET() {
  return NextResponse.json(readRanking().slice(0, TOP_N));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nickname =
    typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const score = Number(body?.score);

  if (
    !nickname ||
    nickname.length > MAX_NICKNAME ||
    !Number.isInteger(score) ||
    score < 0
  ) {
    return NextResponse.json(
      { error: "닉네임(1-20자)과 정수 점수가 필요합니다" },
      { status: 400 },
    );
  }

  const entry: RankEntry = {
    nickname,
    score,
    createdAt: new Date().toISOString(),
  };
  const list = addRanking(entry);
  return NextResponse.json(list.slice(0, TOP_N), { status: 201 });
}
