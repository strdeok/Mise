# 2026-10-11 — 하단 탭 아이콘

## 목표

하단 탭 다섯 개에 아이콘을 적용하고, 선택 상태와 터치 영역을 iOS·Android에서 일관되게 표시한다.

## 변경

- 오늘은 집, 할 일은 체크, 일정은 달력, 통계는 막대그래프, 설정은 조절 아이콘을 적용했다.
- 흑백 토큰을 사용해 선택된 아이콘·라벨은 검정, 나머지는 회색으로 표시한다.
- 기존 `react-native-svg`를 사용했다. 새 의존성은 추가하지 않았다.
- 각 탭에 접근성 이름과 선택 상태를 지정하고 텍스트 라벨을 유지했다.
- 탭 선택 상태를 더 분명히 하기 위해 비활성 아이콘은 윤곽선, 활성 아이콘은 채움으로 바꿨다. [Apple SF Symbols의 outline/fill 변형](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)과 [Google Material Symbols의 `FILL` 축](https://developers.google.com/fonts/docs/material_symbols?hl=en)을 참고했다.

## 검증

- 웹 미리보기에서 다섯 탭의 아이콘과 라벨 정렬, 일정 탭 선택 상태와 이동을 확인했다.
- iPhone 17 Pro 시뮬레이터와 Android Pixel 8 에뮬레이터에서 다섯 아이콘과 하단 시스템 바 여백을 확인했다.
- 윤곽선/채움 전환을 웹 미리보기의 다섯 탭과 iPhone 17 Pro·Android Pixel 8 에뮬레이터에서 확인했다.
- `cd frontend && npx tsc --noEmit`, `npm test -- --run`(8개 통과), `npx expo export --platform web|ios|android` 검증.

## 남은 일

- iOS·Android 실제 기기 QA는 사용자가 MVP 단계에서 진행한다.
