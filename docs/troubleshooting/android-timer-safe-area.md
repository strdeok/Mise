# Android Timer의 시스템 바 여백

## 증상

Timer 화면은 React Native 기본 `SafeAreaView`를 사용해 Android 하단 제스처 바의 여백을 일관되게 보장하지 못했다. 하단 모달도 고정 16dp 여백만 사용했다.

## 재현 방법

Android 제스처 탐색 기기에서 Timer와 전체화면 Timer를 열고 하단 버튼·모달과 시스템 바 사이의 간격을 확인한다.

## 원인

Today와 Timer가 서로 다른 Safe Area 구현을 사용했고, 하단 모달은 Safe Area를 적용하지 않았다.

## 해결

루트에 `SafeAreaProvider`를 두고 모든 주요 화면과 하단 모달에 `react-native-safe-area-context`의 `SafeAreaView`를 적용했다. 전체화면 시계 크기에도 상하 inset을 반영했다.

## 검증

Android Pixel 8 에뮬레이터에서 Today 탭과 Timer의 버튼·시간 수정 모달이 시스템 바와 겹치지 않는 것을 확인했다. iOS iPhone 17 Pro 시뮬레이터에서도 Today, Timer, Todo 모달의 여백을 확인했다. 실제 기기 검증은 별도로 진행한다.
