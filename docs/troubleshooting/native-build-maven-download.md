# Expo 네이티브 최초 빌드의 Maven 다운로드 지연

## 증상

`npx expo run:android --no-bundler`와 `npx expo run:ios --device "iPhone 17 Pro" --no-bundler`로 개발 빌드를 만들 때 React Native 0.86.3 네이티브 아티팩트 다운로드가 장시간 진행되지 않는다.

- iOS: CocoaPods가 `react-native-artifacts-0.86.3-reactnative-dependencies-debug.tar.gz`를 `repo1.maven.org`에서 받는 단계에 머문다.
- Android: Gradle이 같은 Maven 계열 원격 아티팩트를 받는 단계에 머문다.
- 네트워크 연결은 유지됐지만 Android 다운로드는 약 10분에 8MB 수준으로 진행돼 설치·Maestro 실행까지 완료하지 못했다.

## 재현

```bash
cd frontend
npx expo prebuild --clean --platform android --no-install
npx expo run:android --no-bundler
```

## 처리

- CocoaPods 1.17.0과 Maestro 2.11.0을 설치했다.
- Android `Pixel_8` Emulator와 iOS `iPhone 17 Pro` Simulator가 기기 목록에서 실행 가능한 상태임을 확인했다.
- 장시간 멈춘 Gradle·CocoaPods 작업과 Emulator는 정리했다.

## 다음 실행

안정적인 네트워크에서 다음 순서로 다시 실행한다.

```bash
cd frontend
npx expo run:android --no-bundler
npm run test:e2e:android
```

Android 설치가 끝난 뒤 `adb shell pm path com.strdeok.misetable`이 경로를 반환하면 Maestro를 실행할 수 있다.
