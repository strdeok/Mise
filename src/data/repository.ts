import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '@/domain/logic';
import type { AppData, Settings } from '@/domain/types';

const key = 'mise-table.local-data.v1';
const settings: Settings = { defaultFocusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, timerMode: 'countdown', focusNotificationEnabled: true, breakNotificationEnabled: true };
export const fixture = (): AppData => {
  const today = dateKey();
  const now = Date.now();
  return {
    todos: [
      { id: 'project', title: 'Mise Table', parentId: null, status: 'open', order: 0, todayDateKeys: [today] },
      { id: 'timer', title: '타이머 화면 구현', parentId: 'project', status: 'open', order: 0, todayDateKeys: [today] },
      { id: 'stats', title: '통계 카드 정리', parentId: 'project', status: 'open', order: 1, todayDateKeys: [today] },
    ],
    blocks: [
      { id: 'block-1', dateKey: today, startMinute: 9 * 60, endMinute: 10 * 60, title: '타이머 화면 구현', todoId: 'timer', deletedAt: null },
      { id: 'block-2', dateKey: today, startMinute: 10 * 60 + 30, endMinute: 11 * 60 + 15, title: '통계 카드 정리', todoId: 'stats', deletedAt: null },
    ],
    sessions: [{ id: 'session-demo', type: 'focus', status: 'completed', todoId: 'timer', scheduleBlockId: 'block-1', targetSeconds: 1500, accumulatedSeconds: 0, lastResumedAt: null, startedAt: now - 86400000, completedAt: now - 84600000, measuredSeconds: 1800, recordedSeconds: 1800, completionMode: 'actual', targetReachedNotified: true, continuedPastTargetAt: null, localStartDate: today, timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone, utcOffsetMinutes: -new Date().getTimezoneOffset(), todoSnapshot: { title: '타이머 화면 구현', path: ['Mise Table', '타이머 구현'] }, todoStatsPathSnapshot: null, scheduleSnapshot: null }],
    settings,
  };
};
export const localRepository = {
  async load(): Promise<AppData> { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as AppData : fixture(); },
  async save(data: AppData) { await AsyncStorage.setItem(key, JSON.stringify(data)); },
  async reset() { const data = fixture(); await this.save(data); return data; },
};
