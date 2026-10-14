# 2026-10-14 — 설치 스킬 기반 UI/UX 전수 조사

## 목표

ui-ux-pro-max, impeccable, animate-expo와 이전 레퍼런스 조사를 이용해 현재 Mise UI의 개선 지점을 전수 조사한다.

## 변경

- `docs/sdd/design/2026-10-14-ui-ux-audit.md`에 48개 통합 항목(P1 16, P2 28, P3 4), 위치·근거·영향·개선·후속 완료 기준을 기록했다.
- 두 독립 검토의 소스 분석을 iOS 타이머와 390×844 웹 화면 관찰, Things·Structured·Todoist·Session·Sunsama·Routine·Notion Calendar 및 기존 Refero 스타일 링크와 대조했다.
- 현재 MVP-0 오류, MVP-1 접근성/초안/빈 상태 작업, 별도 제품 결정을 구분했다. 흑백 지침과 기존 디자인 SDD의 색상 허용 충돌도 기록했다.
- 시간 선택 계산, 직접 Timer 진입의 복원 누락, 웹 SVG 경고를 미해결 트러블슈팅으로 기록했다.
- 제품/프론트엔드 구현, 의존성 추가는 없다.

## 검증

- iPhone 17 Pro / iOS 26.4 / Expo Go에서 활성·초과 Timer, 설정 시트, 전체화면과 일반 화면 복귀를 관찰했다.
- 웹 390×844에서 주요 5탭, Todo 상세·수정·행 메뉴·카테고리, 월·주·일 시간표·일정 수정, Timer 직접 로드를 관찰했다.
- 소스 경로와 대비 토큰을 대조했다. 소스 위험과 화면 재현을 보고서에 구분했다.
- 코드 변경이 없어 TypeScript 검사·Web export·자동 테스트는 실행하지 않았다. 실제 기기 접근성·알림·성능을 검증했다고 주장하지 않는다.
- 조사용 브라우저를 정리하고 사용자 요청으로 실행해 둔 Expo/Simulator는 유지했다.

## 남은 일

- 보고서의 실행 순서에 따라 기능 단위 구현 계획을 세운다.
- 프론트엔드 수정 후 필수 TypeScript/Web export를 실행한다.
- iOS·Android 실제 기기에서 키보드, 큰 글자, 짧은 일정, 스크린리더, 알림 직접 진입, 저장 실패와 출시 빌드 모션을 사용자 QA로 확인한다.

## 후속 구현 — 핵심 흐름 개선

### 목표

P1 중 MVP-0 오류·데이터 안전·주요 Todo/Timer 연결을 먼저 고치고 조사 결과를 현재 UI 기준에 반영한다.

### 변경

- hydrate를 root로 옮겨 첫 화면과 알림 Timer 이동이 저장 데이터 준비 뒤에 진행되도록 했다. 읽기/해석 실패 때 저장 원본을 지우지 않고 다시 시도 상태를 표시한다.
- 저장소 쓰기 성공 뒤 Zustand를 갱신하고, 실패 때 입력·기존 화면 상태를 보존하며 폼 안에 오류를 보인다.
- 일정 분 변환을 바로잡고 하루 종료의 자정 값을 24:00으로 처리한다.
- Today에 활성 Todo, Focus/Break 상태, 설정된 타이머 시간을 표시한다. 일시정지 상태는 미니 카드에도 명확히 드러낸다.
- Todo 상세에 ‘집중하기’를 연결하고 Settings의 타이머 설정 문구를 실제 시트 버튼으로 바꿨다.
- 완료·펼침 컨트롤의 터치 타깃을 44pt로 넓혔다. 색 정책과 SDD를 흑백 기준으로 맞추고 Timer 다이얼에 남아 있던 유색 노브를 회색으로 정리했다.
- 시간표 블록 이동은 기존 PanResponder와 매 프레임 React 갱신을 제거하고, 길게 누른 뒤 UI 스레드 shared value로 옮기며 손을 뗄 때 저장하도록 바꿨다. 이미 설치된 Gesture Handler/Reanimated를 사용해 의존성은 추가하지 않았다.
- 구현 과정과 남은 실기기 QA를 `docs/troubleshooting/2026-10-14-ui-audit-open-issues.md`에 갱신했다.

### 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 성공. Expo Notifications의 정적 렌더링/localStorage 경고는 있었으나 번들과 4개 경로 생성은 완료했다.
- iPhone 17 Pro / iOS 26.4 시뮬레이터에서 root hydration 이후 Today의 기존 Timer 상태와 화면 표시를 확인했다.
- 저장 실패 주입, 손상 데이터 복구, 종료 상태 알림 cold start, iOS·Android picker의 24:00과 시간표 길게 누르기/취소/방향 반전은 실기기 QA가 남아 있다.

### 남은 일

- Android 및 iOS 실제 기기에서 알림 직접 진입, 저장 실패 시 초안 유지, 01:00·09:30·23:55·24:00을 확인한다.
- P1 중 짧은 일정 블록의 탐색/터치 영역, 탭 화면 상태 유지와 기타 MVP-1 접근성은 후속 구현 항목이다.
