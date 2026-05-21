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

---
category: task-ordering
applied: not-yet
---
## Game 컨테이너의 forward-dependency (Task 5 → 7·8)

**상황**: Step 3, Task 5(Game 상태머신) 구현. plan은 Game을 Task 5에, ResultScreen(7)·RankingScreen(8)을 뒤에 둠. 그런데 Game은 result/ranking 화면으로 전환하는 통합 지점이라, Task 5 시점엔 전환 대상 컴포넌트가 없음.
**판단**: Game을 incremental하게 구현 — Task 5에선 start→playing→error 흐름만 완성하고 `screen` 상태에 result/ranking 슬롯만 둠(렌더는 null). 전환 wiring과 테스트는 Task 7·8에서 통합. throwaway stub 없이 진행. spec 시나리오 1 성공기준 중 "랭킹 보기 → 랭킹 화면"은 Task 8로 이연.
**다시 마주칠 가능성**: 중간 — 중앙 컨테이너/라우터를 자식 화면보다 먼저 두는 plan 배치는 흔함. draft-plan 시 "통합 컨테이너는 자식 slice 뒤에 배치"를 고려하면 예방.
