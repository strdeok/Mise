import { todoPath } from './logic';
import type { ScheduleBlock, Session, Todo } from './types';

export type StatsPeriod = { startDate: string; endDate: string; label: string };
export type TodoStat = { id: string; title: string; path: string[]; directSeconds: number; childSeconds: number; totalSeconds: number; isDeleted: boolean };
export type StatsSummary = {
  focusSeconds: number; breakSeconds: number; plannedSeconds: number; plannedFocusSeconds: number; unplannedFocusSeconds: number;
  byTodo: TodoStat[];
};

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
const pathKey = (path: string[]) => path.join('\u001f');

export function aggregateStats(sessions: Session[], blocks: ScheduleBlock[], todos: Todo[], period: StatsPeriod): StatsSummary {
  const completed = sessions.filter((session) => session.status === 'completed' && !session.excludedFromStatsAt && inPeriod(session.localStartDate, period));
  const focus = completed.filter((session) => session.type === 'focus');
  const focusSeconds = focus.reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0);
  const breakSeconds = completed.filter((session) => session.type !== 'focus').reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0);
  const deletedSnapshots = new Map<string, NonNullable<Session['scheduleSnapshot']>>();
  completed.forEach((session) => { if (session.scheduleBlockId && session.scheduleSnapshot) deletedSnapshots.set(session.scheduleBlockId, session.scheduleSnapshot); });
  const plannedSeconds = blocks.filter((block) => !block.deletedAt && inPeriod(block.dateKey, period)).reduce((sum, block) => sum + (block.endMinute - block.startMinute) * 60, 0) + [...deletedSnapshots.values()].filter((snapshot) => inPeriod(snapshot.dateKey, period)).reduce((sum, snapshot) => sum + (snapshot.plannedEndMinute - snapshot.plannedStartMinute) * 60, 0);

  const livePathIds = new Map<string, string>();
  todos.forEach((todo) => livePathIds.set(pathKey(todoPath(todo.id, todos)), todo.id));
  const values = new Map<string, TodoStat>();
  const add = (path: string[], seconds: number, direct: boolean, deleted: boolean) => {
    if (!path.length || seconds <= 0) return;
    const key = pathKey(path); const liveId = livePathIds.get(key); const id = liveId ?? `deleted:${key}`; const current = values.get(key) ?? { id, title: path[path.length - 1], path, directSeconds: 0, childSeconds: 0, totalSeconds: 0, isDeleted: !liveId && deleted };
    values.set(key, { ...current, directSeconds: current.directSeconds + (direct ? seconds : 0), totalSeconds: current.totalSeconds + seconds, isDeleted: current.isDeleted && !liveId });
  };
  focus.forEach((session) => {
    const currentTodo = session.todoId ? todos.find((todo) => todo.id === session.todoId) : undefined;
    const path = currentTodo ? todoPath(currentTodo.id, todos) : session.todoStatsPathSnapshot ?? session.todoSnapshot?.path ?? [];
    const seconds = session.recordedSeconds ?? 0;
    path.forEach((_, index) => add(path.slice(0, index + 1), seconds, index === path.length - 1, !currentTodo));
  });
  const byTodo = [...values.values()].map((value) => ({ ...value, childSeconds: value.totalSeconds - value.directSeconds })).sort((a, b) => a.path.length - b.path.length || b.totalSeconds - a.totalSeconds || a.title.localeCompare(b.title));
  return { focusSeconds, breakSeconds, plannedSeconds, plannedFocusSeconds: focus.filter((session) => session.scheduleBlockId).reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0), unplannedFocusSeconds: focus.filter((session) => !session.scheduleBlockId).reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0), byTodo };
}
