# 시간 선택기 키보드 전환 아이콘이 네모로 표시됨

## 증상

Todo 시간 선택기 왼쪽 아래의 키보드 전환 아이콘이 네모(□)로 표시된다.

## 재현 방법

웹에서 Todo 추가 페이지를 열고 시작 시간 또는 종료 시간 선택기를 연다.

## 원인

`react-native-paper`가 `@react-native-vector-icons/material-design-icons`, `@expo/vector-icons`, `react-native-vector-icons` 순으로 아이콘 라이브러리를 찾는다. 앱에는 이 라이브러리들이 설치되지 않아 플랫폼 공통 fallback인 네모 문자를 표시했다. 따라서 웹에만 국한된 문제는 아니다.

## 해결

Expo와 React Native Paper가 사용할 수 있는 `@react-native-vector-icons/material-design-icons`를 설치하고 Expo config plugin에 등록했다.

## 검증

- 웹 시간 선택기에서 네모 대신 키보드 아이콘이 표시되는 것을 확인했다.
- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. 알림 모듈이 정적 렌더 환경의 `localStorage`를 읽을 때 경고를 내지만 export는 완료된다.
- Android 실제 기기에서의 확인은 별도로 필요하다.
