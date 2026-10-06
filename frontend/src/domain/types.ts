export type TodoStatus = 'open' | 'completed';
export type SessionType = 'focus' | 'short_break' | 'long_break';
export type SessionStatus = 'running' | 'paused' | 'completed' | 'discarded';
export type CompletionMode = 'actual' | 'target' | 'manual';

export type Todo = {
  id: string;
  title: string;
  parentId: string | null;
  status: TodoStatus;
  order: number;
  todayDateKeys: string[];
  archivedAt?: number | null;
};

export type ScheduleBlock = {
  id: string;
  dateKey: string;
  startMinute: number;
  endMinute: number;
  title: string;
  todoId: string | null;
  deletedAt: number | null;
};

export type TodoSnapshot = { title: string; path: string[] };
export type ScheduleSnapshot = {
  title: string;
  dateKey: string;
  plannedStartMinute: number;
  plannedEndMinute: number;
};

export type Session = {
  id: string;
  type: SessionType;
  status: SessionStatus;
  todoId: string | null;
  scheduleBlockId: string | null;
  targetSeconds: number;
  accumulatedSeconds: number;
  lastResumedAt: number | null;
  startedAt: number;
  completedAt: number | null;
  measuredSeconds: number | null;
  recordedSeconds: number | null;
  completionMode: CompletionMode | null;
  targetReachedNotified: boolean;
  continuedPastTargetAt: number | null;
  localStartDate: string;
  timezoneId: string;
  utcOffsetMinutes: number;
  todoSnapshot: TodoSnapshot | null;
  todoStatsPathSnapshot: string[] | null;
  scheduleSnapshot: ScheduleSnapshot | null;
  /** Todo가 삭제되어 사용자 통계에서 숨긴 기록인지 여부. */
  excludedFromStatsAt?: number | null;
};

export type Settings = {
  defaultFocusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  timerMode: 'countdown' | 'elapsed';
  focusNotificationEnabled: boolean;
  breakNotificationEnabled: boolean;
};

export type AppData = { todos: Todo[]; blocks: ScheduleBlock[]; sessions: Session[]; settings: Settings };
