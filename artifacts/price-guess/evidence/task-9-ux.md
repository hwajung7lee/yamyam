# Task 9 — UX/접근성 리뷰 (web-design-guidelines)

- 리뷰어: Claude (자동 가이드라인 점검) + 추후 인간/AT 검증 권장
- 기준: Vercel Web Interface Guidelines (command.md, 2026-05-21 fetch)
- 대상: `components/price-guess/{start,question,result,ranking,error}-screen.tsx`, `game.tsx`

## 통과 (✓)

- **시맨틱 HTML**: 모든 액션은 `<button>`(shadcn Button), 내비게이션 아님. 랭킹은 `<ol>/<li>`. 제목은 `<h1>`(시작)·`<h2>`(랭킹).
- **포커스 표시**: shadcn Button/Input에 `focus-visible:ring-*` 내장. `outline-none` 단독 사용 없음.
- **장식 아이콘**: lucide-react가 기본 `aria-hidden="true"` 부여 → 장식 아이콘 자동 처리.
- **비동기 라이브 영역**: 정답/오답 공개 배너 `role="status" aria-live="polite"`. 로딩 표시 `role="status"` + "불러오는 중…".
- **폼 라벨**: `FieldLabel htmlFor="nickname"` ↔ `Input id="nickname"` 연결, 클릭 가능.
- **에러 인라인**: `FieldError`(role=alert)로 닉네임 오류 인라인 표시.
- **제출 버튼**: 요청 시작 전까지 활성, 요청 중/등록 후 비활성(중복 방지).
- **색상 단독 신호 아님**: 정답/오답을 색 + 텍스트("정답!"/"오답!") + 아이콘으로 중복 전달.
- **엘립시스**: 로딩 문구에 `…` 사용.

## 적용한 개선

- `result-screen.tsx` — 닉네임 Input에 `name="nickname"`, `autoComplete="off"`, `spellCheck={false}` 추가.
- `ranking-screen.tsx` — 점수 컬럼에 `tabular-nums` 추가(숫자 정렬 가독성).

## 남은 minor (후속/인간·AT 검증 권장)

- `question-screen.tsx` — 정답 표식 Check 아이콘에 `aria-label="정답"`을 주었으나 lucide 기본 `aria-hidden`으로 AT엔 전달 안 됨. 단, 실제 정답은 "실제 가격" 텍스트로 announce되므로 정보 손실은 없음. 필요 시 sr-only 텍스트로 보강.
- 플레이스홀더 "닉네임 입력" — 가이드라인은 예시 패턴 + `…` 권장("예: 배추왕…"). 테스트 셀렉터 영향이 있어 이번엔 보류.
- 제출 시 첫 에러로 포커스 이동 미구현(닉네임 단일 필드라 영향 작음).
- `touch-action: manipulation` 전역 미설정 — 모바일 더블탭 줌 지연 가능. 글로벌 CSS 후속 검토.
- **실측 필요(인간/AT)**: taupe/amber 테마의 실제 대비비(WCAG AA), 스크린리더에서 연속 정답 수 변화 announce 체감, 모바일 터치 타깃(ghost 버튼 h-8≈32px) 실사용감.

## E2E 검증 결과

- `bun run test:e2e -- price-guess` → 2 passed:
  - 시작→정답 누적→오답→결과→등록→랭킹(내 기록 강조)
  - 에러 경로(데이터 없음 안내 → 다시 시도 성공)
