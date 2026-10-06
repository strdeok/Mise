import { describe, expect, it } from 'vitest';
import { aggregateStats } from '@/domain/statistics';
import type { ScheduleBlock, Session, Todo } from '@/domain/types';

const period = { startDate: '2026-10-05', endDate: '2026-10-11', label: '검증 기간' };
const todo: Todo = { id: 'todo', title: '통계 작업', parentId: null, status: 'open', order: 0, todayDateKeys: [] };
const completeFocus = (input: Partial<Session> = {}): Session => ({ id: 'focus', type: 'focus', status: 'completed', todoId: 'todo', scheduleBlockId: null, targetSeconds: 1500, accumulatedSeconds: 1800, lastResumedAt: null, startedAt: 0, completedAt: 1, measuredSeconds: 1800, recordedSeconds: 1800, completionMode: 'actual', targetReachedNotified: true, continuedPastTargetAt: null, localStartDate: '2026-10-06', timezoneId: 'Asia/Seoul', utcOffsetMinutes: 540, todoSnapshot: { title: '통계 작업', path: ['통계 작업'] }, todoStatsPathSnapshot: null, scheduleSnapshot: null, excludedFromStatsAt: null, ...input });

describe('통계 집계', () => {
  it('완료 Focus의 recordedSeconds를 Todo와 Focus 합계에 반영한다', () => {
    const result = aggregateStats([completeFocus()], [], [todo], period);
    expect(result.focusSeconds).toBe(1800);
    expect(result.byTodo).toMatchObject([{ title: '통계 작업', directSeconds: 1800, totalSeconds: 1800 }]);
  });

  it('삭제 Todo에 연결돼 통계 제외 표시가 있는 Session은 집계하지 않는다', () => {
    const result = aggregateStats([completeFocus({ todoId: null, todoStatsPathSnapshot: ['삭제된 작업'], excludedFromStatsAt: 1 })], [], [], period);
    expect(result.focusSeconds).toBe(0);
    expect(result.byTodo).toEqual([]);
  });

  it('삭제된 블록의 snapshot은 완료 Focus가 있을 때 계획 시간으로 남는다', () => {
    const withSnapshot = completeFocus({ scheduleBlockId: 'deleted-block', scheduleSnapshot: { title: '삭제한 일정', dateKey: '2026-10-06', plannedStartMinute: 540, plannedEndMinute: 600 } });
    const deleted: ScheduleBlock = { id: 'deleted-block', dateKey: '2026-10-06', startMinute: 540, endMinute: 600, title: '삭제한 일정', todoId: 'todo', deletedAt: 1 };
    expect(aggregateStats([withSnapshot], [deleted], [todo], period).plannedSeconds).toBe(3600);
  });
});
