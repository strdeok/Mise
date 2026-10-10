# 2026-10-10 — iOS·Android 시스템 바 여백

## 목표

상단 상태바와 하단 홈 인디케이터·제스처 바를 고려해 탭, 타이머 조작, 하단 모달을 배치한다.

## 변경

- 앱 루트에 Safe Area Provider를 추가하고 Timer도 공통 Safe Area View를 사용하게 했다.
- 전체화면 시계의 최대 높이를 화면 높이에서 상하 Safe Area를 제외해 계산한다.
- Todo·일정·시간 수정 하단 모달에 공통 Safe Area Sheet를 적용했다.
- 기존 `react-native-safe-area-context`만 사용해 새 의존성은 추가하지 않았다.

## 검증

- `cd frontend && npx tsc --noEmit`, `npm test -- --run` 통과.
- `cd frontend && npx expo export --platform web`, `npx expo export --platform android` 통과.
- Android Pixel 8 에뮬레이터에서 Today 탭, 일반 Timer, 전체화면 Timer, 시간 수정 모달의 상하 시스템 바 여백을 확인했다.
- iOS iPhone 17 Pro 시뮬레이터 빌드에 성공했고 Today 탭, 일반 Timer, 전체화면 Timer, Todo 모달의 상하 여백을 확인했다.

## 남은 일

- 실제 기기 QA는 MVP 단계에서 사용자가 진행한다.
