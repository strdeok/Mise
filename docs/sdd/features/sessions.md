# Timer와 Session

**우선순위:** P0. **목적:** Todo에 실제 Focus 시간을 기록하고 Break를 별도로 관리한다.

## 시나리오와 입출력

Today의 Todo, Todo 상세, Schedule Block에서 Focus를 시작한다. Focus는 Todo 필수, 목표 시간 선택 가능하며 기본 25분이다. Schedule에서 시작하면 Block ID를 저장한다. Break는 Todo 없이 직접 시작하거나 Focus 완료 후 선택할 수 있고 기본값은 Short 5분, Long 15분이다.

Todo가 연결되지 않은 Schedule Block에서 Focus를 시작할 때는 App이 Todo 선택을 요청한다. 선택이 완료되면 서버가 해당 블록에 Todo를 연결하고 Session을 생성한다. 사용자가 선택을 취소하면 블록과 Session을 변경하지 않는다.

Timer는 종류, Todo, 목표 시간, 남은·경과 시간, 상태와 Pause/Resume/Complete/Discard를 표시한다. 실행 중 세션은 전역 미니 타이머에서도 보인다.

## 정상·예외 흐름

- 한 사용자에게 RUNNING 또는 PAUSED 세션은 최대 하나다. 다른 요청 ID의 중복 시작은 서버와 DB에서 막고 `409 ACTIVE_SESSION_EXISTS`를 반환한다. App은 활성 세션을 다시 조회한다.
- App은 시작·Pause·Resume·Complete·Discard 버튼 조작마다 `clientRequestId`를 만들고 같은 조작의 재전송에는 같은 ID를 사용한다. 서버는 같은 ID를 한 번만 적용하고 기존 결과를 반환한다. 다른 시작 요청이 활성 세션과 겹치면 `409 ACTIVE_SESSION_EXISTS`를 반환하고 App은 활성 세션을 다시 조회한다.
- Pause 동안 기록 시간이 증가하지 않는다. Resume 시 누적 시간에서 이어진다.
- 목표 전 종료도 지금까지의 시간을 COMPLETED로 저장할 수 있다. 1분 미만은 저장 전 확인을 제공할 수 있다. 저장하지 않으면 Discard한다.
- 목표 시각 도달은 DB의 COMPLETED 전이가 아니다. 로컬 알림을 보내고 앱 복귀 시 `목표 시간만 저장` 또는 `계속 기록`을 보여준다. 전자는 목표 시간만 COMPLETED duration으로 확정한다. 후자는 목표 이후의 실제 경과 시간도 포함하며 세션은 RUNNING을 유지한다. 선택은 서버에 보존해 앱 재실행 시 복원한다.
- 목표 전에 종료하며 실제 기록 시간이 1분 미만이면 저장 또는 폐기를 확인한다.
- Complete 화면에는 서버 기준으로 계산한 실제 시간을 기본값으로 표시한다. 사용자는 저장 전에 시간을 시·분 단위로 직접 수정할 수 있다. 수동 입력값은 1분 이상 24시간 이하로 받고, 최종 기록 시간으로 저장한다. 기록 히스토리에는 `수동 입력` 표시를 남긴다.
- Focus 시작 시 Todo 제목과 상위 경로를 세션에 스냅샷으로 저장한다. 이후 Todo가 hard delete되어도 완료 세션과 통계가 유지된다.
- 앱 백그라운드·강제 종료 후 서버 활성 상태와 기준 시각으로 복원한다. JavaScript interval은 표시 갱신 전용이다.
- 상태 변경 요청 실패 시 성공한 것처럼 보이지 않으며 재시도와 서버 재동기화를 제공한다.

상세 전이·필드 변경은 [Session 상태 전이](../domain/session-state.md)가 기준이다. `SESSION-01`~`SESSION-08`, `/sessions*`, `AC-SESSION-*`를 참조한다.

근거: [기능 명세서](../reference/feature-requirements.txt) §9–10, §17–18.
