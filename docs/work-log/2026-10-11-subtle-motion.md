# 2026-10-11 — 가벼운 UI 애니메이션

## 목표

반복해서 사용하는 탭, 버튼, Todo 트리에 짧은 동작 피드백을 더한다. 읽는 중인 타이머 숫자와 시간표는 흔들리지 않게 유지한다.

## 변경

- 탭 화면 진입에 180ms 페이드를 적용했다.
- 공통 버튼과 하단 탭에 90ms 눌림 및 150ms 복귀 스케일을 적용했다.
- 하위 Todo 접기·펼치기에 110~180ms 페이드 및 레이아웃 전환을 적용했다.
- 모든 새 동작은 기기의 움직임 줄이기 설정을 따른다.
- 기존 `react-native-reanimated`를 사용했고 새 의존성은 추가하지 않았다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과.
- `cd frontend && npx expo export --platform ios` 통과.
- `cd frontend && npx expo export --platform android` 통과.
- `cd frontend && npm test`: 8개 통과.
- 웹에서 탭 전환과 Todo 접기·펼치기를 확인했고 애니메이션 오류 로그는 없었다.

## 남은 일

- 실제 기기에서 움직임 속도와 움직임 줄이기 설정을 체감 QA한다.
