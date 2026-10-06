# 2026-10-06 — MVP-0 Android APK

## 목표

MVP-0을 Android 실제 기기에서 설치하고 사용할 수 있는 APK로 내보낸다.

## 변경

- `frontend/android`에서 릴리스 APK를 빌드했다.
- 설치 파일을 `artifacts/mise-table-mvp0-android.apk`로 복사했다.

## 검증

- Gradle `assembleRelease` 성공
- APK Signature Scheme v2 서명 검증 성공
- SHA-256: `94a6b6f38157b902f5d554513fe21097dd9e18cfb043abf6165bce342f18b045`

## 남은 일

- Android 실제 기기에서 설치한다.
- Todo, Schedule, Timer, 알림 권한·예약·취소·앱 재시작 복원을 QA한다.

## 참고

이 APK는 로컬 실사용 QA용 debug keystore로 서명됐다. Play Store 배포 전에는 별도 릴리스 keystore와 Play App Signing을 사용한다.
