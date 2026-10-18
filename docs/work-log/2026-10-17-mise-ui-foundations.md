# 2026-10-17 — Mise 공통 UI 규칙

## 목표

준비표·시간축·키친 타이머 방향을 유지하면서 공용 UI의 모서리와 읽기 규칙을 정리한다.

## 변경

- 모바일 UI 방향 문서에 Mise의 시각 정체성과 흑백 기반 준비 라벨·시간 표시 원칙을 기록했다.
- 용도별 control, surface, sheet, pill, circle 모서리 토큰을 추가했다.
- 공용 Card, Button, Field, SheetCard에 의미별 모서리 토큰을 적용하고 PrepLabel과 TimeValue를 추가했다.
- 화면별 직접 스타일, 색상 팔레트, 간격, 글꼴, 터치 영역, 의존성은 변경하지 않았다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. Expo 알림의 서버 렌더링 localStorage 경고가 출력됐지만 번들과 정적 경로 내보내기는 완료됐다.
- 현재 브라우저의 Today 화면에서 공용 UI 변경이 번들에 반영되는 것을 확인했다. 360dp·390dp 폭별 시각 검토는 별도 수행이 필요하다.

## 남은 일

- 실제 기기 QA는 사용자가 진행한다.
