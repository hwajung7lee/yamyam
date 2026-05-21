# 물가 맞히기 게임 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 가격 데이터 조회 | KAMIS 실 API를 **Route Handler가 서버에서 프록시** | API 키를 클라이언트에 노출하지 않는다. 브라우저는 `/api/quiz`만 호출 |
| 캐시 폴백 | 마지막 성공 응답을 **서버 캐시(파일)**에 저장, 실패 시 재사용 | spec scenario 6 — API 장애에도 게임 진행. 기준일을 캐시 날짜로 표기 |
| 랭킹 저장소 | **로컬 JSON 파일** (`lib/ranking-store`가 read/write) | 외부 의존 0, 튜토리얼에 가장 단순. 서버리스 배포 미대상 |
| 게임 흐름 | **클라이언트 상태머신**(`game.tsx`)이 화면(시작/문제/결과/랭킹/에러) 전환 | 화면 간 전환이 모두 클라이언트 상호작용. SPA식 단일 진입 |
| 내 최고 기록 | **localStorage** 기반 개인 최고치 | 로그인 없음(spec) — 기기 로컬에 개인 best 보관 |
| 보기 형식 | 서로 겹치지 않는 **가격 구간 4개** 중 1개 선택 | wireframe 확정. 정확히 1개에만 실제 가격 포함(불변 규칙) |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` | Env var | `.env.local` (+ `.env.example`) | Task 2 |
| 가격 캐시 파일 | Storage (file) | `data/price-cache.json` (gitignore) | Task 2 |
| 랭킹 데이터 파일 | Storage (file) | `data/ranking.json` (gitignore) | Task 6 |

## 데이터 모델

### Question (`/api/quiz` 응답)
- itemName (required) — 품목명 (예: "배추")
- unit (required) — 단위 (예: "1포기")
- options → PriceRange[4]
- correctIndex (required) — 정답 보기 인덱스 (0-3)
- actualPrice (required) — 실제 가격 (원)
- date (required) — 기준일 (예: "2026-05-21")
- market (required) — 시장 구분 (예: "서울 도매")
- fromCache (required) — 캐시 데이터 여부 (boolean)

### PriceRange
- min (required) — 구간 하한 (원)
- max (required) — 구간 상한 (원)

### RankEntry (`/api/ranking`)
- nickname (required)
- score (required) — 최종 연속 정답 수
- createdAt (required)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | 4, 5, 7, 8 | Button·Card·Field·Input·Badge·Separator 등 UI 구성. `components/ui/*` 직접 수정 금지, variant/semantic token 우선 |
| next-best-practices | 2, 3, 5, 6 | Route Handler, RSC/client 경계(`"use client"`), 환경변수, async API 규약 |
| vercel-react-best-practices | 4, 5, 7 | 클라이언트 상태/렌더 최적화 |
| web-design-guidelines | 9 (review) | 접근성·UX 가이드라인 점검(human review) |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/quiz.ts` | New | 1 |
| `types/ranking.ts` | New | 1 |
| `lib/build-options.ts` (+ `.test.ts`) | New | 1 |
| `services/kamis.ts` (+ `.test.ts`) | New | 2 |
| `lib/price-cache.ts` | New | 2 |
| `app/api/quiz/route.ts` (+ `__tests__`) | New | 3 |
| `hooks/use-quiz.ts` | New | 4 |
| `components/price-guess/question-screen.tsx` (+ `.test.tsx`) | New | 4 |
| `components/price-guess/start-screen.tsx` | New | 5 |
| `components/price-guess/game.tsx` (+ `.test.tsx`) | New | 5 |
| `app/page.tsx` | Modify | 5 |
| `lib/ranking-store.ts` (+ `.test.ts`) | New | 6 |
| `app/api/ranking/route.ts` (+ `__tests__`) | New | 6 |
| `components/price-guess/result-screen.tsx` (+ `.test.tsx`) | New | 7 |
| `components/price-guess/ranking-screen.tsx` (+ `.test.tsx`) | New | 8 |
| `e2e/price-guess.spec.ts` | New | 9 |
| `.gitignore` | Modify | 2 |

## Tasks

### Task 1: 가격대 보기 생성 + 문제 타입

- **담당 시나리오**: Scenario 1 (보기 생성 부분), 불변 규칙 "데이터 정합성"
- **크기**: S (2 파일)
- **의존성**: None
- **참조**:
  - (CLAUDE.md — 아키텍처 레이어: `types/` → `lib/`)
- **구현 대상**:
  - `types/quiz.ts` — `Question`, `PriceRange` 타입
  - `types/ranking.ts` — `RankEntry` 타입 (레이어 규칙상 types를 먼저 모아 둠)
  - `lib/build-options.ts` — 실제 가격 → 비중첩 가격 구간 4개 + 정답 인덱스 생성
  - `lib/build-options.test.ts`
- **수용 기준**:
  - [ ] 실제 가격 3,200원 입력 → 가격 구간 4개가 생성되고 정확히 1개 구간만 3,200을 포함한다
  - [ ] 생성된 4개 구간은 서로 겹치지 않는다 (한 구간의 max ≤ 다음 구간의 min)
  - [ ] 정답 인덱스가 가리키는 구간이 실제 가격을 포함한다 (여러 번 호출해도 항상 성립)
- **검증**: `bun run test -- build-options`

---

### Task 2: KAMIS 가격 조회 서비스 + 캐시 폴백

- **담당 시나리오**: Scenario 6 (캐시 폴백), Scenario 7 (데이터 없음) — 서비스 레벨
- **크기**: M (3 파일 + gitignore)
- **의존성**: Task 1 (`Question`/`PriceRange` 타입 사용)
- **참조**:
  - (next-best-practices — 환경변수, 서버 전용 모듈)
  - KAMIS Open API 문서 (사용자 보유 키 기준 응답 스키마)
- **구현 대상**:
  - `services/kamis.ts` — KAMIS API 호출 + 응답 파싱 → 품목/가격/기준일/시장
  - `lib/price-cache.ts` — 마지막 성공 응답을 `data/price-cache.json`에 read/write
  - `services/kamis.test.ts` — `fetch` 모킹
  - `.gitignore` — `data/` 추가
- **수용 기준**:
  - [ ] 정상 KAMIS 응답(모킹) → 품목·실제가격·기준일·시장이 채워진 가격 데이터를 반환한다
  - [ ] API 호출 실패 + 캐시 존재 → 캐시된 가격을 반환하고 기준일이 캐시 데이터의 날짜다 (`fromCache=true`)
  - [ ] API 호출 실패 + 캐시 없음 → 에러를 던진다(또는 빈 결과 신호)
- **검증**: `bun run test -- kamis`

---

### Task 3: 문제 조회 API (`/api/quiz`)

- **담당 시나리오**: Scenario 1 (데이터), 6, 7 — API 레벨
- **크기**: S (2 파일)
- **의존성**: Task 1, Task 2
- **참조**:
  - (next-best-practices — Route Handler, async API)
- **구현 대상**:
  - `app/api/quiz/route.ts` — GET: KAMIS 조회 → `build-options` → `Question` 반환
  - `app/api/quiz/__tests__/route.test.ts`
- **수용 기준**:
  - [ ] GET `/api/quiz` → 200, `{itemName, unit, options[4], correctIndex, actualPrice, date, market, fromCache}` 형태를 반환한다
  - [ ] options 4개 중 correctIndex 구간만 actualPrice를 포함한다
  - [ ] KAMIS 실패 + 캐시 존재 → 200 + `fromCache=true`, date가 캐시 날짜다
  - [ ] KAMIS 실패 + 캐시 없음 → 에러 상태 코드(예: 503)를 반환한다
- **검증**: `bun run test -- api/quiz` (route handler 직접 호출, `fetch` 모킹)

---

### Checkpoint: Tasks 1-3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `/api/quiz`가 유효한 문제를 반환하고, 캐시 폴백·데이터 없음 경로가 동작

---

### Task 4: 문제 화면 — 풀이와 정/오답 피드백

- **담당 시나리오**: Scenario 1, 2, 3 (UI)
- **크기**: M (3 파일)
- **의존성**: Task 3 (`/api/quiz` 소비)
- **참조**:
  - (shadcn — Card, Button, Badge; `components/ui/*` 수정 금지)
  - (vercel-react-best-practices — 클라이언트 상태)
  - `artifacts/price-guess/wireframe.html` (문제 답 전/정답/오답 화면)
- **구현 대상**:
  - `hooks/use-quiz.ts` — `/api/quiz` fetch, 연속 정답 카운트, 답안 판정 상태
  - `components/price-guess/question-screen.tsx` (`"use client"`)
  - `components/price-guess/question-screen.test.tsx` — fetch 모킹
- **수용 기준**:
  - [ ] 화면 진입 → 품목명·단위, 가격 구간 보기 4개, "연속 정답 N"이 표시된다
  - [ ] 정답 보기 클릭 → "정답" 표시 + "배추 1포기 3,200원 (서울 도매, 5월 21일 기준)" 형태의 실제 가격·출처가 보이고 연속 정답이 1 증가한다
  - [ ] 오답 보기 클릭 → "오답" 표시 + 실제 가격과 정답 보기가 함께 보이고, 보기 버튼들이 비활성(disabled) 상태가 된다
  - [ ] 정답 후 "다음 문제" 클릭 → `/api/quiz`가 다시 호출되고 새 문제(품목명 또는 보기 세트가 직전과 다름)가 표시된다
- **검증**: `bun run test -- question-screen`

---

### Task 5: 게임 컨테이너 + 시작 / 데이터 없음 화면

- **담당 시나리오**: Scenario 1 (시작 화면 진입·최고 기록 표시 부분), Scenario 7 (데이터 없음 UI)
- **크기**: M (4 파일)
- **의존성**: Task 4
- **참조**:
  - (shadcn — Button, Card)
  - (next-best-practices — RSC/client 경계, `app/page.tsx`)
  - `artifacts/price-guess/wireframe.html` (시작/데이터없음 화면)
- **구현 대상**:
  - `components/price-guess/start-screen.tsx`
  - `components/price-guess/game.tsx` (`"use client"`) — 화면 전환 상태머신
  - `app/page.tsx` — `ComponentExample` 대신 `Game` 마운트
  - `components/price-guess/game.test.tsx`
- **수용 기준**:
  - [ ] 시작 화면에 "게임 시작" 버튼과 내 최고 기록(없으면 "-")이 표시된다
  - [ ] "게임 시작" 클릭 → 문제 화면으로 전환된다
  - [ ] 시작 화면의 "랭킹 보기" 클릭 → 랭킹 화면으로 전환된다
  - [ ] `/api/quiz` 실패(캐시 없음 응답) → "가격 정보를 불러올 수 없어요" + "다시 시도" 버튼이 표시된다
  - [ ] "다시 시도" 클릭 후 조회 성공 → 문제 화면으로 전환된다
- **검증**: `bun run test -- game`

---

### Checkpoint: Tasks 4-5 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 시작 → 문제 풀이(정답/오답 피드백, 연속 정답) 흐름이 end-to-end로 동작 (가격 API는 실제 또는 모킹)

---

### Task 6: 랭킹 저장소 + API (`/api/ranking`)

- **담당 시나리오**: Scenario 4 (저장), Scenario 5 (정렬), 불변 규칙 "랭킹 일관성"
- **크기**: M (3 파일)
- **의존성**: None (병렬 가능하나 코어 이후 진행)
- **참조**:
  - (next-best-practices — Route Handler GET/POST)
  - (CLAUDE.md — `types/`, `lib/` 레이어)
- **구현 대상**:
  - `lib/ranking-store.ts` — `data/ranking.json` read/write, 내림차순 정렬 (`RankEntry` 타입은 Task 1에서 생성됨)
  - `app/api/ranking/route.ts` — GET(목록), POST(등록)
  - `lib/ranking-store.test.ts`, `app/api/ranking/__tests__/route.test.ts` (임시 파일 사용)
- **수용 기준**:
  - [ ] POST `{nickname:"홍길동", score:30}` → 저장되고 GET 목록에 "홍길동 30"이 포함된다
  - [ ] 점수 50과 30을 등록한 뒤 GET → 50이 30보다 앞에 온다(내림차순)
  - [ ] POST에 nickname이 비어 있으면 400을 반환하고 저장하지 않는다
  - [ ] GET 목록의 점수는 저장된 값과 일치한다
- **검증**: `bun run test -- ranking`

---

### Task 7: 결과 화면 + 랭킹 등록

- **담당 시나리오**: Scenario 3 (결과), Scenario 4 (등록)
- **크기**: M (2 파일)
- **의존성**: Task 5 (게임 흐름), Task 6 (`/api/ranking`)
- **참조**:
  - (shadcn — Field, Input, Button — `FieldGroup`+`Field` 폼 규약, `data-invalid`/`aria-invalid`)
  - `artifacts/price-guess/wireframe.html` (결과·등록 화면)
- **구현 대상**:
  - `components/price-guess/result-screen.tsx` (`"use client"`)
  - `components/price-guess/result-screen.test.tsx`
- **수용 기준**:
  - [ ] 게임 종료 → "최종 연속 정답 3"(오답 직전까지 맞힌 수)이 표시된다
  - [ ] 닉네임 "홍길동" 입력 후 "등록" → 랭킹 화면으로 이동하고 "홍길동" 항목이 강조된다
  - [ ] 빈 닉네임으로 "등록" → "닉네임을 입력하세요" 안내가 표시되고 등록되지 않는다
  - [ ] 등록 완료 후에는 같은 결과를 다시 등록할 수 없다("등록됨" 또는 버튼 비활성)
  - [ ] "다시 하기" 클릭 → 새 게임(문제 화면)으로 전환된다
- **검증**: `bun run test -- result-screen`

---

### Task 8: 랭킹 화면

- **담당 시나리오**: Scenario 5
- **크기**: S (2 파일)
- **의존성**: Task 6
- **참조**:
  - (shadcn — Card, Badge, Separator)
  - `artifacts/price-guess/wireframe.html` (랭킹 화면)
- **구현 대상**:
  - `components/price-guess/ranking-screen.tsx` (`"use client"`)
  - `components/price-guess/ranking-screen.test.tsx`
- **수용 기준**:
  - [ ] 랭킹 목록이 점수 내림차순으로 표시된다 (50, 42, 30 순)
  - [ ] 방금 등록한 내 항목이 강조(하이라이트/표식)되어 보인다
  - [ ] "다시 도전" 클릭 → 문제 화면으로 전환된다
- **검증**: `bun run test -- ranking-screen`

---

### Task 9: 전체 흐름 E2E + UX 리뷰

- **담당 시나리오**: Scenario 1→2→3→4→5 통합
- **크기**: S (1 파일)
- **의존성**: Task 5, 7, 8
- **참조**:
  - (web-design-guidelines — 접근성/UX 점검)
  - `playwright.config.ts`
- **구현 대상**:
  - `e2e/price-guess.spec.ts` — `/api/quiz` 응답을 `page.route`로 고정(결정성 확보)
- **수용 기준**:
  - [ ] 시작 → 정답 N회 누적 → 오답 → 결과(연속 정답 N) → 닉네임 등록 → 랭킹에서 내 기록 확인까지 한 흐름이 통과한다
  - [ ] `/api/quiz`를 캐시 없음 실패로 고정 → "가격 정보를 불러올 수 없어요" + "다시 시도"가 보이고, 재시도 성공 응답으로 바꾸면 문제 화면으로 진입한다 (에러 경로 E2E)
  - [ ] (Human review) 키보드 포커스 이동·대비·터치 타깃이 web-design-guidelines를 위반하지 않는다 — 증거 `artifacts/price-guess/evidence/task-9-ux.md`
- **검증**: `bun run test:e2e -- price-guess`; UX는 web-design-guidelines 리뷰 후 evidence 저장

---

### Checkpoint: Tasks 6-9 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] E2E 통과: `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] 시작→플레이→결과→등록→랭킹 전체 흐름이 동작

---

## 미결정 항목

- **오답 보기 가격대 생성 규칙** — 정답 외 3개 구간을 실제 가격에서 얼마나 떨어뜨릴지(난이도). Task 1 초안에서 합리적 기본값(예: 구간 폭 = 실제가의 일정 비율, 인접 배치)을 정하고 플레이로 조정.
- **닉네임 정책** — 중복 허용/욕설 필터: 미적용으로 시작(Task 6), 필요 시 후속.
- **랭킹 표시 개수** — 상위 N(기본 Top 10)으로 Task 8에서 시작.
- **품목 출제 중복 방지** — 한 게임 내 같은 품목 재출제 허용 여부: 초안은 매 문제 랜덤(중복 허용), 거슬리면 후속 조정.
