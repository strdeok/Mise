import { describe, expect, it } from 'vitest';
import { normalizeStoredData } from '@/data/normalize';
import type { Settings } from '@/domain/types';

const settings: Settings = { defaultFocusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, timerMode: 'countdown', focusNotificationEnabled: true, breakNotificationEnabled: true };

describe('카테고리 로컬 데이터 호환', () => {
  it('기존 Todo를 미분류로 유지하고 다른 기록을 보존한다', () => {
    const data = normalizeStoredData({
      todos: [{ id: 'todo', title: '기존 작업', parentId: null, status: 'open', order: 0, todayDateKeys: [] }],
      blocks: [], sessions: [], settings,
    });
    expect(data.categories).toEqual([]);
    expect(data.todos[0].categoryId).toBeNull();
    expect(data.todos[0].title).toBe('기존 작업');
  });

  it('삭제된 카테고리를 가리키는 Todo만 미분류로 바꾼다', () => {
    const data = normalizeStoredData({
      categories: [{ id: 'work', name: '업무', order: 0 }],
      todos: [
        { id: 'a', title: '유효', parentId: null, categoryId: 'work', status: 'open', order: 0, todayDateKeys: [] },
        { id: 'b', title: '이전', parentId: null, categoryId: 'removed', status: 'open', order: 1, todayDateKeys: [] },
      ],
      blocks: [], sessions: [], settings,
    });
    expect(data.todos.map((todo) => todo.categoryId)).toEqual(['work', null]);
  });
});
