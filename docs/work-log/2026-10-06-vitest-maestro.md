# 2026-10-06 · Vitest와 Maestro 테스트 기반

## 목적

- 화면 변경 전에 시간·일정·통계 규칙의 회귀를 빠르게 확인한다.
- iOS·Android 개발 빌드의 핵심 사용자 흐름을 반복 실행할 기반을 만든다.

## 변경

- `frontend`에 Vitest를 개발 의존성으로 추가했다.
- `npm test`, `npm run test:watch` 명령을 추가했다.
- 일정 겹침·5분 단위·자정 넘김, Todo 경로·활성 Session·경과 시간, Focus 통계·삭제 Todo 통계 제외·삭제 Schedule snapshot을 검증하는 테스트 7개를 추가했다.
- Maestro CLI 2.11.0을 개발 환경에 설치했다.
- Android와 iOS용 Maestro 스모크 플로우를 `frontend/.maestro`에 추가했다.
  - Android: Today → Todo 생성 → 월·주·일 일정 전환
  - iOS: Today → Focus 시작 → Timer 일시정지·재개
- Android·iOS 앱 식별자를 `com.strdeok.misetable`로 고정했다.

## 검증

- `cd frontend && npm test`: 2개 파일, 7개 테스트 통과.
- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과.
- Maestro CLI `2.11.0` 설치 및 `maestro test` 명령 도움말 확인.

## 남은 일

- 새 개발 빌드를 Android Emulator와 iOS Simulator에 설치한 뒤 각각 `npm run test:e2e:android`, `npm run test:e2e:ios`를 실행한다.
- 사용자가 실제 기기 QA를 진행한 뒤 발견한 사항을 이 폴더 또는 트러블슈팅 문서에 기록한다.
