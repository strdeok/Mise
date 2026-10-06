# Mise Table 작업 지침

## 제품 범위

- 작업 범위는 [MVP 및 출시 로드맵](docs/sdd/planning/release-roadmap.md)을 기준으로 한다.
- 현재 단계 밖의 기능은 임의로 추가하지 않는다. 범위 변경은 먼저 계획과 SDD에 반영한다.
- MVP-0은 기기 로컬 앱이며, OAuth·서버·동기화는 Release-1부터 구현한다.

## 작업 방식

- 구현 전에는 목표, 변경 대상, 검증 방법을 포함한 짧은 계획을 먼저 세운다.
- 화면은 `Screen / Component → Zustand Action → Domain Logic → Repository Interface → Repository 구현체` 단방향 구조를 따른다.
- UI는 Repository를 직접 호출하지 않는다.
- 새 의존성은 기존 도구로 해결할 수 없는 경우에만 추가하고, 추가 이유와 영향을 작업 일지에 남긴다.

## Git

- Git Flow를 사용한다. `main`은 출시, `develop`은 통합이며, 기능·출시 준비·긴급 수정은 각각 `feature:`, `release:`, `hotfix:` 유형으로 구분한다.
- 브랜치 이름은 `type:작업내용` 형식을 사용한다. 예: `feature:timer-notifications`.
- 커밋은 기능별로 작고 독립적으로 나눈다.
- 커밋 메시지는 변경한 기능을 명확히 설명한다.

## UI와 품질

- Mise UI는 흑백 디자인 토큰을 유지한다. 새 색상 도입은 명시적 제품 결정이 있을 때만 허용한다.
- iOS와 Android 모두에서 Safe Area, 키보드, Modal, 뒤로가기와 터치 영역을 고려한다.
- 프론트엔드 코드 변경 뒤에는 `cd frontend && npx tsc --noEmit` 및 `cd frontend && npx expo export --platform web`으로 검증한다.
- MVP 단계별 실제 기기 QA는 사용자가 진행한다. QA 결과와 발견 이슈는 작업 일지 또는 트러블슈팅 문서에 기록한다.

## 기록

- 의미 있는 구현 단위가 끝날 때 [작업 일지](docs/work-log/README.md)에 목적, 변경, 검증, 남은 일을 기록한다.
- 구현 중 발견한 재현 가능한 문제와 해결 과정은 [트러블슈팅](docs/troubleshooting/README.md)에 기록한다.
