# 물가 맞히기 — learnings

---
category: task-ordering
applied: not-yet
---
## plan 순서를 그대로 따름 (1→9)

**상황**: Step 2, Task 의존성 식별. plan.md가 이미 의존성 순서(types→lib→services→api→hooks→components→e2e)로 배치.
**판단**: 재정렬 불필요. Task 6(랭킹)은 1-5와 독립적이라 앞당길 수 있었으나, 코어 플레이 루프를 먼저 살아 있게 만드는 것이 검증에 유리해 plan 순서 유지.
**다시 마주칠 가능성**: 낮음 — 이번 plan 특유.

---
category: tooling
applied: not-yet
---
## Vitest가 Playwright e2e 스펙을 수집해 실패

**상황**: Step 3, Checkpoint 1-3에서 `bun run test` 실행 시 `e2e/smoke.spec.ts`를 Vitest가 수집 → "Playwright Test did not expect test() to be called here" 실패. 사전 존재하던 설정 결함.
**판단**: `vitest.config.ts`의 `exclude`에 `e2e/**` 추가. CLAUDE.md 규약(Playwright는 `e2e/*.spec.ts` 전용, Vitest는 colocated)을 설정으로 강제. 근본 수정이라 우회 아님.
**다시 마주칠 가능성**: 높음 — 새 프로젝트 셋업마다 Vitest/Playwright 공존 시 재발. CLAUDE.md Testing 섹션에 exclude 규약을 명시하면 예방됨.
