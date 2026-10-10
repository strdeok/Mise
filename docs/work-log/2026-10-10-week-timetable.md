# 2026-10-10 — 주간 시간표 7일 동시 표시

## 목표

휴대전화 주간 시간표에서 월요일부터 일요일까지 가로 스크롤 없이 한 화면에 표시한다.

## 변경

- 화면 폭에서 시간 눈금 폭을 뺀 영역을 7등분해 날짜 열과 일정 블록의 폭을 계산한다.
- 요일 머리글은 고정하고 시간축만 세로로 스크롤한다.
- Schedule SDD와 MVP-0 범위에 주간 7일 동시 표시 규칙을 반영한다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. Expo Notifications의 기존 웹 정적 렌더 경고가 표시된다.
- `cd frontend/android && ./gradlew assembleRelease` 통과.
- Android Emulator 1080×2400 화면에서 새 APK를 설치하고 월~일 7개 열이 동시에 보이는 것을 확인했다.

## 남은 일

- 실제 Android 기기의 작은 화면에서 긴 블록 제목과 날짜 열 터치 영역을 QA한다.
