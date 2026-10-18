# Mise 정체성 UI 적용 단계 계획

작성일: 2026-10-17
상태: 3단계 완료, 4단계 대기

## 목표와 범위

Mise의 출발점인 요리 타임테이블을 `준비 → 시간표 배치 → 집중 실행 → 실제 시간 확인`이라는 사용 흐름과 시각 언어로 표현한다. 친근함은 둥근 준비표 라벨, 타이머 다이얼, 작은 완료 반응으로 만든다. 작업·시간 정보가 먼저 읽히는 생산성 앱의 성격을 유지한다.

현재 MVP-0의 흑백 토큰과 로컬 앱 범위를 유지한다. Todo·Schedule·Session·Stats의 도메인 규칙과 저장 형식은 이 작업의 변경 대상이 아니다. 음식 그림, 레시피 기능, 캐릭터 보상, 소셜 기능은 이 계획에 포함하지 않는다.

디자인 판단의 기준은 다음 세 가지다.

1. **준비표:** Todo와 날짜 선택에는 짧은 라벨·얇은 선·정돈된 목록을 쓴다.
2. **시간축:** Schedule의 시간과 작업 순서를 가장 먼저 읽히게 한다.
3. **키친 타이머:** 원형 다이얼을 Mise의 대표 형태로 유지하고 시작·일시정지·완료 조작을 명확히 한다.

요리 표현은 `오늘의 준비`처럼 화면의 맥락을 주는 곳에 제한한다. 실제 행동 버튼은 `할 일 추가`, `집중 시작`, `완료`처럼 뜻이 바로 보이는 말을 쓴다.

## 단계별 실행

| 단계 | 목표와 변경 대상 | 완료 기준 |
| --- | --- | --- |
| 0. 디자인 계약 기록 | [`docs/sdd/design/mobile-ui-direction.md`](../design/mobile-ui-direction.md)에 준비표·시간축·다이얼의 역할, 화면별 문구, 상태 표현을 반영한다. [`docs/sdd/product.md`](../product.md)의 MVP-0 시각 기준과 충돌하는 부분을 정리한다. 요리 기원은 기존 기획서의 사용 흐름 해석과 일치시킨다. | 세 화면에서 같은 형태가 왜 쓰이는지 설명할 수 있고, 흑백·장식·그림자 규칙이 문서 사이에서 모순되지 않는다. |
| 1. 공통 UI 규칙 | [`frontend/src/constants/layout.ts`](../../../frontend/src/constants/layout.ts), [`frontend/src/components/mise-ui.tsx`](../../../frontend/src/components/mise-ui.tsx)에 간격·모서리·타이포그래피·표면·상태를 정리한다. 날짜 라벨, 선택 행, 체크 영역, 시간 표기의 규칙을 공용 구성요소로 묶는다. | 동일한 라벨·버튼·입력 상태가 화면마다 다르게 보이지 않고, 텍스트와 터치 영역이 충분히 크다. 새 의존성은 기본 계획에 없다. |
| 2. Today와 Todo 작성 | [`frontend/src/components/mise-dashboard.tsx`](../../../frontend/src/components/mise-dashboard.tsx), [`frontend/src/app/index.tsx`](../../../frontend/src/app/index.tsx), [`frontend/src/app/todo-form.tsx`](../../../frontend/src/app/todo-form.tsx)에 적용한다. `오늘의 준비` 헤더 아래 현재 할 일·다음 일정을 우선하고, Todo 입력은 제목 → 날짜 → 시작·종료 시간 순으로 정돈한다. | Todo 작성 뒤 Today와 Schedule에 같은 날짜·시간이 보인다. 완료·미완료·빈 상태가 구별되고, 시간 선택기의 아이콘과 선택값을 iOS·Android·웹에서 확인할 수 있다. |
| 3. Schedule | [`frontend/src/components/schedule-views.tsx`](../../../frontend/src/components/schedule-views.tsx)와 일정 블록 표현에 준비표 라벨과 시간축 위계를 적용한다. 월간 밀도를 유지하고, 주간은 날짜별 의제로 전환하며, 일간은 Structured의 날짜 줄과 첫 일정부터 마지막 일정 주변까지만 보이는 비례 시간축을 흑백으로 재해석한다. | 제목·시작·종료 시간이 겹침 없이 읽히고, 선택·드래그 이동·계획 외 Focus 연결이 시각적으로 구별된다. |
| 4. Timer | [`frontend/src/app/timer.tsx`](../../../frontend/src/app/timer.tsx)의 다이얼과 숫자, 주요 조작을 같은 시각 언어로 다듬는다. 준비·실행·일시정지·목표 도달·완료 상태별 반응을 정의한다. | 일반·전체화면에서 시간과 조작이 선명하며, 작은 완료 반응은 반복 사용을 방해하지 않는다. 시스템의 동작 줄이기 설정을 따른다. |
| 5. 나머지 화면 정리 | Todo 목록·상세, Stats, Settings의 라벨·선·버튼 상태를 공통 규칙에 맞춘다. Stats에서는 계획 시간과 실제 시간의 차이를 가장 먼저 읽히게 한다. | 제품 전체에서 같은 행동과 상태가 같은 모양으로 보인다. 통계의 숫자와 단위가 장식에 가려지지 않는다. |
| 6. 마무리와 전달 | 각 의미 있는 구현 단위의 목적·변경·검증·남은 일을 [`docs/work-log/README.md`](../../work-log/README.md)에 기록하고, 재현 가능한 문제는 트러블슈팅에 남긴다. iOS Simulator·Android Emulator 화면을 확인하고 Android APK를 생성한다. | 공통 UI가 360dp·390dp 폭, 키보드, Safe Area, 모달, 뒤로가기, 큰 글자에서 사용 가능하다. 실제 기기 QA 결과는 사용자가 전달하면 기록한다. |

## 작업 순서와 검증

- 단계 0을 마친 뒤 단계 1을 진행한다. 단계 2의 Today·Todo 작성 화면을 첫 기준 화면으로 삼고, 사용 흐름과 분위기를 확인한 뒤 단계 3~5에 확장한다.
- 프론트엔드 코드가 바뀐 단계마다 `cd frontend && npx tsc --noEmit`과 `cd frontend && npx expo export --platform web`을 실행한다.
- 화면 확인은 해당 단계의 대표 상태를 묶어 한 번에 수행한다. iOS·Android의 실제 기기 QA는 MVP 완료 기준에 따라 사용자가 진행한다.
- UI는 기존 `Screen / Component → Zustand Action → Domain Logic → Repository Interface → Repository 구현체` 흐름을 따른다. 화면에서 Repository를 직접 호출하지 않는다.
- 새 의존성이 불가피하면 기존 도구로 해결되지 않는 이유와 영향 범위를 작업 일지에 기록한다.

## 확인할 결정

흑백 외 포인트 색을 쓰는 것은 별도 제품 결정이다. 먼저 현재 토큰만으로 세 화면을 구성하고, 결과에서 정보 구분이 부족할 때 색의 역할과 적용 범위를 제안한다.
