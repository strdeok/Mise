# SDD 구현 계획

각 Phase의 작업은 명세·계약 확정 → 구현 → 인수 기준 검증 순서로 진행한다. 이 문서는 작업 분해 초안이며 현재 완료 상태를 주장하지 않는다.

| Phase | 먼저 확정할 문서·결정 | 구현 작업 | 종료 조건 |
| --- | --- | --- | --- |
| 0 RN 로컬 프로토타입 | Schedule 분 단위 불변식, Session 상태·시간 계산, snapshot·통계 기준 | Expo Router, AsyncStorage Repository, Zustand 액션, fixture·hydration, 공통 UI | 로컬 Todo·Schedule·Timer·Stats·Settings 흐름과 도메인 단위 검증 |
| 1 Foundation | Google·Kakao PKCE·콜백 계약, 공통 API 오류, DB·시간대 기준, 계정 삭제·최근 인증 계약 | NestJS, Prisma/PostgreSQL, OAuth 인증·Settings·계정 삭제, AsyncStorage Repository를 API Repository로 교체 | `AC-AUTH-*`, 소유권 검증 |
| 2 Todo·Today | Todo 이동·삭제 정책, Today 날짜 계약 | Todo CRUD·트리·Today 지정, Today 화면 | `AC-TODO-*` |
| 3 Session | 시간 계산, 상태 전이, 충돌 응답, 알림 ID | Focus/Break API, 타이머, 단일 활성 제약, 복원, 알림 | `AC-SESSION-*`, `AC-NOTIFY-*` |
| 4 Schedule | 시각 입력·Block 참조 보존 | Day View, 블록 CRUD, 연결 Focus, 계획 외 Focus | `AC-SCHEDULE-*` |
| 5 Statistics | 기간 경계·집계 응답 | 주·월 집계, Todo 직접·하위 합산, 계획·실제 비교 | `AC-STATS-*` |
| 6 Release Polish | P1 포함 여부와 출시 정책, iOS 로그인 서비스 심사 지침 검토, 외부 삭제 요청 URL·백업 보존 정책 | 월간 Calendar·제스처 검토, 오류 UX, 접근성, 성능 측정, EAS 준비, Google Play 삭제 URL 제공 | 전체 기본 흐름과 기기 검증 |

## 작업 카드 형식

```text
ID / 제목 / 우선순위
연결된 Feature Spec 및 Rule ID
확정할 API·DB·상태 계약
구현 범위(App/Server/DB)
인수 기준 ID와 테스트 방법
의존 작업 / 완료 증거
```

## Definition of Done

기능 명세와 관련 계약이 확정되어 있고, App·Server·DB 해석이 일치하며, 연결된 인수 기준의 필수 테스트가 통과해야 완료다. 명세와 구현의 미해결 차이가 있으면 완료로 표시하지 않는다.

근거: [기획서](../reference/product-plan.txt) §16, §21; [기능 명세서](../reference/feature-requirements.txt) §24, §26.
