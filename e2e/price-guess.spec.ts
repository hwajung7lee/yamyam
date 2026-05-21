import { test, expect } from "@playwright/test";
import type { Question } from "../types/quiz";
import type { RankEntry } from "../types/ranking";

const question: Question = {
  itemName: "배추",
  unit: "1포기",
  options: [
    { min: 1000, max: 2000 },
    { min: 2000, max: 3000 },
    { min: 3000, max: 4000 },
    { min: 4000, max: 5000 },
  ],
  correctIndex: 2, // 3,000원 ~ 4,000원
  actualPrice: 3200,
  date: "2026-05-21",
  market: "소매",
  fromCache: false,
  estimated: false,
};

const CORRECT = /3,000원 ~ 4,000원/;
const TOTAL = 10;

test("시작→10문제 풀이→결과→등록→랭킹에서 내 기록 확인", async ({ page }) => {
  await page.route("**/api/quiz", (route) => route.fulfill({ json: question }));

  const ranking: RankEntry[] = [];
  await page.route("**/api/ranking", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      ranking.push({ ...body, createdAt: new Date().toISOString() });
      ranking.sort((a, b) => b.score - a.score);
      await route.fulfill({ status: 201, json: ranking });
    } else {
      await route.fulfill({ json: ranking });
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: /게임 시작/ }).click();

  // 10문제를 모두 정답 처리 (오답이어도 게임은 계속됨)
  for (let i = 1; i <= TOTAL; i++) {
    await page.getByRole("button", { name: CORRECT }).click();
    await expect(page.getByText("정답!")).toBeVisible();
    if (i < TOTAL) {
      await page.getByRole("button", { name: "다음 문제" }).click();
    } else {
      await page.getByRole("button", { name: "결과 보기" }).click();
    }
  }

  // 결과 화면
  await expect(page.getByText("최종 점수")).toBeVisible();

  // 닉네임 등록
  await page.getByPlaceholder("닉네임 입력").fill("홍길동");
  await page.getByRole("button", { name: "등록" }).click();

  // 랭킹: 내 기록 강조
  await expect(page.getByText("전체 랭킹")).toBeVisible();
  await expect(page.getByText(/홍길동/)).toBeVisible();
});

test("에러 경로: 데이터 없음 안내 → 다시 시도 성공", async ({ page }) => {
  let shouldFail = true;
  await page.route("**/api/quiz", async (route) => {
    if (shouldFail) {
      await route.fulfill({ status: 503, json: { error: "unavailable" } });
    } else {
      await route.fulfill({ json: question });
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: /게임 시작/ }).click();
  await expect(page.getByText("가격 정보를 불러올 수 없어요")).toBeVisible();

  shouldFail = false;
  await page.getByRole("button", { name: /다시 시도/ }).click();
  await expect(page.getByText("배추")).toBeVisible();
});
