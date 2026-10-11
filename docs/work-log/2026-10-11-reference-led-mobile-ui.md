# 2026-10-11 — 레퍼런스 기반 모바일 UI 적용

## 목표

Things, Structured, Todoist Quick Add, Session, Sunsama에서 확인한 모바일 생산성 앱의 화면 흐름을 Mise의 흑백 UI에 적용한다.

## 변경

- Today를 현재 할 일, 다음 일정, 계획 대비 기록, 오늘 Todo를 순서대로 읽는 브리핑 화면으로 바꿨다. 빈 상태의 집중 시작은 Todo 빠른 추가로 연결한다.
- Todo 등록은 제목만 먼저 받는 빠른 추가 흐름으로 바꾸고, 카테고리와 상위 Todo 선택은 필요할 때 펼치도록 했다.
- Schedule 월간 화면에 이번 달 계획 요약과 선택한 날의 일정 목록을 추가하고, 주간 선택 상태를 명확히 표시했다.
- Timer에 Focus·Short Break·Focus·Long Break 순환 표시를 추가하고 다이얼과 시간을 분리한 기존 화면을 더 크게 정리했다.
- Stats를 계획 대비 실제 집중을 중심으로 재구성했다. 계획 안·밖의 집중, Focus·Break 비율, Todo별 시간을 같은 화면에서 확인한다.
- UI 적용 기준을 `docs/sdd/design/mobile-ui-direction.md`에 기록했다.

## 검증

- 웹 미리보기에서 Today, 월간 일정, 주간 통계를 확인했다.
- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npm test -- --run` 통과: 테스트 파일 4개, 테스트 12개.
- `cd frontend && npx expo export --platform web` 통과. Expo Notifications의 웹 정적 렌더 경고는 남아 있지만 웹 번들은 정상 생성됐다.
- iPhone 17 Pro Simulator에서 Expo Go로 Today 화면을 열었다. 이전 형식의 로컬 데이터가 있을 때 hydration 오류 안내가 표시되는 것을 발견했다.

## 후속 수정

- 로컬 저장 데이터를 읽거나 해석하지 못하면 손상된 값을 지우고 샘플 데이터로 시작하도록 Repository 복구 처리를 추가했다. 기존 유효 데이터는 그대로 유지한다.

## 남은 일

- 360px·390px iOS와 Android 실기기에서 Safe Area, 글자 크기 확대, 타이머 전체 화면, 시간표 블록 읽기를 사용자 QA로 확인한다.
