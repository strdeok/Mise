import type { ScheduleBlock, Session, Todo } from './types';

export const DAY_MINUTES = 24 * 60;
export const activeSession = (sessions: Session[]) => sessions.find((s) => s.status === 'running' || s.status === 'paused') ?? null;
export const dateKey = (date = new Date()) => date.toLocaleDateString('en-CA');
export const timezoneId = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const utcOffsetMinutes = (date = new Date()) => -date.getTimezoneOffset();
export const elapsedSeconds = (session: Session, now = Date.now()) =>
  session.accumulatedSeconds + (session.status === 'running' && session.lastResumedAt ? Math.max(0, Math.floor((now - session.lastResumedAt) / 1000)) : 0);
export const formatDuration = (seconds: number) => {
  if (seconds < 60) return '1분 미만';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}시간 ${minutes}분` : `${minutes}분`;
};
export const formatClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
export const scheduleError = (candidate: Pick<ScheduleBlock, 'dateKey' | 'startMinute' | 'endMinute' | 'id'>, blocks: ScheduleBlock[]) => {
  if (candidate.startMinute < 0 || candidate.endMinute > DAY_MINUTES || candidate.startMinute >= candidate.endMinute) return '시작과 종료 시간을 확인해 주세요.';
  if ((candidate.endMinute - candidate.startMinute) < 5) return '일정은 5분 이상이어야 합니다.';
  if (candidate.startMinute % 5 || candidate.endMinute % 5) return '시간은 5분 단위로 선택해 주세요.';
  const overlaps = blocks.some((block) => !block.deletedAt && block.id !== candidate.id && block.dateKey === candidate.dateKey && candidate.startMinute < block.endMinute && block.startMinute < candidate.endMinute);
  return overlaps ? '기존 일정과 시간이 겹칩니다.' : null;
};
export const todoPath = (todoId: string, todos: Todo[]) => {
  const path: string[] = [];
  let cursor = todos.find((todo) => todo.id === todoId);
  while (cursor) { path.unshift(cursor.title); cursor = cursor.parentId ? todos.find((todo) => todo.id === cursor!.parentId) : undefined; }
  return path;
};
export const todoDepth = (parentId: string | null, todos: Todo[]) => parentId ? todoPath(parentId, todos).length : 0;
export const descendants = (todoId: string, todos: Todo[]) => {
  const ids = new Set([todoId]);
  let changed = true;
  while (changed) { changed = false; todos.forEach((todo) => { if (todo.parentId && ids.has(todo.parentId) && !ids.has(todo.id)) { ids.add(todo.id); changed = true; } }); }
  return ids;
};
