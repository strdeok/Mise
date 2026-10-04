# REST API 계약 인덱스

원본 문서의 **경로 초안**을 기준으로 정리했다. 공통 응답 규칙은 D-01에서 결정했다. 경로별 DTO, 세부 오류 코드, 멱등성은 아직 확정되지 않았다. 구현 전 [결정 목록](../planning/open-decisions.md)의 남은 항목을 해결하고 OpenAPI 또는 동등한 기계 판독 가능 계약으로 고정한다. App과 Server는 동일 계약을 사용한다.

## 공통 원칙

- OAuth 인증 시작·콜백 및 `/auth/refresh` 이외 개인 데이터 경로는 인증이 필요하다. `/auth/logout`의 인증 방식은 토큰 수명주기 설계 때 확정한다.
- 서버는 인증 사용자 ID로 모든 조회·변경을 제한한다. 요청 Body의 `userId`는 권한 근거가 아니다.
- 응답은 상태 변경 후 서버의 확정 상태를 제공해야 한다. 실패한 변경을 성공으로 표시하지 않는다.
- 인증 만료와 네트워크 오류를 구분한다. 갱신 실패 시 앱은 인증 정보를 제거한다.
- Access Token은 15분, Refresh Token은 30일 유효하다. `/auth/refresh`는 매번 새 Refresh Token을 발급하고 이전 것은 폐기한다. `/auth/logout`은 현재 기기의 Refresh Token만 폐기한다.
- 날짜 기반 요청은 행동 당시 기기의 IANA `timezoneId`를 전달한다. 서버는 기록의 UTC 시각과 당시 시간대·UTC 오프셋을 보존한다. 과거 기록 조회 응답에도 원래 시간대 정보를 포함해 App이 기기 시간대 변경 후 기준 시간대를 표시할 수 있게 한다.

## 공통 응답 규칙 (D-01)

- 성공 시 리소스 데이터를 직접 반환한다. `success` 같은 공통 래퍼를 두지 않는다.
- 생성은 `201`과 생성된 객체, 일반 조회·변경은 `200`과 데이터, 삭제는 `204`와 빈 본문을 기본으로 한다.
- 오류 본문은 `status`(HTTP 상태 숫자), `code`(안정적인 기계 판독 코드), `detail`(사용자에게 보여줄 수 있는 설명) **세 필드만** 사용한다. HTTP 상태와 본문의 `status`는 일치해야 한다.
- 기본 상태 매핑은 잘못된 입력 `400`, 인증 필요 `401`, 리소스 없음 `404`, 상태 충돌 `409`, 서버 오류 `500`이다. 다른 사용자의 개인 리소스는 존재를 드러내지 않도록 `404`로 응답한다.
- Session 기록 목록은 `limit`·`cursor` 방식으로 페이지를 나눈다. 기본 `limit=30`, 최대 `100`을 사용한다. 목록 응답은 `{ "items": [...], "nextCursor": "..." | null }`이다. Todo는 전체 트리, Schedule은 날짜별, 통계는 주·월별 조회를 기본으로 한다.

OAuth 인증 후 `(provider, providerUserId)` 연결이 없다면 서버는 제공자가 확인한 이메일의 중복을 검사한다. 기존 계정의 확인된 이메일과 같으면 내부 토큰·신규 계정을 발급하지 않고 `409 ACCOUNT_EXISTS_WITH_EMAIL`을 반환한다. 오류 본문은 공통 세 필드만 사용하며 `detail`은 기존 로그인 방식으로 로그인하라고 안내한다. 이메일이 없거나 제공자가 확인하지 않은 경우 이메일 중복으로 단정하지 않는다. 제공자별 시작·콜백 경로는 별도 계약에서 확정한다.

MVP에는 로그인 제공자 연결·해제 API를 두지 않는다. 한 내부 계정은 하나의 제공자 ID로 로그인하며, 동일 이메일 충돌 시 기존 제공자로 다시 로그인해야 한다. Settings의 제공자 정보는 읽기 전용이다.

오류 예시:

```json
{"status":409,"code":"ACTIVE_SESSION_EXISTS","detail":"이미 실행 중인 세션이 있습니다."}
```

