# 결정 기록 및 남은 구현 세부사항

원본 문서와 이후 논의에서 확정한 제품 결정 기록이다. 결정된 제품 동작과 아직 구현 전에 구체화할 계약을 구분한다. 세부사항을 확정하면 기능 명세·계약·인수 기준을 함께 갱신한다.

| ID | 결정할 내용 | 영향 |
| --- | --- | --- |
| D-01 | **결정됨:** 성공은 데이터 직접 반환; 오류 본문은 `status`, `code`, `detail` 세 필드만 사용; Session 기록만 cursor 페이지네이션; 기본 상태 매핑은 [API 계약](../contracts/api.md) 참조. 경로별 DTO·세부 오류 코드는 각 기능 계약에서 확정 | App·Server 계약 전반 |
| D-02 | **결정됨:** Access 15분, Refresh 30일, 갱신마다 Refresh 교체·이전 토큰 폐기, 로그아웃은 현재 기기만 적용, Refresh는 App SecureStore·서버 해시 저장 | Auth, 보안 |
| D-03 | **범위 결정됨:** 이메일·비밀번호 가입 대신 OAuth 2.0/OIDC 로그인. Google·Kakao는 MVP, Apple은 후속. 제공자별 콜백 세부 계약은 구현 전 설계. 계정 연결 범위는 D-19 참조. iOS App Store 출시 전 로그인 서비스 지침 4.8 충족 여부 확인 | Auth, 출시 범위 |
| D-04 | **결정됨:** 행동 당시 사용자 기기의 시간대를 기준으로 현지 날짜·시각을 정하고 UTC 시각·IANA 시간대·당시 오프셋을 DB에 보존. 기기 시간대가 바뀌면 과거 기록의 원래 기준 시간대 표시. 주간 통계 월요일 시작. 자정 넘는 Schedule Block 금지. 자정 넘는 Focus·Break의 전체 duration은 시작 날짜에 귀속 | Today, Schedule, Stats |
| D-05 | **결정됨:** 날짜는 URL이 아니라 Body로 전달. `PATCH /todos/:id/days`에 `date`, `timezoneId`, `selected`를 보내 지정·해제. 반복 요청은 같은 최종 상태. 빠른 Todo 생성 응답의 세부 DTO는 해당 경로 설계 때 확정 | Today 계약 |
| D-06 | **결정됨:** Todo와 모든 자손 hard delete. 활성 Focus가 트리 안에 있으면 거부. 과거 완료 Focus·통계는 유지하고 시작 당시 Todo 제목·경로를 기록 화면에 보존. 통계의 프로젝트 경로는 D-16을 따른다. 삭제 취소는 MVP 제외 | Todo, 통계 |
| D-07 | **결정됨:** App은 기존 `PATCH /todos/:id` Body에 `parentId`, 0 기반 `orderIndex`만 전송. 버전 필드 없음. 서버가 사용자 단위 Todo 구조 변경을 직렬화하고 depth·순환·소유권을 검증한 뒤 형제 순서를 재배치. 동시 요청은 처리 순서대로 적용, 성공 후 App 재조회 | Todo API·트랜잭션 |
| D-08 | **결정됨:** `date`는 기기 현지 `YYYY-MM-DD`; `startAt`·`endAt`은 오프셋 포함 RFC 3339; `timezoneId`는 IANA 이름. 현지 5분 단위·최소 5분·자정 넘김 금지. Block 삭제는 soft delete. 삭제 후 통계 포함 조건은 D-20 참조 | Schedule, DB |
| D-09 | **결정됨:** 각 Session 변경 요청에 App이 UUID `clientRequestId`를 자동 부여·재전송 시 재사용. 서버는 사용자·ID 단위로 한 번만 적용. 새 시작이 활성 세션과 겹치면 `409 ACTIVE_SESSION_EXISTS`, 양립하지 않는 전이는 `409 INVALID_SESSION_TRANSITION`, 다른 내용의 동일 ID는 `409 REQUEST_ID_REUSED` | Session API |
| D-10 | **결정됨:** 목표 시각에도 자동 완료하지 않음. 복귀 시 목표 시간만 저장 또는 계속 기록 선택, 계속 기록은 초과 시간 포함·선택 상태 서버 저장. 목표 전 실제 경과 60초 미만은 저장·폐기 확인. 완료 화면에서 실제 기록 시간을 시·분 단위로 직접 입력 가능(1분~24시간); 수동 입력 출처와 원래 계산 시간 보존 | Timer, Stats |
| D-11 | **결정됨:** OS 알림 ID는 서버 DB에 저장하지 않음. 기기 예약 목록에서 Session ID로 찾아 시작·Resume 시 하나만 예약, Pause·Complete·Discard 시 취소. 재실행·재설치 후 서버 활성 상태와 대조해 미래 목표만 재예약. 다른 기기에서 변경한 직후 현재 기기가 백그라운드라면 즉시 원격 취소는 불가 | App 알림 |
| D-12 | **결정됨:** 주·월 응답은 `period`, `totals`, `todos`, `projects`, `planComparison` 공통 구조; 월간에 `weeklyTrend` 추가. 서버는 정수 초·무반올림, App은 합산 후 가장 가까운 분으로 표시하고 60초 미만은 `1분 미만`. 수동 입력은 최종 duration 사용. 삭제 Todo는 원래 ID·삭제 직전 경로로 집계하고 `isDeleted=true` | Stats API |
| D-13 | **결정됨:** 계정 삭제를 출시 전 P0에 포함. Settings에서 최근 인증·최종 확인 후 계정과 관련 Todo·Schedule·Session·통계·인증 데이터를 삭제하고 모든 Refresh Token을 무효화. Google Play용 외부 삭제 요청 웹 링크도 출시 전 제공. 최근 인증 구현·백업 보존 고지는 출시 전 세부 설계 | Settings, 개인정보 |
| D-14 | **결정됨:** Schedule Block을 수정하면 과거 계획·계획 대비 실제 통계에도 최신 블록 날짜·시간을 반영한다. 연결된 Focus Session의 실제 duration·시작 날짜는 유지한다. soft delete된 블록의 포함 여부는 D-20에 따른다. 수정 전 계획 스냅샷은 통계 기준으로 사용하지 않는다 | Schedule, Stats |
| D-15 | **결정됨:** 동일 사용자의 삭제되지 않은 Schedule Block은 겹치지 않는다. UTC 실제 시각의 반열린 구간으로 판정하고 경계가 맞닿으면 허용한다. Server는 생성·수정에서 거부하며 DB가 동시 요청도 보호한다. soft delete된 블록은 새 일정의 겹침 검사에서 제외한다 | Schedule, API, DB |
| D-16 | **결정됨:** 살아 있는 Todo를 다른 프로젝트로 옮기면 이전 Focus 시간도 현재 프로젝트 통계로 이동한다. Todo·자손 hard delete 직전에 완료 Session에 최종 경로를 저장하고, 삭제된 후에는 그 경로로 집계를 고정한다. Session 시작 당시 제목·경로 기록은 별도로 유지한다 | Todo, Stats, DB |
| D-17 | **결정됨:** Todo가 없는 Schedule Block에서 Focus를 시작할 때 App이 Todo 선택을 요청한다. 서버는 선택한 본인 Todo를 블록에 연결하고 같은 Todo·Block으로 Session을 한 트랜잭션에서 생성한다. 이미 연결된 블록의 Todo와 요청 Todo가 다르면 거부한다 | Schedule, Session, API |
| D-18 | **결정됨:** 미연결 Google·Kakao 로그인에서 제공자가 확인한 이메일이 기존 계정의 확인된 이메일과 같으면 새 계정·토큰을 만들지 않고 기존 계정이 있다고 안내한다(`409 ACCOUNT_EXISTS_WITH_EMAIL`). 이메일만으로 자동 병합하지 않는다. 이메일이 없거나 확인되지 않았으면 동일 계정으로 단정하지 않는다 | Auth, API, DB |
| D-19 | **결정됨:** MVP에는 Google·Kakao 계정 연결·병합·해제를 제공하지 않는다. 내부 계정당 로그인 제공자는 하나이며 동일 이메일 안내를 받은 사용자는 기존 제공자로 로그인한다. Settings의 제공자 정보는 읽기 전용이다 | Auth, Settings, DB |
| D-20 | **결정됨:** 삭제되지 않은 Schedule Block은 완료 Focus가 없어도 계획 시간에 포함한다. soft delete된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 마지막 계획 시간과 실제 Focus 시간을 계획·실제 통계에 남긴다. 그렇지 않은 삭제 블록은 계획 합계에서 제외한다 | Schedule, Stats |
| D-21 | **결정됨:** 상위·하위 Todo의 완료 상태는 독립적이다. 미완료 하위가 있어도 상위를 완료할 수 있으며, 상위를 완료하거나 완료 취소해도 하위 상태는 바꾸지 않는다 | Todo, API |

## 결정 기록 방법

각 결정에 선택안, 근거, 날짜, 영향받는 규칙·API·테스트를 추가한다. 결정 후 해당 행을 삭제하지 말고 상태를 `결정됨`으로 남겨 추적한다.
