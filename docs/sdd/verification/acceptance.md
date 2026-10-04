# 인수 기준과 검증 명세

각 항목은 Given/When/Then 형태의 관찰 가능한 완료 조건이다. 테스트는 구현 내부 구조가 아니라 규칙을 확인한다. ID는 기능 문서 및 [규칙표](../domain/rules.md)와 연결한다.

## 인증

| ID | Given / When / Then | 검증 |
| --- | --- | --- |
| AC-AUTH-01 | 처음 로그인한 제공자 계정일 때 / 제공자 인증·검증이 성공하면 / 내부 사용자와 기본 Settings가 생성되고 내부 토큰이 발급된다. | API 통합, DB |
| AC-AUTH-02 | 이미 연결된 제공자 고유 사용자 ID로 / 다시 로그인하면 / 기존 내부 사용자로 로그인되고 중복 계정이 생기지 않는다. | API 통합, DB unique |
| AC-AUTH-03 | Access Token이 만료됐을 때 / 보호된 조회를 하면 / 갱신 성공 시 세션이 유지되고 갱신 실패 시 로그인 화면으로 이동한다. | App 흐름, API |
| AC-AUTH-04 | 로그인한 기기에서 / 로그아웃하면 / 해당 기기의 Refresh Token이 폐기되고 보호 화면에 접근할 수 없으며 다른 기기 세션은 유지된다. | API 통합, App |
| AC-AUTH-05 | 유효한 Refresh Token으로 / 토큰을 갱신하면 / 새 Refresh Token이 발급되고 이전 토큰의 재사용은 거부된다. | API 통합, DB 동시성 |
| AC-AUTH-06 | 발급 후 15분이 지난 Access Token 또는 30일이 지난 Refresh Token으로 / 인증을 시도하면 / 만료된 토큰은 수락되지 않는다. | API 통합 |
| AC-AUTH-07 | 제공자 로그인을 취소하거나 제공자 응답 검증이 실패할 때 / 앱으로 돌아오면 / Mise Table 내부 세션이 발급되지 않는다. | App, API |
| AC-AUTH-08 | 본인 계정에서 최근 인증과 최종 확인 뒤 계정 삭제를 요청하면 / 서버가 / 계정·Todo·Schedule·Session·설정·인증 연결을 삭제하고 모든 Refresh Token을 무효화한다. App은 인증 값과 예약 알림을 지운다. | API, DB, App |
| AC-AUTH-09 | 계정 삭제 서버 요청이 실패하면 / App은 / 삭제 완료로 표시하거나 로컬 인증 값을 먼저 지우지 않는다. | App 네트워크 |
| AC-AUTH-10 | Google로 가입한 계정의 확인된 이메일과 같은 확인된 이메일로 미연결 Kakao 로그인을 완료하면 / 서버는 / `409 ACCOUNT_EXISTS_WITH_EMAIL`을 반환하고 기존 계정 안내를 표시한다. 새 사용자·인증 연결·내부 토큰은 생성되지 않는다. | API, DB, App |
| AC-AUTH-11 | 새 제공자 로그인의 이메일이 없거나 확인되지 않았을 때 / 다른 계정의 이메일과 같아 보여도 / 이메일만으로 동일 계정이라 단정하거나 자동 연결하지 않는다. | API, DB |
| AC-AUTH-12 | 기존 계정에 다른 로그인 제공자를 추가하려고 할 때 / MVP App·API를 확인하면 / 연결·해제 기능이 없고 계정의 제공자 연결은 하나뿐이다. 동일 이메일 안내 후 기존 제공자로 로그인하면 원래 데이터에 접근할 수 있다. | App, API, DB |

## Todo·Today

