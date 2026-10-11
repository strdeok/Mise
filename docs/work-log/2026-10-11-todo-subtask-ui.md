# 2026-10-11 — 하위 Todo 추가 UI

## 목표

Todoist의 작업 상세 화면을 참고해 하위 Todo를 메뉴 밖에서 바로 찾고 추가할 수 있게 한다.

## 변경

- 오늘과 전체 Todo에서 제목을 누르면 상세 시트를 연다.
- 상세 시트에 하위 Todo 목록, 완료 전환, 하위 Todo 추가 입력을 배치한다.
- 전체 Todo 목록에서 자식 항목을 접고 펼칠 수 있게 한다.
- 3단계 Todo에는 하위 항목 추가를 표시하지 않고, 상위 Todo 선택 목록에서도 3단계 항목을 제외한다.
- 새 의존성은 추가하지 않았다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. Expo Notifications의 기존 정적 렌더 로그가 출력되지만 export는 완료됐다.
- 웹 미리보기에서 오늘 화면의 상세 시트, 전체 Todo 트리, 상세에서 수정 창 이동을 확인했다.

## 남은 일

- iOS와 Android 실제 기기에서 키보드가 열린 상태의 시트 높이와 모달 전환을 확인한다. MVP 단계별 실제 기기 QA는 사용자가 진행한다.
