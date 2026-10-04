# 데이터 모델 초안

논리 모델이다. Prisma 스키마의 타입, FK 삭제 동작, 실제 SQL 제약은 구현 전에 확정한다. 실제 시각은 UTC로 저장하고 사용자가 기록을 만들 때 기기에 설정된 IANA 시간대 이름과 그 시점의 UTC 오프셋을 함께 저장한다. 로컬 날짜는 기록 당시 기기 시간대에서 계산해 보존한다. 경과 시간의 기준은 서버에 저장된 시각과 누적 초다.

| 테이블 | 주요 필드 | 핵심 제약·인덱스 |
| --- | --- | --- |
| `users` | id, email?, verified_email_normalized?, created_at, updated_at | 내부 사용자. 확인된 이메일의 정규화 값은 nullable unique이며 새 제공자 로그인 시 중복 계정 안내에 사용. 제공자 고유 ID가 인증의 기본 키 |
| `auth_identities` | id, user_id, provider, provider_user_id, email?, email_verified, created_at, updated_at | `(provider, provider_user_id)` unique, MVP에서는 `user_id`도 unique여서 사용자당 제공자 연결 하나만 허용. 제공자가 확인한 이메일만 중복 검사에 사용 |
| `refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at, created_at | 사용자 FK, 해시 저장, 기기별 토큰 구분, 갱신 시 교체·이전 토큰 폐기 |
| `todos` | id, user_id, parent_id, title, description, depth, status, order_index, completed_at, created_at, updated_at | depth 0–2, 자기·순환 참조 금지, hard delete, `(user_id,parent_id)` 조회 |
| `todo_days` | id, user_id, todo_id, date, timezone_id, created_at | `(todo_id,date)` unique, 사용자 일치, Todo hard delete 시 함께 제거 |
| `schedule_blocks` | id, user_id, todo_id?, date, start_at, end_at, timezone_id, utc_offset_minutes, title?, note?, deleted_at, created_at, updated_at | 기록 당시 기기 현지 날짜·시간, 5분 단위·최소 5분·자정 넘김 금지, soft delete, Todo 선택, Todo hard delete 시 `todo_id` null, `(user_id,date)` 인덱스, 삭제되지 않은 동일 사용자 블록끼리 실제 시각 구간 겹침 금지 |
| `sessions` | id, user_id, todo_id?, todo_title_snapshot?, todo_path_snapshot?, todo_stats_path_snapshot?, schedule_block_id?, previous_session_id?, type, status, target_seconds, started_at, paused_at?, ended_at?, accumulated_seconds, measured_duration_seconds?, duration_seconds?, completion_mode?, continued_past_target_at?, discarded_at?, local_start_date, timezone_id, utc_offset_minutes, created_at, updated_at | Focus 시작 시 Todo와 제목·경로 스냅샷 필수, 삭제된 Todo의 통계에는 삭제 직전 경로 스냅샷 필수, 완료 duration 필수, 수동 입력 시 계산 시간도 보존, Todo hard delete 시 `todo_id` null, 사용자당 활성 1개, `(user_id, created_at)` 조회 |
| `session_requests` | id, user_id, client_request_id, action, payload_hash, session_id?, response_status, response_body, created_at | `(user_id,client_request_id)` unique, 처리 결과 보존과 같은 요청 재적용 방지 |
| `settings` | id, user_id, default_focus_minutes, short_break_minutes, long_break_minutes, timer_mode, focus_notification_enabled, break_notification_enabled, created_at, updated_at | user_id unique |

## 로컬 RN 프로토타입 모델

로컬 프로토타입은 AsyncStorage Repository가 단독으로 저장·복원한다. Zustand는 UI가 호출하는 액션과 메모리 상태만 관리하며 직접 영속화하지 않는다.

| 모델 | 핵심 필드 |
| --- | --- |
| `ScheduleBlock` | id, dateKey, startMinute, endMinute, title, todoId?, deletedAt? |
| `Session` | id, type, status, todoId?, scheduleBlockId?, targetSeconds, accumulatedSeconds, lastResumedAt?, startedAt, completedAt?, measuredSeconds?, recordedSeconds?, completionMode?, localStartDate, timezoneId, utcOffsetMinutes, todoSnapshot?, todoStatsPathSnapshot?, scheduleSnapshot? |

`ScheduleBlock`은 계획이므로 날짜와 분 단위를, `Session`은 실제 사건이므로 epoch timestamp를 사용한다. 완료 시 통계는 `recordedSeconds`를 쓰고, Timer로 측정한 원래 값은 `measuredSeconds`에 남긴다. 삭제되는 Block과 연결된 완료 Focus에는 삭제 직전 제목·날짜·시작·종료를 `scheduleSnapshot`으로 기록해 과거 계획 비교를 고정한다.

## DB에서 반드시 고려할 정합성

- `sessions`의 사용자별 활성 단일성은 `status IN ('RUNNING','PAUSED')` 조건의 PostgreSQL partial unique index가 필요하다. Prisma 모델만으로 표현되지 않는 제약은 migration SQL로 관리한다.
- Todo 부모 변경의 순환·자손 depth 검사는 다중 행을 보므로 서버 트랜잭션에서 검사하고 경쟁 변경에 대비한다.
- Todo와 자손을 hard delete할 때 `todo_days`는 함께 제거한다. 완료 Session과 통계 기록에는 물리 삭제 cascade를 적용하지 않는다. 삭제 트리의 Todo마다 완료 Session에 삭제 직전 경로를 `todo_stats_path_snapshot`으로 먼저 저장한다. 과거 Session의 `todo_id`와 Schedule Block의 `todo_id`는 `ON DELETE SET NULL`로 처리하고, Session 시작 당시 제목·경로와 Block 제목은 보존한다.
- `todo_path_snapshot`은 Focus 시작 당시 자기 자신과 상위 Todo의 ID·제목·순서를 담아 기록 화면에 사용한다. 살아 있는 Todo의 통계는 현재 트리를 따라가며, 삭제된 Todo의 통계는 삭제 트랜잭션에서 확정한 `todo_stats_path_snapshot`을 사용한다. 두 스냅샷은 구분해 보존한다.
- 삭제 트리에 연결된 활성 Focus가 있으면 트리 삭제 전체를 거부한다. 삭제와 참조 해제는 하나의 트랜잭션으로 처리한다.
- Todo 생성·삭제·부모 이동·순서 변경은 동일 사용자 `users` 행 잠금 아래 처리해 구조 변경을 직렬화한다. 서버가 형제의 `order_index`를 0부터 연속된 값으로 재배치한다. DB 직렬화 실패는 트랜잭션 전체를 재시도한다.
- Focus의 Todo 필수 여부, 상태별 필수 시각·duration, 블록의 최소 5분은 DB CHECK와 서버 검증의 경계를 설계 때 결정한다.
- `user_id`가 중복 저장된 FK 관계는 동일 사용자 소유를 서버가 검증한다. 가능하면 DB의 복합 FK도 검토한다.
- Refresh Token 교체는 서버 트랜잭션에서 단일 사용 처리한다. 동시 갱신과 폐기된 토큰 재사용을 구분할 수 있는 토큰 관계·기기 식별 필드는 Prisma 설계에서 정한다.
- 새 제공자 ID로 로그인할 때 제공자가 확인한 이메일이 있으면 대소문자 차이를 무시하는 정규화 값으로 기존 계정을 확인한다. 기존 계정이 있으면 사용자·인증 연결·토큰을 새로 만들지 않고 충돌을 반환한다. 확인된 이메일의 unique 제약으로 동시 첫 로그인에서도 중복 사용자를 막는다. 이메일이 없거나 확인되지 않았으면 이메일 일치를 추정하지 않는다.
- 계정 삭제는 Todo 개별 삭제와 달리 해당 사용자의 모든 Session·Session 요청 기록·블록·Todo·오늘 지정·설정·인증 연결·Refresh Token·사용자 행을 함께 삭제한다. 삭제 순서와 FK 동작은 하나의 서버 작업에서 정합성을 보장하도록 설계한다.
- Session 변경과 `session_requests` 기록은 같은 트랜잭션에서 커밋한다. 같은 요청 ID의 재전송은 저장된 결과와 연결 Session을 반환하고 다시 상태를 변경하지 않는다.
- Todo가 없는 Schedule Block에서 Focus를 시작할 때는 해당 블록의 `todo_id` 변경, Session 생성, `session_requests` 기록을 같은 트랜잭션에서 커밋한다. 세션 시작이 실패하면 블록의 Todo 연결도 롤백한다. 이미 연결된 블록은 요청 Todo와 일치해야 한다.
- Schedule Block의 `start_at`·`end_at`과 Session의 시각은 UTC 실시간 값으로 보관한다. `timezone_id`와 `utc_offset_minutes`는 생성·시작 당시 기기 값의 스냅샷이며 기기 시간대 변경으로 과거 기록을 덮어쓰지 않는다. 경과 시간 계산에 기기 시계의 임의 변경을 사용하지 않는다.
- Schedule Block의 날짜·시작·종료를 수정하면 해당 블록 행의 최신 값을 계획 통계에 사용한다. Session에는 계획 시간 스냅샷을 두지 않으며, 블록 수정이 Session의 실제 duration·시작 당시 현지 날짜를 변경하지 않는다. soft delete된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 마지막 값으로 과거 비교에 포함한다.
- Schedule Block의 겹침은 UTC `[start_at, end_at)` 구간으로 판정한다. 삭제되지 않은 동일 사용자 블록의 생성·수정이 동시에 일어나도 겹침이 확정되지 않도록 PostgreSQL의 조건부 exclusion constraint를 migration SQL로 둔다. soft delete된 블록은 제약 대상에서 제외한다.

근거: [기능 명세서](../reference/feature-requirements.txt) §15, §17, §21.
