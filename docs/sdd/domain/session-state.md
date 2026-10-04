# Session 상태 전이

`idle`은 DB 상태가 아니라 활성 Session이 없는 App 상태다. 종류는 `FOCUS`, `SHORT_BREAK`, `LONG_BREAK`이며 상태는 `RUNNING`, `PAUSED`, `COMPLETED`, `DISCARDED`다. 로컬 프로토타입은 기기 저장소, 서버 단계에서는 서버가 전이와 경과 시간의 최종 기준이다. `RUNNING`과 `PAUSED`를 합쳐 활성 Session은 최대 하나다.

## 전이표

| 요청 | 이전 → 이후 | 서버 필드 변경 | App 알림 |
| --- | --- | --- | --- |
| 시작 | 없음 → RUNNING | type, targetSeconds, startedAt, accumulatedSeconds=0, 참조 ID | 목표 시각 예약 |
| Pause | RUNNING → PAUSED | `accumulatedSeconds += now - startedAt`, pausedAt, status | 기존 예약 취소 |
| Resume | PAUSED → RUNNING | startedAt=now, status | 남은 시간으로 다시 예약 |
| Complete | RUNNING/PAUSED → COMPLETED | `completionMode=ACTUAL`이면 실제 경과, `TARGET`이면 목표 시간, `MANUAL`이면 사용자 입력 시간으로 durationSeconds 확정; 원래 계산 시간도 보존, endedAt, status | 기존 예약 취소 |
| Discard | RUNNING/PAUSED → DISCARDED | discardedAt, status | 기존 예약 취소 |

목표 시각이 지나도 세션 상태는 RUNNING이다. 사용자가 `목표 시간만 저장`을 선택하면 `completionMode=TARGET`으로 Complete한다. `계속 기록`을 선택하면 상태는 RUNNING으로 두고 선택 시각을 서버에 기록한다. 앱을 다시 열어도 계속 기록 선택을 복원한다. 사용자가 이후 Complete하면 실제 경과 시간을 저장한다. `TARGET` 완료 시 서버는 목표 도달 시각을 기준으로 `endedAt`을 확정한다.

Complete 화면에서 사용자가 시간을 수정하면 `completionMode=MANUAL`이 된다. 서버는 입력된 `durationSeconds`를 최종 기록으로 확정하고 계산된 실제 경과는 `measuredDurationSeconds`에 보존한다. 통계는 최종 기록을 사용하며 기록 화면에는 수동 입력임을 표시한다.

시간 단위는 초다. `lastResumedAt`은 가장 최근 RUNNING 구간의 시작 epoch이고 Resume 때 갱신한다. 실행 경과는 `accumulatedSeconds + (now - lastResumedAt)`이며 Pause 때 누적값을 확정하고 `lastResumedAt=null`로 둔다. 앱 복귀·재실행은 이 식으로 복원하며 매초 저장하지 않는다. 목표 도달은 상태를 바꾸지 않고 Session당 알림을 한 번만 예약한다. `targetSeconds`는 시작 후 바꿀 수 없고, 목표를 초과해도 경과 시간은 계속 증가한다.

## 거부 조건과 동시성

- 허용되지 않은 이전 상태, 다른 사용자 소유, 삭제 Todo 참조, 다른 사용자의 Block 참조는 거부한다.
- 새 Focus/Break 시작 전 동일 `clientRequestId`의 처리 기록을 확인한다. 이미 처리됐다면 새 세션을 만들지 않고 처음 결과를 반환한다. 새 요청인데 활성 세션이 있으면 `409 ACTIVE_SESSION_EXISTS`를 반환하고 App은 활성 세션을 재조회한다. 동시에 요청이 들어와도 DB partial unique index와 트랜잭션으로 활성 세션은 하나만 만든다.
- Pause·Resume·Complete·Discard도 각각 `clientRequestId`로 재요청을 식별한다. 동일 ID·내용은 이전 결과를 반환하고, 다른 내용의 동일 ID 재사용은 `409`로 거부한다. 서로 다른 ID의 경쟁 전이는 원자적으로 한 요청씩 상태를 다시 검증한다. 먼저 처리된 전이와 양립하지 않는 요청은 `409 INVALID_SESSION_TRANSITION`으로 거부한다.
- 오류 본문은 [API 공통 응답 규칙](../contracts/api.md)에 따른다.

## App 동기화

변경 성공 후 활성 세션·관련 Today·Stats Query를 무효화하거나 갱신한다. 실패 시 성공 상태를 확정하지 않고 현재 서버 상태를 재조회한다. 백그라운드에서는 초 단위 JS 실행을 가정하지 않는다. 앱 복귀·재실행 때 `/sessions/active`를 조회하고 서버 상태가 더 최신이면 이를 따른다. 알림 ID 저장 위치와 복구 방식은 설계 시 확정한다.

근거: [기능 명세서](../reference/feature-requirements.txt) §9–11, §17–18, §26.6.
