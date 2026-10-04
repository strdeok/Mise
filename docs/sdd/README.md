# Mise Table SDD

Mise Table의 구현 기준 문서다. 원본 기획서와 기능 명세서는 `reference/`에 보존한다. 원본에 적힌 SDD 지침은 제품 요구사항의 근거이며, 이 저장소에서 실제 개발 절차를 결정하는 문서는 이 디렉터리다.

## 읽는 순서

1. [제품 범위](product.md): MVP 목표, 범위, 우선순위
2. [기능 명세](features/README.md): 사용자 행동과 기능별 규칙
3. [도메인 규칙](domain/rules.md) 및 [Session 상태 전이](domain/session-state.md)
4. [데이터 계약](contracts/data-model.md) 및 [API 계약](contracts/api.md)
5. [인수 기준과 검증](verification/acceptance.md)
6. [구현 계획](planning/plan.md) 및 [결정 기록](planning/open-decisions.md)

## 구조

```text
docs/sdd/
├── README.md
├── product.md
├── reference/
│   ├── product-plan.txt
│   └── feature-requirements.txt
├── features/
│   ├── README.md
│   ├── auth.md
│   ├── todo-today.md
│   ├── schedule.md
│   ├── sessions.md
│   ├── statistics.md
│   └── settings-notifications.md
├── domain/
│   ├── rules.md
│   └── session-state.md
├── contracts/
│   ├── api.md
│   └── data-model.md
├── verification/
│   └── acceptance.md
└── planning/
    ├── plan.md
    └── open-decisions.md
```

## 변경 순서

요구사항 변경 시 기능 명세 → 도메인·상태·데이터·API 계약 → 인수 기준 → 계획 → 구현 순서로 수정한다. 하나의 규칙을 여러 문서에 복제하기보다 규칙 ID로 연결한다. 구현 완료 표시는 해당 인수 기준과 필요한 테스트의 통과 결과가 있을 때만 한다.

현재 문서는 **구조와 요구사항 초안**이다. 사용자와 합의한 설계 결정은 [결정 기록](planning/open-decisions.md)에 반영했다. 제공자별 OAuth 콜백, 일부 경로의 세부 DTO, 백업 보존 정책 같은 구현·출시 세부사항은 해당 Phase에서 확정한다. `P0`은 MVP 필수, `P1`은 후반 품질·확장, `P2` 이상은 후속 범위다.

## 기능 추가 템플릿

각 `features/*.md`에 목적, 우선순위, 사용자 시나리오, 입력·출력, 정상·예외 흐름, 권한, 규칙 ID, 관련 API, 인수 기준 ID를 적는다. 상태 전이가 있으면 `domain/`, 서버 계약이 있으면 `contracts/`, 검증 시나리오는 `verification/`에 추가한다.
