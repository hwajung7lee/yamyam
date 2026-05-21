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
applied: rule
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

---
category: code-review
applied: not-yet
---
## code-reviewer Important 5건 전부 수용

**상황**: Step 4, code-reviewer 리뷰 결과 REQUEST CHANGES (Critical 0, Important 5).
**판단**: 5건 모두 수용·수정.
1. `question-screen`의 `disabled:opacity-100`가 shadcn-guard("기본 스타일 className 덮어쓰기 금지") 위반 → 오버라이드 제거. 정답/오답은 배너+가격 패널(불투명)로 전달돼 정보 손실 없음.
2·3. `/api/ranking` POST가 빈 닉네임만 막음 → 정수 점수(`Number.isInteger`)·닉네임 길이 상한(20자) 추가. 공개 API라 직접 POST 위협 존재.
4. `build-options` 음수 경계에서 `slot=correctLow/width`가 저가 품목 정답 위치 편향 → `slot=0; base=correctLow`로 단순화. price<width(150원) 테스트 추가.
5. 랭킹 GET이 전체 목록 반환 → 서버에서 `slice(0, TOP_N=10)`. `readRanking()`은 full 유지(addRanking 보존), GET/POST 응답만 slice.
추가로 suggestion 중 KST 날짜(quiz route)만 수용 — 자정~09시 UTC 오프셋 오류 예방.
**다시 마주칠 가능성**: 높음 — (a) shadcn 오버라이드 유혹, (b) 공개 Route Handler 입력 검증 누락은 반복 패턴.

---
category: spec-ambiguity
applied: not-yet
---
## KAMIS 키 부재 → Gemini 추정 시세 폴백으로 spec 확장

**상황**: Step 5 Human Review 중, 사용자가 KAMIS 키 미확보 → "Gemini로 대체 가능?"이라고 요청. spec의 데이터 출처(공공데이터)와 불변 규칙(출처 투명성=실데이터)을 건드리는 변경.
**판단**: 즉시 구현하지 않고 (a) 역할(폴백 vs 완전교체), (b) 출처 표시 방식을 먼저 질문. "폴백 + 'AI 추정' 배지"로 결정. 가격 소싱이 services에 격리돼 있어 `price-provider.ts` 코디네이터(KAMIS→캐시→Gemini)로 깔끔히 추가, `kamis.ts`는 fetch 전담으로 슬림화. spec의 불변 규칙·의존성을 갱신해 정합성 유지.
**다시 마주칠 가능성**: 중간 — 외부 데이터 의존 feature에서 "키/쿼터 없으니 LLM으로 대체" 요청은 흔함. 교훈: 소싱을 provider 인터페이스로 격리하면 폴백 추가가 저비용. 단, "실데이터" 전제 게임에서 LLM 폴백은 출처 라벨링이 필수(정직성).

---
category: spec-ambiguity
applied: not-yet
---
## 플레이 후 게임 모델 변경 (스트릭 → 10문제 고정)

**상황**: 출시 후 사용자 플레이 피드백 — 난이도 상향 직후 "게임 개수 10개로". 스트릭(오답=즉시 종료) 모델은 첫 오답에 게임이 끝나 너무 짧음. 모델 자체를 바꾸는 요청.
**판단**: 의미 확인(고정 10문제 vs 스트릭 상한) 후 "10문제 고정·오답에도 계속·점수=맞힌 개수". `useQuiz`에 questionNumber/correctCount/total/isLastQuestion 도입, 스트릭 제거. 화면·결과·랭킹·spec 시나리오 2·3·4·5 전면 갱신. 가격 소싱이 격리돼 있어 데이터 레이어는 무손상, 변경이 hook+UI에 국한.
**다시 마주칠 가능성**: 높음 — 게임/퀴즈류는 출시 후 코어 룰(스코어링·길이)이 자주 바뀜. 교훈: 스코어링 로직을 hook 한 곳(useQuiz)에 모아두면 모델 교체가 UI 프레젠테이션 수정으로 끝남. spec의 점수 구조를 "쉽게 바뀌는 결정"으로 다뤄야.
