# 2026-10-11 — 홈의 독립 휴식 시작 제거

## 목표

홈에서 Break를 바로 시작하는 진입점을 제거해 Focus 완료 뒤 Break로 이어지는 뽀모도로 흐름을 명확히 한다.

## 변경

- Today 하단의 `휴식 시작` 버튼과 사용하지 않는 스타일을 제거했다.
- Session SDD에 Break는 Focus 완료 뒤 전환 화면에서 시작한다는 UI 규칙을 반영했다.
- Session 저장과 타이머의 Focus 완료 후 Break 제안은 유지했다. 새 의존성은 없다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과.
- 웹 미리보기에서 홈의 독립 휴식 버튼이 사라진 것을 확인했다.

## 남은 일

- 실제 기기에서 Focus 완료 → Break 진입 흐름은 MVP 단계 QA에 포함한다.
