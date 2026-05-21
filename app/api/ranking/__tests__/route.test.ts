import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { RankEntry } from "@/types/ranking";
import { GET, POST } from "../route";

let tmpFile: string;

function postReq(body: unknown): Request {
  return new Request("http://test/api/ranking", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  tmpFile = path.join(
    os.tmpdir(),
    `ranking-route-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  process.env.RANKING_FILE = tmpFile;
});

afterEach(() => {
  try {
    fs.unlinkSync(tmpFile);
  } catch {
    // 무시
  }
  delete process.env.RANKING_FILE;
});

describe("/api/ranking", () => {
  it("POST 등록 → 201, GET 목록에 포함된다", async () => {
    const postRes = await POST(postReq({ nickname: "홍길동", score: 30 }));
    expect(postRes.status).toBe(201);

    const getRes = await GET();
    const list: RankEntry[] = await getRes.json();
    expect(list.some((e) => e.nickname === "홍길동" && e.score === 30)).toBe(true);
  });

  it("50과 30을 등록하면 GET에서 50이 앞에 온다", async () => {
    await POST(postReq({ nickname: "낮음", score: 30 }));
    await POST(postReq({ nickname: "높음", score: 50 }));

    const getRes = await GET();
    const list: RankEntry[] = await getRes.json();
    expect(list[0]).toMatchObject({ nickname: "높음", score: 50 });
  });

  it("빈 닉네임 → 400, 저장하지 않는다", async () => {
    const res = await POST(postReq({ nickname: "  ", score: 10 }));
    expect(res.status).toBe(400);

    const getRes = await GET();
    const list: RankEntry[] = await getRes.json();
    expect(list).toHaveLength(0);
  });
});
