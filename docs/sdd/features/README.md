# 기능 명세 인덱스

| 기능 | 우선순위 | 관련 규칙·계약 | 검증 |
| --- | --- | --- | --- |
| [인증](auth.md) | P0 | AUTH, `contracts/api.md` | AC-AUTH |
| [Todo와 Today](todo-today.md) | P0 | TODO, `contracts/data-model.md` | AC-TODO |
| [Schedule](schedule.md) | P0, 제스처 P1 | SCHEDULE | AC-SCHEDULE |
| [Timer와 Session](sessions.md) | P0 | SESSION, `domain/session-state.md` | AC-SESSION |
| [통계](statistics.md) | P0, Calendar P1 | STATS | AC-STATS |
| [설정과 알림](settings-notifications.md) | P0 | SETTINGS, NOTIFY | AC-NOTIFY |

기능 문서는 사용자 관찰 가능한 동작을 정의한다. 교차 기능 불변식은 [도메인 규칙](../domain/rules.md), API 경로와 계약 상태는 [API 계약](../contracts/api.md), 검증은 [인수 기준](../verification/acceptance.md)을 기준으로 한다.
