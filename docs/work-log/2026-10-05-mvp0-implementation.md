# 2026-10-05 — MVP-0 핵심 기능 구현

## 목표

기기 로컬 Todo, Schedule, Pomodoro Timer, 로컬 알림, Stats의 기본 흐름을 구현한다.

## 변경

- 3단계 Todo 생성·수정·보관·순서 변경·삭제와 삭제 기록 보존을 구현했다.
- 24시간 Day View 시간표, 5분 단위 일정 검증, Todo 연결, 블록 이동과 Focus 시작을 구현했다.
- 기계식 다이얼 Timer, Focus·Break 전환, Pause·Resume·Complete·Discard, 직접 시간 기록을 구현했다.
- 세션별 로컬 알림 예약·취소·중복 정리와 알림 탭의 Timer 이동을 구현했다.
- 주·월 통계에 Todo 직접·하위·프로젝트 합계를 추가했다.

## 검증

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `git diff --check`

## 남은 일

- 사용자가 iOS·Android 실제 기기에서 알림 권한, 예약·취소, 앱 재시작 복원을 QA한다.
