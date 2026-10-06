# Expo Notifications 웹 정적 내보내기 경고

## 증상

`cd frontend && npx expo export --platform web` 중 Expo Notifications가 웹의 저장된 푸시 등록 정보를 읽지 못했다는 경고를 출력한다.

## 재현 방법

1. `frontend/`에서 웹 정적 내보내기를 실행한다.
2. Expo Router가 정적 렌더링 과정에서 Notifications 모듈을 불러온다.

## 원인

MVP-0의 알림은 iOS·Android 로컬 알림 기능이다. 웹 정적 렌더링 환경에는 네이티브 알림 등록 저장소가 없다.

## 해결

웹 번들은 성공하므로 경고는 차단하지 않는다. 알림 예약·취소·권한은 iOS·Android 실제 기기 QA에서 검증한다.

## 검증

- 웹 정적 내보내기 성공
- 실제 기기 QA 대기
