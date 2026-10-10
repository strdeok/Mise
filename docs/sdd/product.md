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

## MVP-0 시각 기준

- 화면은 흰색·검정·회색만 사용한다. 바탕은 미색에 가까운 흰색, 구분선은 연한 회색이며 그림자와 장식용 색상은 사용하지 않는다.
- Today와 Todo는 목록 중심으로 구성한다. 항목마다 카드를 두지 않고 구분선과 글자 굵기로 정보의 순서를 나타낸다. 오늘의 Focus 요약만 별도 패널로 강조한다.
- Schedule은 날짜 이동과 월·주·일 전환을 한 줄에 배치하고, 주간 보기에서는 일곱 날짜 열을 동시에 표시한다. 일정 블록은 밝은 면과 검은 왼쪽 표시선으로 구별한다.
- Timer는 아날로그 다이얼을 중심에 두고 디지털 시간을 다이얼 아래에 표시한다. 전체화면에서는 정사각형 시계 패널을 화면 너비에 맞게 확대한다. 시간 측정은 명시적인 시작 버튼을 누를 때 시작하며 일시정지·완료·폐기 조작은 작은 화면에서도 스크롤로 접근할 수 있어야 한다.
- iOS 상태바·홈 인디케이터와 Android 상태바·제스처 바를 Safe Area로 처리한다. 탭, Timer 조작, 하단 모달은 시스템 바와 겹치지 않아야 하며, 전체화면 시계 크기는 Safe Area를 제외한 높이로 제한한다.
- 스타일 참고: [Cal.com](https://styles.refero.design/style/5d7aa503-8cfa-49a4-bd3b-0c2f0f075c70), [Goodnotes](https://styles.refero.design/style/c7fe6b78-9ce3-4d69-a3f0-b8310c779e7a), [Teenage Engineering](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf). 이들은 시각 언어 참고이며 앱의 동작 계약은 각 기능 명세를 따른다.

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