| ID | Given / When / Then | 검증 |
| --- | --- | --- |
| AC-TODO-01 | depth 2 Todo가 있을 때 / 그 아래 자식을 만들면 / 서버가 거부하고 트리가 바뀌지 않는다. | Domain, API |
| AC-TODO-02 | 자손이 있는 Todo가 있을 때 / 자손 아래로 부모를 이동하면 / 서버가 순환 구조를 거부한다. | Domain, API |
| AC-TODO-03 | 부모 이동 후 자손 depth가 2를 넘을 때 / 이동을 요청하면 / 전체 이동이 거부된다. | Domain, DB transaction |
| AC-TODO-04 | 다른 사용자 Todo가 있을 때 / 부모 지정·조회·수정을 시도하면 / 접근이 거부된다. | API 권한 |
| AC-TODO-05 | 오늘로 지정하지 않은 장기 Todo가 있을 때 / 오늘 지정하면 / Today에 보이고 원래 Todo 정보는 유지된다. | API, App |
| AC-TODO-06 | Focus가 완료됐을 때 / Todo를 조회하면 / Todo 완료 상태는 사용자 변경 전까지 그대로다. | Domain, API |
| AC-TODO-07 | 과거 완료 Focus가 있는 상위 Todo를 삭제할 때 / 삭제를 확인하면 / 그 Todo와 자손 행은 제거되고 과거 세션의 시작 당시 제목·경로와 통계용 삭제 직전 경로가 남는다. | API, DB, 집계 |
| AC-TODO-08 | 삭제 대상 트리의 어느 Todo에라도 활성 Focus가 연결돼 있을 때 / 상위 Todo 삭제를 요청하면 / 트리 삭제 전체가 거부된다. | API, DB |
| AC-TODO-09 | 같은 Todo와 날짜에 `selected=true`를 두 번 보내면 / `todo_days`가 / 하나만 존재한다. 이후 `selected=false`를 보내면 해당 날짜 지정이 해제된다. | API, DB |
| AC-TODO-10 | 두 기기에서 같은 사용자의 Todo 이동·순서 변경을 동시에 요청하면 / 서버가 순서대로 처리하고 / 모든 Todo의 depth는 2 이하이며 형제 `order_index`는 중복 없이 연속된다. App은 최종 목록을 다시 조회한다. | DB 동시성, App |
| AC-TODO-11 | 미완료 하위 Todo가 있는 상위 Todo를 완료하거나 완료 취소하면 / 요청한 상위 Todo의 상태만 바뀌고 / 모든 하위 Todo의 완료 상태는 그대로다. | API, DB, App |

## Schedule

| ID | Given / When / Then | 검증 |
| --- | --- | --- |
| AC-SCHEDULE-01 | 유효한 Todo와 시각이 있을 때 / 블록을 생성하면 / 날짜별 Day View에 시간순으로 보인다. | API, App |
| AC-SCHEDULE-02 | 삭제되지 않은 기존 블록과 실제 시각 구간이 겹칠 때 / 새 블록을 생성하거나 기존 블록을 수정하면 / 서버가 `409 SCHEDULE_OVERLAP`으로 거부하고 기존 일정은 그대로다. 두 블록의 경계만 맞닿으면 저장된다. | API, DB |
| AC-SCHEDULE-03 | 종료가 시작 이하이거나 5분 미만이거나 현지 5분 단위에 맞지 않을 때 / 블록을 저장하면 / 서버가 거부한다. | Domain, API |
| AC-SCHEDULE-04 | 확정 duration이 0초보다 큰 COMPLETED Focus가 연결된 블록을 삭제할 때 / 삭제를 확인하면 / 블록은 soft delete되고 세션 기록·과거 계획 대비 실제 비교는 유지된다. | API, DB |
| AC-SCHEDULE-05 | 기록 당시 기기 시간대에서 자정을 넘는 시작·종료를 입력할 때 / 블록 생성을 요청하면 / 서버가 거부하고 블록이 생기지 않는다. | API, DB |
| AC-SCHEDULE-06 | 두 기기에서 같은 사용자의 겹치는 블록을 동시에 저장하면 / 서버는 / 최대 하나만 확정하고 다른 요청은 겹침 오류를 반환한다. | DB 동시성 |

## Session·Timer

