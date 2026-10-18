# 2026-10-17 — Today 문구 단순화

## 목표

Today 첫 화면에서 장식성 헤더와 상태 문구를 덜어내고 날짜와 실제 계획에 집중한다.

## 변경

- `오늘의 준비` 상단 라벨, `지금 할 일` 상태 라벨, 집중 카드의 반복 Todo 제목을 제거했다. 날짜, 타이머 동작, 실제 Todo와 일정 목록은 유지했다.
- Today의 루트 Todo 행에서 제목과 중복되는 `프로젝트` 분류 표기를 제거했다.
- 첫 실행용 fixture의 프로젝트 이름을 `Mise Table`에서 `프로젝트`로 바꾸고 기존 저장 데이터에도 해당 fixture 레코드만 정규화한다.

## 검증

- `cd frontend && npx tsc --noEmit` 통과.
- `cd frontend && npx expo export --platform web` 통과. Expo 알림 모듈의 localStorage 서버 렌더링 경고가 있었지만 웹 내보내기는 완료됐다.
- `http://localhost:4173/` 새로고침 후 제거된 문구와 변경된 fixture 이름을 확인했다.

## 남은 일

- 실제 기기 QA는 사용자가 진행한다.