| 도메인 | Method·Path | 동작 |
| --- | --- | --- |
| Auth | OAuth 시작·콜백·최근 인증 확인 경로 **설계 대기**, `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`, `DELETE /users/me` | 제공자 로그인·내부 토큰 갱신·로그아웃·현재 사용자·계정 삭제. 이메일·비밀번호 `signup/login` 경로는 사용하지 않음 |
| Todo | `GET /todos`, `POST /todos`, `GET /todos/:id`, `PATCH /todos/:id`, `DELETE /todos/:id`, `PATCH /todos/:id/complete` | 목록·상세·생성·수정·트리 hard delete·완료 전환 |
| Today | `PATCH /todos/:id/days` | Body의 날짜에 Todo를 포함·해제 |
| Schedule | `GET /schedule?date=YYYY-MM-DD`, `POST /schedule`, `PATCH /schedule/:id`, `DELETE /schedule/:id` | Day View·블록 CRUD |
| Session | `GET /sessions/active`, `POST /sessions/focus`, `POST /sessions/break`, `POST /sessions/:id/pause`, `POST /sessions/:id/resume`, `POST /sessions/:id/continue`, `POST /sessions/:id/complete`, `POST /sessions/:id/discard`, `GET /sessions` | 활성·시작·전이·목표 이후 계속 기록·기록 |
| Statistics | `GET /statistics/weekly?date=YYYY-MM-DD`, `GET /statistics/monthly?month=YYYY-MM` | 주·월 집계 |
| Settings | `GET /settings`, `PATCH /settings` | 설정 조회·변경 |

## 계약 작성 시 필수 필드

Schedule Block 생성·수정 Body는 `date: YYYY-MM-DD`, `startAt`·`endAt`: UTC 오프셋을 포함한 RFC 3339 시각, `timezoneId`: IANA 시간대 이름을 사용한다. 서버는 시간대·오프셋·현지 날짜의 일치와 현지 5분 단위, 5분 이상, 자정 넘김 금지를 검증한다. `DELETE /schedule/:id`는 블록을 soft delete하고 `204`를 반환한다.

`POST /schedule`과 `PATCH /schedule/:id`는 같은 사용자의 삭제되지 않은 블록과 UTC 실제 시각 구간이 겹치면 `409 SCHEDULE_OVERLAP`을 반환한다. 경계 시각만 맞닿는 블록은 허용한다. 동일 블록의 수정은 자기 자신과 비교하지 않으며, soft delete된 블록은 새 일정의 겹침 검사에서 제외한다.

`PATCH /schedule/:id`로 블록의 날짜·시간을 바꾸면 기존 Session을 수정하지 않고, 주·월 통계의 계획 시간과 계획 대비 실제 비교를 블록의 최신 값으로 다시 계산한다. 삭제되지 않은 블록은 완료 Focus가 없어도 계획 시간에 포함한다. soft delete된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 마지막으로 저장된 계획·실제 값을 비교 기록에 남긴다. 그렇지 않으면 계획 합계에서 제외한다. 따라서 과거 통계의 계획 수치는 블록 수정·삭제 후 달라질 수 있다.

Today 지정·해제는 동일 경로를 사용한다. `PATCH /todos/:id/days` Body는 `{ "date": "YYYY-MM-DD", "timezoneId": "Asia/Seoul", "selected": true | false }`다. `date`는 요청 당시 기기 시간대의 현지 날짜이며 생략할 수 없다. `selected=true`면 해당 날짜에 포함하고 `false`면 해제한다. 같은 요청을 반복해도 최종 선택 상태는 같아야 한다. 성공 시 `200`과 해당 날짜의 확정 선택 상태를 반환한다.

Todo 부모·순서 변경은 기존 `PATCH /todos/:id`에 `{ "parentId": "..." | null, "orderIndex": 0 }`을 보낸다. `orderIndex`는 이동 후 형제 목록의 0 기반 위치다. App은 버전 번호를 보내지 않는다. 서버는 사용자 단위 Todo 구조 변경을 트랜잭션에서 직렬화하고, 검증과 형제 순서 재배치를 완료한 뒤 확정된 Todo를 반환한다. 거의 동시에 들어온 두 변경은 서버가 처리한 순서대로 반영되며 마지막으로 커밋된 변경이 최종 상태다. 성공 후 App은 Todo 목록을 다시 조회한다.

