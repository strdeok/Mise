# 도메인 규칙

ID는 기능 명세, 계약, 인수 기준을 연결한다. 검증 위치의 `DB`는 가능한 범위의 DB 제약과 트랜잭션을 뜻하며, 구체 구현은 설계 시 확정한다.

| ID | 규칙 | 검증 위치 |
| --- | --- | --- |
| AUTH-01 | 내부 사용자는 검증된 `(provider, provider_user_id)` 조합으로 먼저 찾는다. 새 제공자 연결의 확인된 이메일이 기존 계정의 확인된 이메일과 같으면 새 계정·토큰을 만들지 않고 기존 계정이 있음을 알린다. 이메일만으로 자동 병합하지 않는다. | DB unique, Server |
| AUTH-02 | 제공자 인증 응답은 서버에서 검증한다. Refresh Token 원문을 서버에 장기 저장하지 않는다. | Server, DB 모델 |
| AUTH-03 | 로그아웃은 현재 기기의 Refresh Token을 폐기하고 다른 기기 세션과 개인 데이터는 보존한다. | Server |
| AUTH-04 | App은 Refresh Token을 SecureStore에 보관한다. | App |
| AUTH-05 | Access Token은 15분, Refresh Token은 30일 유효하다. 갱신마다 새 Refresh Token을 발급하고 이전 토큰을 폐기한다. 이전 토큰 재사용은 거부한다. | Server, DB transaction |
| AUTH-06 | 모바일 인증은 시스템 브라우저와 Authorization Code + PKCE를 사용한다. 제공자 토큰을 내부 API 인증 토큰으로 사용하지 않는다. | App, Server |
| AUTH-07 | 제공자 로그인 취소·거부·검증 실패 시 내부 사용자 세션을 발급하지 않는다. | App, Server |
| AUTH-08 | 계정 삭제는 최근 인증·최종 확인 뒤 본인 계정과 모든 관련 개인 데이터를 삭제한다. 모든 Refresh Token을 무효화하고, 남은 유효기간의 Access Token도 사용자 존재 검증 등으로 보호된 API에서 거부한다. | App, Server, DB |
| AUTH-09 | MVP에서 내부 계정의 로그인 제공자는 하나다. 다른 제공자 추가·계정 병합·연결 해제는 지원하지 않는다. 동일 이메일 충돌을 안내받은 사용자는 기존 제공자로 로그인한다. | App, Server, DB |
| TODO-01 | 제목은 공백만으로 만들 수 없다. | Server |
| TODO-02 | Todo depth는 0, 1, 2이며 부모가 없으면 0이다. | Server, DB 일부 |
| TODO-03 | 자기 자신·자손·다른 사용자 Todo를 부모로 지정할 수 없다. 이동 후 모든 자손의 depth도 2 이하여야 한다. | Server transaction |
| TODO-04 | Todo 완료는 명시적 사용자 행동이다. 상위·하위 Todo의 완료 상태는 독립적이며 한 Todo의 완료·완료 취소가 다른 Todo의 상태를 바꾸지 않는다. 미완료 하위가 있어도 상위 완료를 허용한다. 세션 완료나 계획 종료로 자동 완료하지 않는다. | Server, App |
| TODO-05 | Todo 삭제는 해당 Todo와 자손의 hard delete다. 과거 완료 Focus Session과 통계는 스냅샷으로 보존한다. | Server, DB |
| TODO-06 | 삭제 대상 트리의 Todo 중 하나라도 활성 Focus와 연결돼 있으면 삭제할 수 없다. | Server transaction |
| TODO-07 | Todo의 특정 날짜 포함은 Todo 자체와 별도이며 Todo·날짜 조합은 중복될 수 없다. | DB unique |
| TODO-08 | 부모·순서 변경 시 서버는 자손 depth·순환·소유권을 검사하고 관련 형제의 `order_index`를 중복 없이 재정렬한다. 같은 사용자의 Todo 구조 변경은 서버에서 직렬화한다. | Server transaction, DB lock |
| SCHEDULE-01 | 블록의 현지 시작·종료는 5분 단위에 맞아야 하고 길이는 5분 이상이어야 한다. `date`·UTC 오프셋·`timezoneId`가 실제 시각과 일치해야 한다. | Server, DB 일부 |
| SCHEDULE-02 | 같은 사용자의 삭제되지 않은 Schedule Block은 실제 시각 구간이 서로 겹칠 수 없다. 끝 시각과 다음 시작 시각이 같으면 허용한다. 생성·수정의 동시 요청에도 이 규칙을 지킨다. | Server, DB |
| SCHEDULE-03 | Todo 없는 블록을 허용한다. 연결 Todo는 같은 사용자 소유여야 한다. | Server |
| SCHEDULE-04 | 블록 삭제는 soft delete이며 Todo·과거 Session은 삭제하지 않는다. 삭제된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 계획·실제 비교 통계에 포함한다. | Server, DB |
| SCHEDULE-05 | 블록의 시작·종료는 기록 당시 기기 시간대 기준 같은 현지 날짜 안에 있어야 한다. 자정을 넘는 블록은 거부한다. | Server |
| SESSION-01 | Focus 시작 시 같은 사용자 소유의 존재하는 Todo가 필수다. 시작 당시 Todo 제목·상위 경로를 스냅샷으로 저장한다. Todo hard delete 후 완료 Focus의 `todo_id`는 null이 될 수 있다. Break는 Todo 없이 가능하다. | Server, DB 일부 |
| SESSION-02 | 사용자당 RUNNING·PAUSED 세션은 합쳐서 최대 1개다. | DB partial unique index, Server transaction |
| SESSION-03 | 상태 전이는 [전이표](session-state.md)의 여섯 가지뿐이다. 종료 상태는 재시작하지 않는다. | Server |
| SESSION-04 | RUNNING 경과 시간은 `accumulatedSeconds + (now - startedAt)`이며 PAUSED는 누적값이다. | Server, App |
| SESSION-05 | COMPLETED 시 duration을 확정하고 DISCARDED는 기본 통계에서 제외한다. | Server |
| SESSION-06 | 목표 시각 도달만으로 COMPLETED가 되지 않는다. 사용자가 `목표 시간만 저장`을 선택하면 duration은 targetSeconds, `계속 기록`을 선택하면 이후 경과 시간도 실제 기록에 포함한다. 선택 상태를 서버에 저장한다. | Server, App |
| SESSION-07 | 새 세션은 설정의 현재 기본값을 복사하되 이후 설정 변경으로 목표를 바꾸지 않는다. | Server |
| SESSION-08 | Session의 Todo·Block·previousSession 참조는 모두 본인 소유여야 한다. Schedule Block에서 Focus를 시작할 때 블록에 Todo가 있으면 그 Todo와 Session의 Todo가 같아야 한다. 블록에 Todo가 없으면 선택한 Todo 연결과 세션 생성을 하나의 트랜잭션으로 처리한다. | Server transaction |
| SESSION-09 | 모든 Session 변경 요청은 사용자별 고유 `clientRequestId`를 가진다. 같은 ID·동일 내용의 재요청은 효과를 다시 적용하지 않고 이전 결과를 반환한다. 같은 ID를 다른 내용에 재사용하면 거부한다. | Server, DB unique |
| SESSION-10 | 목표 전 완료 시 계산된 경과 시간이 60초 미만이면 저장 또는 폐기 여부를 사용자에게 확인한다. | App |
| SESSION-11 | Complete 시 사용자는 서버 계산 시간을 시·분 단위로 수정할 수 있다. 수동 입력 duration은 60~86,400초이고 통계에는 최종 `durationSeconds`를 사용한다. 계산된 원래 시간과 입력 출처도 보존한다. | App, Server, DB |
| STATS-01 | 직접 Focus 시간과 자손 합산을 구분하고 같은 Session을 중복 합산하지 않는다. 살아 있는 Todo의 과거 Focus는 현재 Todo 트리 위치로 집계한다. 삭제된 Todo는 삭제 직전 경로로 집계한다. | Server |
| STATS-02 | 삭제되지 않은 블록은 Focus 유무와 관계없이 계획 시간에 포함한다. 삭제된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 계획 시간에 포함한다. 블록 계획 시간은 종료와 시작의 차이이고 실제 시간은 연결된 COMPLETED Focus의 duration 합이다. | Server |
| STATS-03 | 블록 ID 없는 COMPLETED Focus는 계획 외 작업이다. | Server |
| STATS-04 | Break는 Focus와 별도 집계한다. | Server |
| STATS-05 | 사용자·기간 범위로 집계하고 다른 사용자의 기록은 포함하지 않는다. | Server |
| STATS-06 | 집계와 API는 정수 초를 사용하며 Session별 반올림을 하지 않는다. 수동 입력 세션은 최종 `durationSeconds`를 사용한다. App은 합산 후 표시만 반올림한다. | Server, App |
| STATS-07 | hard delete된 Todo의 완료 Focus 원본은 보존한다. 로컬 MVP-0에서는 삭제 시 `excludedFromStatsAt`을 기록해 Today Focus와 기본 통계에서 제외한다. 출시 단계의 서버 정책은 제품 결정을 다시 반영한다. | App, Server |
| SETTINGS-01 | 사용자마다 Settings는 하나이고 가입 시 기본값을 만든다. | DB unique, Server |
| SETTINGS-02 | 설정 변경은 새 세션부터 적용한다. | Server, App |
| NOTIFY-01 | 알림 권한 거부는 세션 기록을 막지 않는다. | App |
| NOTIFY-02 | 시작·Resume 시 기기 예약 목록에서 Session ID가 같은 기존 알림을 정리하고 하나만 예약한다. Pause·Complete·Discard 시 취소한다. 앱 재실행·재설치 후 서버 활성 상태와 예약 목록을 대조한다. | App |
| NOTIFY-03 | 알림 탭은 관련 Timer로 이동한다. | App |
| NOTIFY-04 | 목표 시각이 이미 지난 활성 세션에는 새 종료 알림을 예약하지 않고 목표 시간 처리 화면을 제공한다. OS 알림 ID는 서버 DB에 저장하지 않는다. | App |
| TIME-01 | Today·Schedule의 현지 날짜·시각은 사용자가 해당 행동을 할 때 기기에 설정된 시간대를 기준으로 한다. 실제 시각은 UTC로 저장한다. | App, Server, DB |
| TIME-02 | 기록의 시간대 이름과 당시 UTC 오프셋을 저장하고, 이후 기기 시간대가 달라지면 과거 기록에 원래 기준 시간대를 표시한다. 과거 날짜·시각을 자동 재해석하지 않는다. | App, Server, DB |
| TIME-03 | 주간 통계는 월요일 시작이다. 자정을 넘기는 Focus·Break Session의 전체 duration은 Session 시작 당시 기기 시간대의 `local_start_date`에 귀속한다. | Server |

모든 개인 리소스는 인증 사용자 `userId`로 범위를 제한한다. 클라이언트가 보낸 `userId`는 권한 판단에 사용하지 않는다. 네트워크 변경 실패는 성공으로 표시하지 않고, 서버 재조회로 상태를 맞춘다.
