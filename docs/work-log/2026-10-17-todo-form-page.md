# 2026-10-17 — Todo 입력 전용 페이지

## 목표

작은 모달에서 Todo를 추가하던 흐름을 넓은 전용 페이지로 옮겨 입력 공간을 확보한다.

## 변경

- Today와 Todo 목록의 추가 버튼이 전용 Todo 페이지를 연다.
- Todo 수정도 같은 전체 화면을 사용한다.
- 제목, 예상 시간, 표시 날짜, 상위 Todo, 카테고리를 한 화면에서 편집하고 저장 버튼은 화면 하단에 고정한다.
- 시작·종료 시간과 일정 날짜를 입력하면 Todo와 연결된 Schedule 블록도 함께 저장하며, 수정 시 기존 연결 일정을 갱신한다.
- Todo 시간 계획과 Schedule 편집의 시작·종료 시간은 `react-native-paper-dates` 시계판/키보드 선택기를 사용한다. 흑백 테마와 한국어·24시간 표기를 적용해 Android/iOS/웹에서 같은 흐름을 제공한다.
- 안전 영역과 키보드에 맞춰 화면을 구성하고, 상위 Todo·카테고리 선택은 화면 안의 선택 단계로 처리한다.
- 웹에서 공용 Chevron의 `accessible={false}` 속성이 경고를 띄우던 문제를 플랫폼에 맞게 수정했다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과, `/todo-form` 포함 5개 라우트 생성.
- 웹 미리보기에서 한국어 24시간 시계판과 키보드 전환 UI를 확인했다.
- 키보드 전환 아이콘이 웹에서 네모로 표시되는 원인을 조사했다. `react-native-paper`가 아이콘 라이브러리를 찾지 못할 때 네모 fallback을 렌더링하는데, 앱 의존성에 아이콘 패키지가 없었다. Expo 권장 패키지 `@react-native-vector-icons/material-design-icons`와 config plugin을 추가했고, 웹에서 키보드 아이콘 렌더링을 확인했다. 이 의존성은 네이티브에서도 같은 아이콘 글꼴을 제공한다.
- 시간 범위는 선택 입력이며, 두 시간 모두 입력해야 한다. Schedule의 5분 단위·최소 길이·겹침 검증을 저장 전에 적용한다.
- 사용자 선호에 맞춰 `react-native-paper-dates`와 peer dependency인 `react-native-paper`를 추가했다. 기존 시스템 선택기는 Todo와 Schedule 편집에서 제외했다.
- Android standalone release APK 재빌드 및 APK Signature Scheme v2 검증 통과.
- 웹 미리보기에서 375×812 화면과 가로 화면을 확인했다.
- Android Release APK 빌드와 APK 서명 검증 통과.
- 키보드 아이콘 수정 후 Android release APK를 다시 빌드했다. `artifacts/Mise-develop-2026-10-17-keyboard-icon.apk`에 저장했고 APK Signature Scheme v2 검증이 통과했다. APK 안에 `MaterialDesignIcons.ttf`가 포함되어 있음을 확인했다.
- 키보드 아이콘 수정 뒤 `cd frontend && npx tsc --noEmit` 통과.
- 키보드 아이콘 수정 뒤 `cd frontend && npx expo export --platform web` 통과. 정적 렌더 중 알림 모듈의 localStorage 경고는 있으나 내보내기는 완료된다.
- Impeccable UI 감지 결과: 문제 없음.

## 남은 일

- iOS·Android 실제 기기에서 입력, 키보드, 뒤로 가기 동작을 확인한다. (웹 아이콘은 확인했지만 실제 기기 QA는 아직 하지 않았다.)
- 웹 내보내기 중 `expo-notifications`가 정적 렌더 환경의 `localStorage` 부재를 경고하지만 내보내기는 완료된다.
