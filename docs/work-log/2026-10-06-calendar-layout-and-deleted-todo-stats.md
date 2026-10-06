# 2026-10-06 · Calendar, 레이아웃 토큰, 삭제 Todo 통계

## 목적

- 삭제한 Todo의 과거 Focus가 통계에 계속 남지 않게 한다.
- 작은 Android 화면과 넓은 화면에서 공통 간격과 터치 영역을 일관되게 쓴다.
- 일정 화면에서 월간·주간·일간 보기를 제공하고 월간을 기본값으로 둔다.

## 변경

- `Session.excludedFromStatsAt`을 추가했다. Todo와 자손을 hard delete할 때 해당 완료 Session에 시각을 기록한다.
- 통계 집계와 Today Focus 합계는 제외 표시가 있는 Session을 계산하지 않는다. 세션 원본은 AsyncStorage에 남는다.
- `frontend/src/constants/layout.ts`에 4dp 기반 간격, 터치 높이, 반경, 글자 크기, 화면 폭별 좌우 여백 토큰을 추가하고 공통 UI와 주요 화면에 적용했다.
- `react-native-calendars`를 추가해 일정 탭의 기본 화면을 월간 Calendar로 바꿨다. 같은 탭에서 주간과 일간 시간표를 전환할 수 있다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. 기존 Expo Notifications의 웹 정적 렌더 경고는 남아 있다.

## 남은 일

- 실제 iOS·Android 기기에서 360dp, 390dp, 430dp 이상 폭의 월·주·일 전환과 일정 블록 터치 영역을 QA한다.
