# 2026-10-11 — Expo Go에서 로컬 저장 실패

## 증상

iOS Simulator에서 Todo 집중 버튼을 누르면 `AsyncStorageError: Native module is null, cannot access legacy storage`가 발생했다. 세션이 메모리에는 표시되지만 저장이 실패해 후속 페이지 이동이 실행되지 않았다.

## 원인

프로젝트가 AsyncStorage 3.1.1을 사용한 반면 설치된 Expo SDK 57의 `bundledNativeModules.json`은 2.2.0을 지정했다. Expo Go의 네이티브 모듈과 JavaScript 패키지 버전이 맞지 않았다.

## 해결과 확인

Expo 패키지 설치 도구로 기존 의존성을 2.2.0에 맞췄다. Simulator 앱을 다시 불러온 뒤 타이머 설정 저장이 성공하고 설정 창이 닫히는 것을 확인했다. 새로운 APK도 변경된 의존성을 포함해 빌드해야 한다.
