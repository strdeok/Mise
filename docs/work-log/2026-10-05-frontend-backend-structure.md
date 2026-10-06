# 2026-10-05 — 프론트엔드·백엔드 디렉터리 분리

## 목표

Expo 앱과 향후 Node.js API의 책임을 디렉터리 수준에서 분리한다.

## 변경

- Expo 앱 설정, 의존성, 소스, 에셋을 `frontend/`로 이동했다.
- Release-1 API 구현을 위한 `backend/` 예약 디렉터리와 안내 문서를 만들었다.
- 루트 README와 작업 지침의 실행·검증 경로를 `frontend/` 기준으로 갱신했다.

## 검증

- `cd frontend && npx tsc --noEmit`
- `cd frontend && npx expo export --platform web`

## 남은 일

- Release-1 시작 시 `backend/`에 Node.js 프로젝트와 API·DB 계약을 추가한다.
