# Statistics

**우선순위:** 주간·월간 통계 P0, 월간 Calendar P1. **목적:** 계획한 시간과 실제 기록 시간을 Todo와 프로젝트 기준으로 비교한다.

## 시나리오와 출력

사용자는 Stats에서 주·월 기간을 선택해 총 Focus·Break 시간, 세션 수, Todo 직접 기록 시간, 하위 합산 시간, 프로젝트 총 시간, 계획 시간, 실제 시간, 계획 외 Focus 시간을 본다. 월간에는 주별 Focus 추이가 추가된다.

서버는 모든 시간을 반올림하지 않은 정수 초로 반환한다. App은 합계를 초 단위로 계산한 뒤 요약 화면에서 가장 가까운 분으로 표시하며, 60초 미만은 `1분 미만`으로 표시한다. 개별 Session 기록에는 정확한 초 단위 값을 확인할 수 있다. 수동 입력 세션은 사용자가 확정한 `durationSeconds`를 집계한다.

## 계산 규칙

- 기본 통계에는 COMPLETED 세션만 포함한다. DISCARDED와 삭제된 Todo에 연결돼 `excludedFromStatsAt`이 설정된 세션은 제외한다. 원본 세션은 로컬 데이터에 보존한다.
- Todo 직접 시간은 해당 Todo의 Focus duration 합이다. 하위 합산은 자손 Todo의 직접 시간 합이며 중복 집계하지 않는다.
- 블록 계획 시간은 현재 저장된 `endAt - startAt`이다. 블록을 나중에 수정하면 과거 기간의 계획 시간과 계획 대비 실제 비교도 최신 날짜·시간을 기준으로 다시 계산한다. 수정 전 계획의 스냅샷은 통계 기준으로 사용하지 않는다. 블록 실제 시간은 해당 `scheduleBlockId`로 완료된 Focus duration 합이며, Session 자체의 duration과 시작 날짜는 수정하지 않는다.
- 삭제되지 않은 블록은 Focus 기록이 없어도 계획 시간에 포함한다. soft delete된 블록은 연결된 COMPLETED Focus의 확정 duration 합이 0초보다 클 때만 계획·실제 비교에 포함하고, 그때는 마지막으로 저장된 날짜·시간을 사용한다. RUNNING·PAUSED·DISCARDED Focus는 이 조건을 충족하지 않는다.
- `scheduleBlockId`가 없는 완료 Focus는 계획 외 작업이다. 실제 시간이 계획보다 적음·같음·많음을 구분한다.
- Break는 Focus와 분리 집계한다. 삭제된 Todo와 블록의 과거 기록은 유지한다.
- 살아 있는 Todo의 과거 Focus는 현재 Todo·프로젝트 위치로 집계한다. Todo를 다른 프로젝트로 옮기면 이전 Focus 시간도 새 프로젝트 통계로 이동한다. Session 자체의 duration과 시작 날짜는 바꾸지 않는다.
- hard delete된 Todo의 과거 Focus는 원래 Todo ID와 시작 당시 제목을 유지해 표시한다. 프로젝트 집계에는 삭제 직전의 Todo·상위 경로를 사용하고 `isDeleted=true`로 표시한다. 삭제된 뒤에는 그 경로로 집계가 고정된다.

주간 통계는 월요일 시작이다. 기록 당시 기기 시간대와 현지 날짜를 보존하며 과거 기록은 이후 기기 시간대 변경으로 다른 날짜에 옮기지 않는다. 자정을 넘는 Focus·Break Session도 전체 duration을 시작 당시 현지 날짜에 귀속한다. `STATS-01`~`STATS-07`, `TIME-01`~`TIME-03`, `/statistics/*`, `AC-STATS-*`를 참조한다.

근거: [기능 명세서](../reference/feature-requirements.txt) §7.6, §12–13.
