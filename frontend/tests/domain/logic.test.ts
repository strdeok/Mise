import { describe, expect, it } from 'vitest';
import { activeSession, elapsedSeconds, scheduleError, todoDepth, todoPath } from '@/domain/logic';
import type { ScheduleBlock, Session, Todo } from '@/domain/types';

const todos: Todo[] = [
  { id: 'project', title: '프로젝트', parentId: null, status: 'open', order: 0, todayDateKeys: [] },
  { id: 'task', title: '작업', parentId: 'project', status: 'open', order: 0, todayDateKeys: [] },
];

const block = (input: Partial<ScheduleBlock> = {}): ScheduleBlock => ({ id: 'a', dateKey: '2026-10-06', startMinute: 540, endMinute: 600, title: '집중', todoId: null, deletedAt: null, ...input });
const session = (input: Partial<Session> = {}): Session => ({ id: 's', type: 'focus', status: 'running', todoId: 'task', scheduleBlockId: null, targetSeconds: 1500, accumulatedSeconds: 120, lastResumedAt: 1_000, startedAt: 0, completedAt: null, measuredSeconds: null, recordedSeconds: null, completionMode: null, targetReachedNotified: false, continuedPastTargetAt: null, localStartDate: '2026-10-06', timezoneId: 'Asia/Seoul', utcOffsetMinutes: 540, todoSnapshot: null, todoStatsPathSnapshot: null, scheduleSnapshot: null, excludedFromStatsAt: null, ...input });

describe('Schedule 불변식', () => {
  it('겹치지 않고 경계가 맞닿는 블록은 저장할 수 있다', () => {
    expect(scheduleError(block({ id: 'b', startMinute: 600, endMinute: 660 }), [block()])).toBeNull();
  });

  it('겹침, 5분 미만, 자정 넘김을 거부한다', () => {
    expect(scheduleError(block({ id: 'b', startMinute: 590, endMinute: 620 }), [block()])).toBe('기존 일정과 시간이 겹칩니다.');
    expect(scheduleError(block({ id: 'b', startMinute: 600, endMinute: 603 }), [])).toBe('일정은 5분 이상이어야 합니다.');
    expect(scheduleError(block({ id: 'b', startMinute: 1435, endMinute: 1445 }), [])).toBe('시작과 종료 시간을 확인해 주세요.');
  });
});

describe('Todo·Session 도메인 규칙', () => {
  it('Todo 경로와 깊이를 계산한다', () => {
    expect(todoPath('task', todos)).toEqual(['프로젝트', '작업']);
    expect(todoDepth('project', todos)).toBe(1);
  });

  it('running 세션의 경과 시간과 paused 세션의 단일 활성 상태를 계산한다', () => {
    expect(elapsedSeconds(session(), 11_900)).toBe(130);
    expect(activeSession([session({ status: 'completed' }), session({ id: 'paused', status: 'paused', lastResumedAt: null })])?.id).toBe('paused');
  });
});
