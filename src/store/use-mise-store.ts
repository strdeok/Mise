import { create } from 'zustand';
import { activeSession, dateKey, descendants, elapsedSeconds, scheduleError, todoDepth, todoPath, timezoneId, utcOffsetMinutes } from '@/domain/logic';
import { localRepository } from '@/data/repository';
import type { AppData, CompletionMode, ScheduleBlock, Session, SessionType, Settings, Todo } from '@/domain/types';

type MiseStore = AppData & {
  hydrated: boolean; error: string | null;
  hydrate: () => Promise<void>; reset: () => Promise<void>;
  addTodo: (title: string, parentId?: string | null, today?: boolean) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>; toggleToday: (id: string, key: string) => Promise<void>; deleteTodo: (id: string) => Promise<boolean>;
  saveBlock: (input: Omit<ScheduleBlock, 'id' | 'deletedAt'> & { id?: string }) => Promise<string | null>;
  deleteBlock: (id: string) => Promise<void>;
  startSession: (type: SessionType, todoId?: string | null, scheduleBlockId?: string | null) => Promise<string | null>;
  pause: () => Promise<void>; resume: () => Promise<void>; complete: (mode: CompletionMode, manualSeconds?: number) => Promise<void>; discard: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
};

const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const initial: AppData = { todos: [], blocks: [], sessions: [], settings: { defaultFocusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, timerMode: 'countdown', focusNotificationEnabled: true, breakNotificationEnabled: true } };

