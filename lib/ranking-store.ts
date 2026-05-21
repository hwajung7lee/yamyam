import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { RankEntry } from "@/types/ranking";

/**
 * 랭킹 파일 경로. 테스트에서 RANKING_FILE로 덮어쓸 수 있다.
 * 기본값은 OS 임시 디렉토리 — 서버리스는 /tmp만 쓰기 가능하다.
 * (서버리스에서는 인스턴스 재활용 시 초기화되므로 영속 랭킹은 외부 저장소 필요 — 후속 과제)
 */
function rankingFile(): string {
  return (
    process.env.RANKING_FILE ??
    path.join(os.tmpdir(), "yamyam-ranking.json")
  );
}

/** 저장된 랭킹을 점수 내림차순으로 읽는다. 없으면 빈 배열. */
export function readRanking(): RankEntry[] {
  try {
    const raw = fs.readFileSync(rankingFile(), "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...(parsed as RankEntry[])].sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/** 항목을 추가하고 내림차순 정렬해 저장한 뒤, 전체 목록을 반환한다. */
export function addRanking(entry: RankEntry): RankEntry[] {
  const list = readRanking();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);

  const file = rankingFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list), "utf-8");
  return list;
}
