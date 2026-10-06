# 제품 범위

## 목표

Todo 작성 → 하루 시간표 배치 → Focus/Break 실행 → 실제 시간 기록 → 계획 대비 회고를 하나의 모바일 흐름으로 제공한다. Todo는 계획과 기록을 연결하는 기준 단위다. 시간표에 없던 작업도 실행할 수 있으며 사용자를 점수로 평가하지 않는다.

## 플랫폼과 기술 기준

| 영역 | 기준 |
| --- | --- |
| App | Expo, React Native, TypeScript, Expo Router, TanStack Query, Zustand, SecureStore, Expo Notifications |
| Server | Node.js, NestJS, TypeScript, REST, JWT Access/Refresh Token |
| DB | PostgreSQL, Prisma |
| 배포 | EAS Build, Docker 기반 서버 환경 |

App은 DB에 직접 접근하지 않는다. 서버가 사용자 데이터의 기준이며, TanStack Query는 서버 상태, Zustand는 로컬 UI 상태만 관리한다. 타이머의 기록 기준은 서버에 저장한 시각과 누적 초다.

## 화면 구조

메인 탭은 Today, Schedule, Stats, Settings다. 실행 중 세션은 모든 주요 화면에서 전역 미니 타이머로 표시하고, 누르면 Timer 전체 화면을 연다.

## 범위

| 단계 | 포함 |
| --- | --- |
| MVP-0 | 인증 없이 고정 mock 사용자로 시작하는 기기 로컬 앱. Todo 3단계·Today, 월간 Calendar 기본의 주·일 시간표, Focus/Break와 단일 활성 세션, 로컬 알림과 복원, 주·월 통계, 계획·실제 비교, 설정 |
| MVP-1 | 온보딩, 오류·빈 상태, 로컬 내보내기·초기화, 접근성, 실제 기기 QA, 스토어 기본 자산 |
| Release-1 | Google·Kakao OAuth 2.0/OIDC, iOS 심사 요건에 따른 Apple 로그인, Node.js API·DB, 계정 삭제, 기기 간 동기화 |
| Release-2+ | 오프라인 동기화·충돌·백업, 외부 캘린더·위젯·반복 일정, 제품 운영 기능 |

웹·데스크탑, 외부 캘린더, 팀 협업, AI 추천, 자동 추적, 결제, Redis는 MVP 범위가 아니다. 전체 기능의 단계별 분류와 완료 조건은 [MVP 및 출시 로드맵](planning/release-roadmap.md)을 따른다.

iOS App Store 출시 전에는 Google·Kakao 로그인 구성으로 [Apple의 로그인 서비스 심사 지침 4.8](https://developer.apple.com/app-store/review/guidelines/)을 충족하는지 확인한다. 충족하지 못하면 Apple 로그인 또는 동등한 선택지를 출시 범위에 포함해야 한다.

계정 생성 기능이 있으므로 출시 전에 앱 내 계정 삭제와 Google Play용 외부 삭제 요청 경로를 제공한다. [Apple 계정 삭제 안내](https://developer.apple.com/support/offering-account-deletion-in-your-app), [Google Play 계정 삭제 요구사항](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

## 핵심 완료 조건

가입부터 통계 확인까지의 기본 흐름이 iOS와 Android에서 가능해야 한다. 사용자 데이터 격리, Todo 계층 제한, 활성 세션 단일성, 기록 보존, 시간 계산과 알림 정합성을 [인수 기준](verification/acceptance.md)으로 검증한다.

근거: [기획서](reference/product-plan.txt) §14–21, [기능 명세서](reference/feature-requirements.txt) §1–4, §23–26.
