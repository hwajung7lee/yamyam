# 물가 맞히기 — learnings

---
category: task-ordering
applied: not-yet
---
## plan 순서를 그대로 따름 (1→9)

**상황**: Step 2, Task 의존성 식별. plan.md가 이미 의존성 순서(types→lib→services→api→hooks→components→e2e)로 배치.
**판단**: 재정렬 불필요. Task 6(랭킹)은 1-5와 독립적이라 앞당길 수 있었으나, 코어 플레이 루프를 먼저 살아 있게 만드는 것이 검증에 유리해 plan 순서 유지.
**다시 마주칠 가능성**: 낮음 — 이번 plan 특유.
