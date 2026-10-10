# 2026-10-10 — Standalone Android APK 재빌드

## 목표

Metro 개발 서버 없이도 독립 실행되는 Android APK를 제공한다.

## 변경

- 기존 debug APK 대신 `assembleRelease`로 JavaScript 번들과 에셋을 포함한 release APK를 생성했다.
- 설치 파일을 `/Users/deok/Desktop/Mise-Table-MVP0.apk`로 교체했다.

## 검증

- `./gradlew assembleRelease` 성공
- APK Signature Scheme v2 서명 검증 성공
- 초기화한 Android Emulator에 APK만 설치하고 Metro를 실행하지 않은 상태에서 Today 화면 진입 확인
- SHA-1: `6d3aca7e6174dfaa80fb92bde97b556f176f1575`

## 남은 일

- Android 실제 기기에서 설치와 주요 흐름을 QA한다.
- Play Store 배포 전 별도 release keystore와 Play App Signing을 적용한다.

## 참고

현재 APK는 로컬 QA용 debug keystore로 서명된 standalone release build다.
