import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readRanking, addRanking } from "./ranking-store";

let tmpFile: string;

beforeEach(() => {
  tmpFile = path.join(
    os.tmpdir(),
    `ranking-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
  process.env.RANKING_FILE = tmpFile;
});

afterEach(() => {
  try {
    fs.unlinkSync(tmpFile);
  } catch {
    // 파일이 없으면 무시
  }
  delete process.env.RANKING_FILE;
});

describe("ranking-store", () => {
  it("저장된 파일이 없으면 빈 배열을 반환한다", () => {
    expect(readRanking()).toEqual([]);
  });

  it("addRanking → 저장되고 readRanking에 포함된다", () => {
    addRanking({ nickname: "홍길동", score: 30, createdAt: "2026-05-21T00:00:00Z" });
    const list = readRanking();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ nickname: "홍길동", score: 30 });
  });

  it("점수 내림차순으로 정렬된다 (30 먼저 등록해도 50이 앞)", () => {
    addRanking({ nickname: "낮음", score: 30, createdAt: "2026-05-21T00:00:00Z" });
    addRanking({ nickname: "높음", score: 50, createdAt: "2026-05-21T00:01:00Z" });
    const list = readRanking();
    expect(list.map((e) => e.score)).toEqual([50, 30]);
  });
});
