# 2026-10-11 — Todo 카테고리와 배지

## 목표

Todo 등록 시 선택형 카테고리를 지정하고, 목록에서 흑백 배지로 구분한다. 기존 Todo 데이터는 유지한다.

## 변경

- Todoist의 작업 등록 라벨 선택과 Microsoft To Do의 목록 내 카테고리 표시를 참고했다.
- Todo당 카테고리 0개 또는 1개를 허용한다. 계층 관계와는 독립적이며 자동 상속하지 않는다.
- Todo 등록·수정 시트에서 카테고리를 선택하거나 바로 생성할 수 있다.
- 전체 Todo에 카테고리·미분류 필터와 카테고리 이름 변경·삭제 관리 시트를 추가했다.
- Today, 전체 Todo, 상세 화면에 흑백 카테고리 배지를 표시한다.
- 카테고리 삭제 시 해당 Todo를 미분류로 변경하며 Todo와 Focus 기록은 유지한다.
- 기존 로컬 저장 데이터에 카테고리 필드가 없어도 미분류로 읽는다. 새 의존성은 추가하지 않았다.
- SDD의 Todo 규칙, 기능 설명, 로드맵, 후속 서버 API 계약 초안을 갱신했다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npm test` 12개 통과. 저장 데이터 호환과 카테고리 생성·변경·삭제를 포함한다.
- `cd frontend && npx expo export --platform web` 통과. 기존 Expo Notifications 정적 렌더 로그는 출력됐다.
- 웹 미리보기에서 전체 Todo, 등록 시트, 카테고리 관리 시트의 배치와 터치 영역을 확인했다.
- `npx expo export --platform ios`와 `--platform android` 네이티브 번들 생성 통과.

## 남은 일

- iOS·Android 실제 기기에서 긴 카테고리 이름, 키보드가 열린 시트, 필터 가로 스크롤을 확인한다. MVP 단계별 실제 기기 QA는 사용자가 진행한다.