| ID | Given / When / Then | 검증 |
| --- | --- | --- |
| AC-SESSION-01 | 활성 Session이 없을 때 / 본인 Todo로 Focus를 시작하면 / RUNNING 세션이 생기고 목표 시간이 저장된다. | API, DB |
| AC-SESSION-02 | RUNNING/PAUSED Session이 있을 때 / Focus 또는 Break 시작 요청을 하면 / 새 세션이 생기지 않고 `409 ACTIVE_SESSION_EXISTS`를 받으며 App은 활성 세션을 다시 조회한다. | API, 동시성 |
| AC-SESSION-03 | 시작 요청 두 개가 동시에 도착할 때 / 둘 다 처리되면 / 활성 세션은 정확히 하나다. | DB 제약·동시성 |
| AC-SESSION-04 | RUNNING 세션을 Pause한 뒤 시간이 지나면 / Timer를 보면 / 누적 시간이 증가하지 않는다. | Domain, App |
| AC-SESSION-05 | PAUSED 세션을 Resume하면 / 경과 시간이 / 이전 누적값에서 이어진다. | Domain, App |
| AC-SESSION-06 | 목표 시간 전 Focus를 Complete하면 / 완료 기록에 / 실제 경과 duration이 저장되고 Todo는 자동 완료되지 않는다. | API, DB |
| AC-SESSION-07 | 목표 시각이 지났을 때 / 앱을 다시 열면 / 자동 COMPLETED가 아닌 `목표 시간만 저장`·`계속 기록` 선택지가 보인다. 전자는 목표 duration으로 완료되고 후자는 목표 이후 시간도 계속 누적된다. | App 생명주기, API |
| AC-SESSION-08 | 앱을 강제 종료한 뒤 재실행하면 / 로그인·활성 세션이 복원되고 / 기준 시각으로 Timer가 다시 계산된다. | App E2E |
| AC-SESSION-09 | 세션을 Discard하면 / 기본 통계에 / 그 세션의 duration이 포함되지 않는다. | API, 집계 |
| AC-SESSION-10 | 상태 변경 요청이 실패하면 / UI가 / 성공 상태를 확정하지 않고 재시도 또는 동기화를 제공한다. | App 네트워크 |
| AC-SESSION-11 | 세션 시작·전이 요청의 응답이 유실돼 같은 `clientRequestId`로 다시 보내면 / 서버는 / 세션 생성·duration 계산·상태 전이를 두 번 수행하지 않고 처음 결과를 반환한다. | API, DB 동시성 |
| AC-SESSION-12 | 서로 다른 요청 ID의 Complete와 Discard가 동시에 도착하면 / 서버는 / 하나만 확정하고 다른 요청은 `409 INVALID_SESSION_TRANSITION`으로 거부한다. | API, DB 동시성 |
| AC-SESSION-13 | 목표 전 세션의 실제 경과가 60초 미만일 때 / 사용자가 완료를 누르면 / 저장 또는 폐기를 확인한 뒤 선택한 동작만 서버에 보낸다. | App |
| AC-SESSION-14 | 목표 이후 `계속 기록`을 선택하고 앱을 재실행하면 / 활성 세션을 복원할 때 / 선택 상태가 유지되고 목표 이후 시간이 실제 기록에 포함된다. | App 생명주기, API |
| AC-SESSION-15 | 완료 화면에서 계산된 시간을 시·분으로 수정해 저장하면 / Session의 최종 duration에 입력 시간이 기록되고 / 계산된 원래 시간과 `MANUAL` 출처가 보존돼 히스토리에서 구분된다. | App, API, DB |
| AC-SESSION-16 | Todo 없는 Schedule Block에서 Focus를 누르면 / App이 Todo 선택을 요청한다. 본인 Todo를 선택해 시작하면 / 블록에 해당 Todo가 연결되고 Session에 같은 `todoId`와 `scheduleBlockId`가 저장된다. 선택을 취소하거나 시작이 실패하면 블록과 Session은 변경되지 않는다. | App, API, DB transaction |
| AC-SESSION-17 | 이미 Todo가 연결된 Schedule Block에서 / 다른 `todoId`로 Focus 시작을 요청하면 / `409 SCHEDULE_TODO_MISMATCH`로 거부하고 블록·Session은 변경되지 않는다. | API |

## 통계·알림·설정

