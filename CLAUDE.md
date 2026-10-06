# Mise Table 개발 컨텍스트

`AGENTS.md`의 작업 지침을 우선 적용한다.

## 현재 기준

- 제품 단계: MVP-0 로컬 핵심 루프
- 기준 문서: `docs/sdd/planning/release-roadmap.md`
- 디자인: 흑백 Mise 테마
- 데이터: AsyncStorage Repository가 소유하고 Zustand는 화면 상태와 도메인 액션을 담당한다.
- 언어: 사용자 화면은 한국어

## 구현 원칙

1. 구현 전에 작업 계획을 세운다.
2. MVP·출시 단계 밖 기능은 추가하지 않는다.
3. 화면은 Repository를 직접 호출하지 않는다.
4. 도메인 규칙은 화면에 중복하지 않고 공통 로직으로 검증한다.
5. 기능별로 작은 커밋을 만든다.
6. 작업 중 결정·검증·이슈는 `docs/work-log/`, 재현 가능한 장애는 `docs/troubleshooting/`에 남긴다.
7. TypeScript 검사와 번들 검증을 수행한다. 실제 기기 QA는 사용자가 MVP 단계마다 진행한다.