export const useMiseStore = create<MiseStore>((set, get) => {
  const save = async (data: AppData) => { set(data); await localRepository.save(data); };
  return {
    ...initial, hydrated: false, error: null,
    hydrate: async () => { try { set({ ...(await localRepository.load()), hydrated: true, error: null }); } catch { set({ hydrated: true, error: '저장된 데이터를 불러오지 못했습니다.' }); } },
    reset: async () => { const data = await localRepository.reset(); set(data); },
    addTodo: async (title, parentId = null, today = true) => {
      const state = get(); const trimmed = title.trim();
      if (!trimmed) return set({ error: '할 일 제목을 입력해 주세요.' });
      if (todoDepth(parentId, state.todos) > 2) return set({ error: 'Todo는 3단계까지만 만들 수 있습니다.' });
      const siblings = state.todos.filter((todo) => todo.parentId === parentId);
      await save({ ...state, todos: [...state.todos, { id: id(), title: trimmed, parentId, status: 'open', order: siblings.length, todayDateKeys: today ? [dateKey()] : [] }] });
    },
    toggleTodo: async (todoId) => { const state = get(); await save({ ...state, todos: state.todos.map((todo) => todo.id === todoId ? { ...todo, status: todo.status === 'open' ? 'completed' : 'open' } : todo) }); },
    toggleToday: async (todoId, key) => { const state = get(); await save({ ...state, todos: state.todos.map((todo) => todo.id === todoId ? { ...todo, todayDateKeys: todo.todayDateKeys.includes(key) ? todo.todayDateKeys.filter((date) => date !== key) : [...todo.todayDateKeys, key] } : todo) }); },
    deleteTodo: async (todoId) => {
      const state = get(); const tree = descendants(todoId, state.todos); const active = activeSession(state.sessions);
      if (active?.todoId && tree.has(active.todoId)) { set({ error: '실행 중인 Focus가 연결된 Todo는 삭제할 수 없습니다.' }); return false; }
      const pathById = new Map([...tree].map((value) => [value, todoPath(value, state.todos)]));
      const sessions = state.sessions.map((session) => session.todoId && tree.has(session.todoId) && session.status === 'completed' ? { ...session, todoStatsPathSnapshot: pathById.get(session.todoId) ?? session.todoStatsPathSnapshot, todoId: null } : session);
      await save({ ...state, todos: state.todos.filter((todo) => !tree.has(todo.id)), blocks: state.blocks.map((block) => block.todoId && tree.has(block.todoId) ? { ...block, todoId: null } : block), sessions }); return true;
    },
    saveBlock: async (input) => {
      const state = get(); const block: ScheduleBlock = { id: input.id ?? id(), dateKey: input.dateKey, startMinute: input.startMinute, endMinute: input.endMinute, title: input.title.trim() || '새 일정', todoId: input.todoId ?? null, deletedAt: null };
      const message = scheduleError(block, state.blocks); if (message) { set({ error: message }); return null; }
      await save({ ...state, blocks: input.id ? state.blocks.map((value) => value.id === input.id ? block : value) : [...state.blocks, block] }); return block.id;
    },
    deleteBlock: async (blockId) => {
      const state = get(); const block = state.blocks.find((value) => value.id === blockId); if (!block) return;
      const snapshot = { title: block.title, dateKey: block.dateKey, plannedStartMinute: block.startMinute, plannedEndMinute: block.endMinute };
      const sessions = state.sessions.map((session) => session.scheduleBlockId === blockId && session.status === 'completed' && (session.recordedSeconds ?? 0) > 0 ? { ...session, scheduleSnapshot: snapshot } : session);
      await save({ ...state, blocks: state.blocks.map((value) => value.id === blockId ? { ...value, deletedAt: Date.now() } : value), sessions });
    },
    startSession: async (type, todoId = null, scheduleBlockId = null) => {
      const state = get(); if (activeSession(state.sessions)) { set({ error: '이미 실행 중인 세션이 있습니다.' }); return null; }
      let blocks = state.blocks;
      const block = scheduleBlockId ? blocks.find((value) => value.id === scheduleBlockId && !value.deletedAt) : undefined;
      if (type === 'focus' && !todoId) { set({ error: 'Focus에는 Todo가 필요합니다.' }); return null; }
      if (block && !block.todoId && todoId) blocks = blocks.map((value) => value.id === block.id ? { ...value, todoId } : value);
      if (block?.todoId && todoId !== block.todoId) { set({ error: '블록에 연결된 Todo와 다릅니다.' }); return null; }
      const now = Date.now(); const targetMinutes = type === 'focus' ? state.settings.defaultFocusMinutes : type === 'short_break' ? state.settings.shortBreakMinutes : state.settings.longBreakMinutes;
      const todo = todoId ? state.todos.find((value) => value.id === todoId) : undefined;
      const session: Session = { id: id(), type, status: 'running', todoId, scheduleBlockId, targetSeconds: targetMinutes * 60, accumulatedSeconds: 0, lastResumedAt: now, startedAt: now, completedAt: null, measuredSeconds: null, recordedSeconds: null, completionMode: null, targetReachedNotified: false, localStartDate: dateKey(), timezoneId: timezoneId(), utcOffsetMinutes: utcOffsetMinutes(), todoSnapshot: todo ? { title: todo.title, path: todoPath(todo.id, state.todos) } : null, todoStatsPathSnapshot: null, scheduleSnapshot: null };
      await save({ ...state, blocks, sessions: [...state.sessions, session] }); return session.id;
    },
    pause: async () => { const state = get(); const current = activeSession(state.sessions); if (!current || current.status !== 'running') return; const now = Date.now(); const seconds = elapsedSeconds(current, now); await save({ ...state, sessions: state.sessions.map((session) => session.id === current.id ? { ...session, status: 'paused', accumulatedSeconds: seconds, lastResumedAt: null } : session) }); },
    resume: async () => { const state = get(); const current = activeSession(state.sessions); if (!current || current.status !== 'paused') return; await save({ ...state, sessions: state.sessions.map((session) => session.id === current.id ? { ...session, status: 'running', lastResumedAt: Date.now() } : session) }); },
    complete: async (mode, manualSeconds) => { const state = get(); const current = activeSession(state.sessions); if (!current) return; const now = Date.now(); const measured = elapsedSeconds(current, now); const recorded = mode === 'target' ? current.targetSeconds : mode === 'manual' ? Math.max(60, Math.min(86400, manualSeconds ?? measured)) : measured; await save({ ...state, sessions: state.sessions.map((session) => session.id === current.id ? { ...session, status: 'completed', accumulatedSeconds: measured, lastResumedAt: null, completedAt: now, measuredSeconds: measured, recordedSeconds: recorded, completionMode: mode } : session) }); },
    discard: async () => { const state = get(); const current = activeSession(state.sessions); if (!current) return; await save({ ...state, sessions: state.sessions.map((session) => session.id === current.id ? { ...session, status: 'discarded', lastResumedAt: null, completedAt: Date.now() } : session) }); },
    updateSettings: async (patch) => { const state = get(); await save({ ...state, settings: { ...state.settings, ...patch } }); },
  };
});
