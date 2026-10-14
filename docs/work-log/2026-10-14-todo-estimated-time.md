# 2026-10-14 — Todo 예상 소요 시간

## 목표

Todo를 등록하거나 수정할 때 계획에 쓸 예상 소요 시간을 직접 입력할 수 있게 한다.

## 변경

- `Todo.estimatedMinutes`를 로컬 데이터 모델에 추가했다.
- 기존 AsyncStorage 데이터는 예상 시간이 없으면 `null`로 복원해 호환성을 유지한다.
- Todo 추가·수정 화면에 분 단위 숫자 입력을 추가했다.
- 전체 Todo 행과 Todo 상세에서 입력한 예상 시간을 표시한다.
- 예상 시간은 1분에서 9,999분까지 허용한다.
- 예상 시간은 Timer의 Focus 기본 시간과 독립적으로 유지한다.
- SDD의 Todo 기능 및 데이터 모델 계약을 갱신했다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과
- `cd frontend && npm test -- --run` 통과: 4개 파일, 13개 테스트
- `cd frontend && npx expo export --platform web` 통과

## 남은 일

- 실제 기기에서 숫자 키보드와 Todo 입력 시트의 키보드 회피를 확인한다.
