# Timer와 Session

**우선순위:** P0. **목적:** Todo에 실제 Focus 시간을 기록하고 Break를 별도로 관리한다.

## 시나리오와 입출력

Today의 Todo, Todo 상세, Schedule Block에서 Focus를 준비한다. Focus는 Todo 필수, 목표 시간 선택 가능하며 기본 25분이다. Schedule에서 시작하면 Block ID를 저장한다. Break는 Todo 없이 Focus 완료 후 전환 화면에서 시작한다. 홈에는 독립적인 Break 시작 버튼을 두지 않는다. 기본값은 Short 5분, Long 15분이다.

Todo가 연결되지 않은 Schedule Block에서 Focus를 시작할 때는 App이 Todo 선택을 요청한다. 선택이 완료되면 서버가 해당 블록에 Todo를 연결하고 Session을 생성한다. 사용자가 선택을 취소하면 블록과 Session을 변경하지 않는다.

Timer는 종류, Todo, 연결 Schedule 제목과 시각, 목표 시간, 남은·경과 시간, 상태와 Start/Pause/Resume/Complete/Discard를 표시한다. 타이머 페이지의 상단 `설정` 버튼을 누르면 Focus/Short Break/Long Break 시간과 Long Break 간격을 조정하는 하단 시트가 열린다. 설정 버튼은 시작 전·실행 중·전체화면에서 제공한다. 취소하면 변경을 적용하지 않는다. 시작 전 시간 변경은 현재 READY 목표에도 적용하며 실행 중에는 다음 세션부터 적용한다. Today·Todo·Schedule의 이름 있는 집중 버튼을 통해 열면 선택한 Todo와 Block이 표시된 READY 세션을 준비한다. 어떤 진입 경로에서도 `시작`을 눌러야 시간이 흐르며, 준비 중 세션은 전역 미니 타이머에서 `시작 전`으로 표시한다.

아날로그 시계 안에는 디지털 시간을 겹쳐 놓지 않는다. 큰 숫자는 시계 아래에 두고, `전체화면`을 누르면 작업 설명을 숨긴 채 정사각형 시계 패널을 화면 너비에 맞춰 확대한다. 전체화면에서도 시작·일시정지·재개와 축소가 가능하다.

## 정상·예외 흐름

- 기기당 READY, RUNNING 또는 PAUSED 세션은 최대 하나다. 로컬 도메인 액션이 활성 세션 중복 생성을 막는다. API 전환 시 서버와 DB에서도 같은 제약을 적용한다.
- Timer 페이지의 `설정` 버튼에서 Focus, Short Break, Long Break 분과 Long Break 간격을 기기 로컬 Settings에 저장한다. 기본 Long Break 간격은 Focus 4회이며, 완료된 Focus 수가 설정한 간격에 도달하면 Long Break를 제안한다.
- 시작 전에는 집중할 Todo를 고르고 시간 설정을 확인한다. Timer 페이지 진입만으로 Session을 만들거나 시작하지 않는다.
- 사용자가 준비 중이거나 실행 중인 Session을 취소·폐기하면 해당 활성 레코드와 예약 알림을 제거하고 이전 화면으로 돌아간다. 완료된 기록은 이 동작으로 삭제하지 않는다.
- API 전환 시 시작·Pause·Resume·Complete·Discard 버튼 조작에 멱등 요청 ID를 적용한다. MVP-0에서는 Repository를 통해 AsyncStorage에 저장한다.
- Pause 동안 기록 시간이 증가하지 않는다. Resume 시 누적 시간에서 이어진다.
- 목표 전 종료도 지금까지의 시간을 COMPLETED로 저장할 수 있다. 1분 미만은 저장 전 확인을 제공할 수 있다. 저장하지 않으면 Discard한다.
- 목표 시각 도달은 COMPLETED 전이가 아니다. 로컬 알림을 보내고 앱 복귀 시 `목표 시간만 저장` 또는 `계속 기록`을 보여준다. 전자는 목표 시간만 기록 시간으로 확정한다. 후자는 목표 이후의 실제 경과 시간도 포함하며 세션은 RUNNING을 유지한다. 선택은 로컬 저장소에 보존해 앱 재실행 시 복원한다.
- 목표 전에 종료하며 실제 기록 시간이 1분 미만이면 저장 또는 폐기를 확인한다.
- Complete 화면에는 서버 기준으로 계산한 실제 시간을 기본값으로 표시한다. 사용자는 저장 전에 시간을 시·분 단위로 직접 수정할 수 있다. 수동 입력값은 1분 이상 24시간 이하로 받고, 최종 기록 시간으로 저장한다. 기록 히스토리에는 `수동 입력` 표시를 남긴다.
- Focus 시작 시 Todo 제목과 상위 경로를 세션에 스냅샷으로 저장한다. 이후 Todo가 hard delete되면 MVP 정책에 따라 해당 기록은 통계에서 제외한다.
- 앱 백그라운드·강제 종료 후 로컬 저장된 세션과 기준 시각으로 복원한다. JavaScript interval은 표시 갱신 전용이다.
- 저장 실패 시 오류 안내를 표시하고 완료된 것처럼 폼을 닫지 않는다.

상세 전이·필드 변경은 [Session 상태 전이](../domain/session-state.md)가 기준이다. `SESSION-01`~`SESSION-08`, `/sessions*`, `AC-SESSION-*`를 참조한다.

근거: [기능 명세서](../reference/feature-requirements.txt) §9–10, §17–18.
