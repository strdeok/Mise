import { beforeEach, describe, expect, it, vi } from 'vitest';

const { save } = vi.hoisted(() => ({ save: vi.fn(async () => {}) }));
vi.mock('@/data/repository', () => ({ localRepository: { save } }));

import { useMiseStore } from '@/store/use-mise-store';

describe('Todo 카테고리 동작', () => {
  beforeEach(() => {
    save.mockClear();
    useMiseStore.setState({ todos: [], categories: [], blocks: [], sessions: [], error: null });
  });

  it('카테고리 없이 등록하고, 선택·이름 변경·삭제 시 Todo를 유지한다', async () => {
    expect(await useMiseStore.getState().addTodo('미분류 작업')).toBe(true);
    expect(useMiseStore.getState().todos[0].categoryId).toBeNull();

    const categoryId = await useMiseStore.getState().saveCategory('업무');
    expect(categoryId).toBeTruthy();
    expect(await useMiseStore.getState().updateTodo(useMiseStore.getState().todos[0].id, {
      title: '미분류 작업', parentId: null, categoryId,
    })).toBe(true);
    expect(useMiseStore.getState().todos[0].categoryId).toBe(categoryId);

    expect(await useMiseStore.getState().saveCategory('회사', categoryId!)).toBe(categoryId);
    expect(useMiseStore.getState().categories[0].name).toBe('회사');
    await useMiseStore.getState().deleteCategory(categoryId!);
    expect(useMiseStore.getState().todos[0].categoryId).toBeNull();
    expect(useMiseStore.getState().todos).toHaveLength(1);
    expect(save).toHaveBeenCalled();
  });

  it('이름 중복과 없는 카테고리 참조를 거부한다', async () => {
    await useMiseStore.getState().saveCategory('업무');
    expect(await useMiseStore.getState().saveCategory(' 업무 ')).toBeNull();
    expect(await useMiseStore.getState().addTodo('작업', null, true, 'missing')).toBe(false);
    expect(useMiseStore.getState().todos).toHaveLength(0);
  });
});
