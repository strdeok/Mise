# MVP 및 출시 로드맵

이 문서는 현재 제품 범위와 구현 순서를 결정하는 기준이다. MVP는 인증이나 서버 없이 기기 로컬에서 핵심 사용 흐름을 검증하는 단계다. 이후 단계는 MVP가 실제 기기에서 안정적으로 검증된 뒤 진행한다.

## MVP-0 — 로컬 핵심 루프

목표: `Todo 작성 → 시간표 배치 → Focus/Break 실행 → 실제 시간 기록 → 계획 대비 회고`가 한 기기 안에서 완결된다.

| 영역 | 포함 기능 |
| --- | --- |
| Todo | 3단계 계층, 생성·수정·완료·완료 취소, Today 지정, 순서 변경, 보관, hard delete |
| 기록 보존 | Todo 삭제 뒤에도 완료 Focus 원본은 보존하되, 삭제된 Todo에 연결된 기록은 기본 통계와 Today Focus 합계에서 제외 |
| Schedule | 월간 Calendar 기본 화면, 주간·일간 전환, 주간 7일 열 동시 표시, 5분 단위 블록 생성·수정·삭제, 같은 날짜의 활성 블록 중복 금지, Todo 연결, 빈 시간대 탭 생성, 드래그 이동·드롭 위치 미리보기 |
| Timer | Focus·Short Break·Long Break, Pause·Resume·Complete·Discard, 목표 도달 뒤 초과 시간 측정, Focus와 Break 전환 제안, 앱 재시작 뒤 활성 세션 복원 |
| 알림 | Focus·Break 종료 로컬 알림, 실행·재개 시 세션당 하나, Pause·Complete·Discard 시 취소, 재시작 시 중복 정리 |
| Stats | 주·월 Focus·Break 합계, Todo 직접·하위·프로젝트 시간, 계획 대비 실제, 계획 외 Focus. 삭제된 Todo 기록은 제외하고 삭제된 Schedule의 유효 snapshot은 집계 |
| Settings | 기본 Focus·Break 시간, countdown·elapsed 모드, 알림 토글, 샘플 데이터 초기화 |

MVP-0 완료 조건:

- iOS Simulator와 Android Emulator에서 전체 기본 흐름을 실행할 수 있다.
- 실제 iOS·Android 기기에서 알림 권한, 예약·취소·중복 정리와 앱 재시작 복원을 검증한다.
- Schedule 불변식, Todo 트리, Session 전이·시간 계산, snapshot, 통계 집계를 자동 검증한다.

## MVP-1 — 계속 쓸 수 있는 로컬 앱

목표: 개인이 매일 사용해도 데이터와 사용 흐름이 불안하지 않은 상태를 만든다.

- 첫 실행 온보딩
- 빈 상태와 입력 오류 안내 정리
- Today에 표시할 미완료 Todo 정책 확정 및 구현
- Timer 완료·기록 수정 흐름 개선
- 로컬 데이터 JSON 내보내기
- 로컬 데이터 전체 삭제
- 접근성: 충분한 터치 영역, VoiceOver·TalkBack 라벨, 시스템 글자 크기
- 앱 아이콘, 스플래시, 스토어 스크린샷

## Release-1 — 계정과 동기화

목표: 사용자가 계정으로 로그인해 여러 기기에서 같은 데이터를 사용한다.

- Node.js API, PostgreSQL, 데이터 마이그레이션, API Repository
- Google·Kakao OAuth 2.0 로그인
- Apple 로그인은 iOS 출시 심사 요건에 따라 포함
- 동일 이메일 계정 안내
- Todo·Schedule·Session·Settings 서버 동기화
- 새 기기 로그인 시 데이터 복원
- 계정 삭제와 삭제 요청 경로

## Release-2 — 데이터 신뢰성

목표: 네트워크와 여러 기기에서도 기록이 유실되지 않는다.

- 오프라인 변경 큐와 온라인 복귀 동기화
- 동시 수정 충돌 정책과 사용자 안내
- 서버 백업·복구
- 동기화 상태와 오류 재시도 UI
- 개인정보 처리방침·이용약관

## Release-3 — 일상 사용성 확장

- 반복 일정과 일정 복제
- Todo 필터·정렬·전체 검색
- 홈 화면 위젯과 Focus 즉시 시작 바로가기
- Apple Calendar·Google Calendar 읽기 연동
- 주간 리포트와 목표·습관 기능

## Release-4 — 제품 운영

- 크래시·성능·행동 분석
- 피드백 채널과 공지 운영
- 유료 기능 또는 구독 정책
- App Store·Google Play 심사와 출시 운영

## 현재 구현 우선순위

MVP-0 안에서는 다음 순서로 진행한다.

1. Todo
2. Schedule
3. Timer
4. 로컬 알림
5. Stats
6. iOS·Android 실제 기기 QA

근거: 2026-10-05 제품 범위 합의.
