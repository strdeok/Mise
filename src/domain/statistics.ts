import type { ScheduleBlock, Session, Todo } from './types';

export type StatsPeriod = { startDate: string; endDate: string; label: string };
export type StatsSummary = {
  focusSeconds: number; breakSeconds: number; plannedSeconds: number; plannedFocusSeconds: number; unplannedFocusSeconds: number;
  byTodo: { id: string; title: string; path: string[]; seconds: number }[];
};

const toDate = (key: string) => new Date(`${key}T12:00:00`);
const keyOf = (value: Date) => value.toLocaleDateString('en-CA');
const plusDays = (value: Date, days: number) => { const next = new Date(value); next.setDate(next.getDate() + days); return next; };
export const weekPeriod = (anchor = new Date()): StatsPeriod => {
  const start = plusDays(anchor, -((anchor.getDay() + 6) % 7)); const end = plusDays(start, 6);
  return { startDate: keyOf(start), endDate: keyOf(end), label: `${keyOf(start).slice(5).replace('-', '.')} ~ ${keyOf(end).slice(5).replace('-', '.')}` };
};
export const monthPeriod = (anchor = new Date()): StatsPeriod => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12); const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
  return { startDate: keyOf(start), endDate: keyOf(end), label: `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월` };
};
export const movePeriod = (period: 'week' | 'month', anchor: Date, direction: number) => period === 'week' ? plusDays(anchor, direction * 7) : new Date(anchor.getFullYear(), anchor.getMonth() + direction, 15, 12);
const inPeriod = (key: string, period: StatsPeriod) => key >= period.startDate && key <= period.endDate;

export function aggregateStats(sessions: Session[], blocks: ScheduleBlock[], todos: Todo[], period: StatsPeriod): StatsSummary {
  const completed = sessions.filter((session) => session.status === 'completed' && inPeriod(session.localStartDate, period));
  const focus = completed.filter((session) => session.type === 'focus');
  const focusSeconds = focus.reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0);
  const breakSeconds = completed.filter((session) => session.type !== 'focus').reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0);
  const deletedSnapshots = new Map<string, NonNullable<Session['scheduleSnapshot']>>();
  completed.forEach((session) => { if (session.scheduleBlockId && session.scheduleSnapshot) deletedSnapshots.set(session.scheduleBlockId, session.scheduleSnapshot); });
  const plannedSeconds = blocks.filter((block) => !block.deletedAt && inPeriod(block.dateKey, period)).reduce((sum, block) => sum + (block.endMinute - block.startMinute) * 60, 0) + [...deletedSnapshots.values()].filter((snapshot) => inPeriod(snapshot.dateKey, period)).reduce((sum, snapshot) => sum + (snapshot.plannedEndMinute - snapshot.plannedStartMinute) * 60, 0);
  const names = new Map(todos.map((todo) => [todo.id, todo.title]));
  const values = new Map<string, { title: string; path: string[]; seconds: number }>();
  focus.forEach((session) => {
    const id = session.todoId ?? `deleted:${session.todoSnapshot?.path.join('/') ?? session.id}`;
    const title = names.get(session.todoId ?? '') ?? session.todoSnapshot?.title ?? '삭제된 Todo';
    const path = session.todoStatsPathSnapshot ?? session.todoSnapshot?.path ?? [title]; const existing = values.get(id);
    values.set(id, { title, path, seconds: (existing?.seconds ?? 0) + (session.recordedSeconds ?? 0) });
  });
  return { focusSeconds, breakSeconds, plannedSeconds, plannedFocusSeconds: focus.filter((session) => session.scheduleBlockId).reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0), unplannedFocusSeconds: focus.filter((session) => !session.scheduleBlockId).reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0), byTodo: [...values.entries()].map(([id, value]) => ({ id, ...value })).sort((a, b) => b.seconds - a.seconds) };
}
