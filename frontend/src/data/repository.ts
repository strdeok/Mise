import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '@/domain/logic';
import type { AppData, Settings } from '@/domain/types';
import { normalizeStoredData } from './normalize';

const key = 'mise-table.local-data.v1';
const settings: Settings = { defaultFocusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4, timerMode: 'countdown', focusNotificationEnabled: true, breakNotificationEnabled: true };
export const fixture = (): AppData => {
  const today = dateKey();
  const now = Date.now();
  return {
    todos: [
      { id: 'project', title: '프로젝트', parentId: null, categoryId: null, status: 'open', order: 0, todayDateKeys: [today] },
      { id: 'timer', title: '타이머 화면 구현', parentId: 'project', categoryId: null, status: 'open', order: 0, todayDateKeys: [today] },
      { id: 'stats', title: '통계 카드 정리', parentId: 'project', categoryId: null, status: 'open', order: 1, todayDateKeys: [today] },
    ],
    categories: [],
    blocks: [
      { id: 'block-1', dateKey: today, startMinute: 9 * 60, endMinute: 10 * 60, title: '타이머 화면 구현', todoId: 'timer', deletedAt: null },
      { id: 'block-2', dateKey: today, startMinute: 10 * 60 + 30, endMinute: 11 * 60 + 15, title: '통계 카드 정리', todoId: 'stats', deletedAt: null },
    ],
    sessions: [{ id: 'session-demo', type: 'focus', status: 'completed', todoId: 'timer', scheduleBlockId: 'block-1', targetSeconds: 1500, accumulatedSeconds: 0, lastResumedAt: null, startedAt: now - 86400000, completedAt: now - 84600000, measuredSeconds: 1800, recordedSeconds: 1800, completionMode: 'actual', targetReachedNotified: true, continuedPastTargetAt: null, localStartDate: today, timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone, utcOffsetMinutes: -new Date().getTimezoneOffset(), todoSnapshot: { title: '타이머 화면 구현', path: ['프로젝트', '타이머 구현'] }, todoStatsPathSnapshot: null, scheduleSnapshot: null }],
    settings,
  };
};

export const localRepository = {
  async load(): Promise<AppData> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fixture();
    try { return normalizeStoredData(JSON.parse(raw) as AppData); }
    catch { throw new Error('저장된 데이터 형식을 읽지 못했습니다. 원본은 보존했습니다.'); }
  },
  async save(data: AppData) { await AsyncStorage.setItem(key, JSON.stringify(data)); },
  async reset() { const data = fixture(); await this.save(data); return data; },
};