| ID | Given / When / Then | 검증 |
| --- | --- | --- |
| AC-STATS-01 | 자식 Todo 40분·20분과 부모 직접 30분 기록이 있을 때 / 부모 통계를 보면 / 직접 30분, 자손 60분, 총 90분이다. | 집계 단위 |
| AC-STATS-02 | 60분 블록에 완료 Focus 40분이 연결될 때 / 비교하면 / 계획보다 20분 적음으로 표시한다. | 집계·App |
| AC-STATS-03 | Block ID 없는 완료 Focus가 있을 때 / 통계를 보면 / 계획 외 시간에 포함된다. | 집계 |
| AC-STATS-04 | Focus와 Break 기록이 있을 때 / 기간 통계를 보면 / 각각 분리 집계된다. | 집계 |
| AC-STATS-05 | 사용자의 기기 시간대가 달라졌을 때 / 과거 블록·세션을 조회하면 / 기록 당시의 시간대와 현지 시각을 확인할 수 있고 과거 날짜는 바뀌지 않는다. | API, App |
| AC-STATS-06 | 주간 통계를 조회할 때 / 기간을 계산하면 / 월요일부터 일요일까지의 기록이 포함된다. | 집계 |
| AC-STATS-07 | Focus 또는 Break가 기록 당시 기기 시간대에서 자정을 넘을 때 / 날짜별 통계를 보면 / 전체 duration이 시작 날짜에만 포함된다. | 집계 |
| AC-STATS-08 | 30초·40초의 완료 Focus 두 개가 있을 때 / 기간 통계를 조회하면 / 서버 총합은 반올림 전 70초이고 App 요약 표시는 합산 후 약 1분이다. | 집계, App |
| AC-STATS-09 | 수동 입력 세션과 hard delete된 Todo의 완료 Focus가 있을 때 / 통계를 조회하면 / 최종 입력 duration이 원래 Todo·프로젝트 스냅샷 경로에 합산되고 `isDeleted=true`로 구분된다. | 집계, API |
| AC-STATS-10 | 60분 블록에 40분 Focus가 연결된 후 블록을 120분으로 수정하면 / 같은 기간 통계를 다시 조회할 때 / 계획은 120분, 블록 연결 실제는 40분으로 표시되고 Session의 duration은 그대로다. | 집계, API |
| AC-STATS-11 | 프로젝트 A의 Todo에 기록한 Focus가 있을 때 / Todo를 프로젝트 B로 이동하면 / 이전 Focus 시간도 B의 통계로 이동하고 A의 합계에서는 빠진다. 이후 Todo를 삭제하면 삭제 직전 B 경로에 시간이 남는다. | 집계, API, DB |
| AC-STATS-12 | 확정 duration이 0초보다 큰 완료 Focus가 없는 블록을 삭제하면 / 기간 통계를 다시 조회할 때 / 그 블록의 계획 시간이 합계에서 빠진다. 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 큰 블록을 삭제하면 계획·실제 시간이 모두 비교에 남는다. | 집계, API |
| AC-NOTIFY-01 | 알림 권한을 거부한 상태에서 / 세션을 시작하면 / Timer와 기록은 정상 동작한다. | App 기기 |
| AC-NOTIFY-02 | 종료 알림이 예약됐을 때 / Pause·Complete·Discard하면 / 이전 예약이 취소된다. | App 기기 |
| AC-NOTIFY-03 | 기본 시간을 바꾸고 활성 세션을 조회하면 / 기존 목표는 그대로이고 / 이후 새 세션에 변경값이 적용된다. | API, App |
| AC-NOTIFY-04 | 같은 Session의 종료 알림이 이미 예약됐을 때 / 앱을 재실행해 활성 세션을 복원하면 / 이 기기에 같은 Session의 예약 알림은 최대 하나다. | App 기기 |
| AC-NOTIFY-05 | 앱을 재설치한 뒤 활성 RUNNING 세션을 복원할 때 / 목표 시각이 미래면 / 이 기기에 종료 알림을 다시 예약하고, 이미 지났다면 처리 선택 화면을 보여준다. | App 기기 |

## 최소 검증 실행 순서

1. Domain 단위: Todo 트리, 시간 계산, 상태 전이, 통계 합산.
2. DB·동시성: 활성 세션 unique, 사용자별 격리, Todo hard delete 후 완료 기록 보존.
3. API 계약: 각 경로의 인증·입력·응답·오류와 서버 상태 일치.
4. App 흐름: 가입 → Today → Schedule → Focus → Break → Stats.
5. 기기 생명주기: 백그라운드, 강제 종료, 권한 거부, 알림 탭, 네트워크 오류.

구현이 시작되면 각 항목에 실제 테스트 파일과 실행 결과를 링크한다. 테스트를 만들기 전에는 완료 처리하지 않는다.