모든 Session 변경 요청 Body에는 `clientRequestId`(UUID)를 넣는다. 같은 사용자·ID·내용의 재요청은 처음 처리 결과를 반환하고, 동일 ID의 다른 내용 재사용은 `409 REQUEST_ID_REUSED`를 반환한다. 새 시작 요청이 활성 Session과 겹치면 `409 ACTIVE_SESSION_EXISTS`이며 App은 `/sessions/active`를 재조회한다. 서로 양립하지 않는 상태 전이는 `409 INVALID_SESSION_TRANSITION`이다. 오류 본문은 공통 세 필드만 사용한다.

`POST /sessions/focus`에는 `todoId`가 필수이며 Schedule Block에서 시작할 때 `scheduleBlockId`를 함께 보낸다. 블록의 `todo_id`가 null이면 서버가 본인 소유 `todoId`를 블록에 연결하면서 Session을 같은 트랜잭션에서 생성한다. 이미 연결된 경우에는 요청 `todoId`와 같아야 한다. 다르면 `409 SCHEDULE_TODO_MISMATCH`를 반환한다. 블록이 삭제됐거나 다른 사용자 소유라면 Focus 시작에 사용할 수 없다. Todo 선택을 취소한 App은 시작 요청을 보내지 않는다.

`POST /sessions/:id/complete`는 `completionMode: ACTUAL | TARGET | MANUAL`을 받는다. `TARGET`은 목표 시각이 지난 세션에만 허용하고 `durationSeconds=targetSeconds`로 확정한다. `MANUAL`은 Body의 `durationSeconds`를 최종 기록으로 쓰며 60~86,400초 범위의 60초 단위로 검증한다. App은 완료 화면에 서버 계산 시간을 기본값으로 보여주고 사용자가 시·분으로 수정할 수 있게 한다. `POST /sessions/:id/continue`는 목표 시각 이후 선택을 서버에 기록하고 RUNNING 상태를 유지한다. 이후 `ACTUAL` 완료는 목표 이후 시간까지 포함한다. 두 요청 모두 `clientRequestId`를 받는다.

`DELETE /users/me`는 최근 인증을 요구하고 확인 후 계정의 라이브 데이터를 삭제하며 `204`를 반환한다. 서버가 삭제를 확정하기 전에는 App이 로컬 인증 정보를 지우지 않는다. 앱 밖 삭제 요청 경로는 Google Play 제출 전에 별도로 제공하며, 본인 확인을 거쳐 같은 계정 삭제 작업을 호출한다. 최근 인증 방식과 백업 데이터 보존·고지 정책은 출시 전에 확정한다.

주간·월간 통계는 동일한 응답 구조를 사용한다. `period`는 현지 날짜 범위, `totals`는 Focus·Break 초와 세션 수, `todos`는 Todo별 직접·하위·총 Focus 초와 `isDeleted`, `projects`는 프로젝트별 총 Focus 초, `planComparison`은 계획·블록 연결 실제·계획 외 Focus 초를 담는다. 월간 응답에만 `weeklyTrend`를 추가한다. 모든 시간은 반올림하지 않은 정수 초다. 살아 있는 Todo의 과거 Focus는 현재 프로젝트 경로로 집계한다. 삭제된 Todo는 Session의 원래 ID·시작 당시 제목과 삭제 직전 경로로 집계·반환한다.

```json
{
  "period": {"startDate": "2026-10-05", "endDate": "2026-10-11"},
  "totals": {"focusSeconds": 5400, "breakSeconds": 600, "focusSessions": 3, "shortBreakSessions": 1, "longBreakSessions": 0},
  "todos": [{"originalTodoId": "todo-id", "title": "작업 제목", "isDeleted": false, "directFocusSeconds": 1800, "descendantFocusSeconds": 3600, "totalFocusSeconds": 5400}],
  "projects": [{"originalTodoId": "project-id", "title": "프로젝트", "isDeleted": false, "totalFocusSeconds": 5400}],
  "planComparison": {"plannedSeconds": 7200, "actualSeconds": 3600, "unplannedFocusSeconds": 1800}
}
```

각 경로에 인증 여부, Path/Query/Body 스키마, 성공 상태와 응답 스키마, 오류 코드·메시지, 소유권·상태 전제조건, 멱등성, 예제를 기록한다. 활성 Session 중복 시작 시 `409` 오류의 세 필드만 반환하므로, App은 `/sessions/active`를 다시 조회해 현재 세션을 복원한다. Todo 완료 API는 완료/취소 의도를 표현하는 Body 계약이 필요하다.

근거: [기능 명세서](../reference/feature-requirements.txt) §16, §26.4.
