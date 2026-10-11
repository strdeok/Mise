# 2026-10-11 — 주요 모바일 상호작용 수정

## 목표

일상적으로 쓰는 Todo, Schedule, Timer 흐름에서 탭 상태·저장·닫기 동작을 예측 가능하게 맞춘다.

## 변경

- Timer는 기존 별도 페이지를 유지하며 상단 설정 버튼의 하단 시트에서 Pomodoro 시간과 긴 휴식 간격을 설정할 수 있게 했다.
- Today 및 Todo의 집중 진입은 대상 Todo를 명시하고 Timer 페이지를 열도록 연결했다. Schedule의 Focus 진입도 Timer 페이지로 이동하며, Timer 준비 화면에 연결 일정 제목·시각과 Todo 경로를 표시한다.
- READY 세션의 취소 및 실행 세션의 폐기는 로컬 세션과 알림을 정리하고 이전 화면으로 돌아간다.
- Todo 등록·수정에 여러 표시 날짜를 선택하는 달력을 추가했다. 저장 성공 때만 폼을 닫고 실패 안내를 표시한다.
- 카테고리 신규 등록 뒤 선택 화면을 닫고 Todo 편집 흐름으로 복귀하도록 했다.
- Todo 상위 항목 선택 화살표의 고정 폭과 축소 방지를 적용했다.
- 비활성 하단 아이콘의 SVG 채우기 값을 명시해 Today·Todo·Schedule·Timer outline 상태를 보정했다.
- Timer의 Todo 목록 렌더링에서 React Native 오류를 일으키던 텍스트 공백 노드를 제거했다.
- Todo 날짜와 Timer 시작·취소 동작을 MVP 로컬 데이터 정책에 맞게 SDD에 반영했다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. Expo Notifications의 web 정적 렌더 경고는 남지만 번들은 정상 생성됐다.
- iOS Simulator에서 Today, Todo, Schedule, Timer 탭 이동 및 Timer 설정·Todo 선택 화면 확인.
- Simulator에서 발견한 `Text strings must be rendered within a <Text>` 오류를 수정하고 Timer 재진입 후 오류가 다시 뜨지 않는 것을 확인.

## 남은 일

- 실 iOS·Android 기기에서 사용자가 탭 아이콘, 날짜 달력, 저장 후 닫힘, 알림·Timer 취소를 QA해야 한다.
- READY 취소/실행 폐기는 기존 완료 기록을 건드리지 않으며 Timer 종료 뒤 이전 화면으로 돌아간다.
