import type { AppData, Todo, TodoCategory } from '@/domain/types';

type StoredTodo = Omit<Todo, 'categoryId'> & { categoryId?: string | null };
type StoredAppData = Omit<AppData, 'categories' | 'todos'> & {
  categories?: TodoCategory[];
  todos: StoredTodo[];
};

/** v1 local data had no categories. Keep existing Todo and Session records intact. */
export const normalizeStoredData = (stored: StoredAppData): AppData => {
  const categories = Array.isArray(stored.categories) ? stored.categories : [];
  const categoryIds = new Set(categories.map((category) => category.id));
  return {
    ...stored,
    categories,
    todos: stored.todos.map((todo) => ({ ...todo, categoryId: todo.categoryId && categoryIds.has(todo.categoryId) ? todo.categoryId : null })),
  };
};
