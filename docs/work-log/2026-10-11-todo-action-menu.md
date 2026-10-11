# 2026-10-11 — Todo 작업 메뉴

## 목표

Today와 전체 Todo의 `···` 메뉴가 웹에서 반응하지 않는 문제를 해결한다.

## 변경

- 네이티브 `Alert.alert` 기반 작업 목록을 웹·iOS·Android 공통 작업 시트로 변경했다.
- Today에서는 수정·오늘에서 제외·삭제, 전체 Todo에서는 수정·하위 추가·순서 변경·보관·복원·삭제를 제공한다.
- 삭제 전에 함께 지워질 하위 Todo 수와 Focus 기록 처리 방식을 표시한다.
- 이동할 수 없는 방향은 비활성화하고 메뉴 버튼 터치 영역을 44dp 이상으로 늘렸다.
- 새 의존성이나 데이터 모델 변경은 없다. SDD의 Todo 메뉴 동작을 갱신했다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npm test` 12개 통과.
- 웹 미리보기에서 두 화면의 메뉴, 삭제 확인, 수정 시트 이동을 확인했다. 실제 삭제는 수행하지 않았다.
- `cd frontend && npx expo export --platform web` 통과. iOS·Android 번들도 생성됐다.

## 남은 일

- iOS·Android 실제 기기에서 작업 시트 전환, 뒤로가기와 삭제 확인을 확인한다. MVP 단계별 실제 기기 QA는 사용자가 진행한다.
