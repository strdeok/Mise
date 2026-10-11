import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Label, palette, Sub, Title } from '@/components/mise-ui';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { todoPath } from '@/domain/logic';
import type { Todo } from '@/domain/types';
import { font, size, space } from '@/constants/layout';
import { useMiseStore } from '@/store/use-mise-store';

export function TodoDetailSheet({ todoId, onSelect, onEdit, onClose }: {
  todoId: string | null;
  onSelect: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onClose: () => void;
}) {
  const todos = useMiseStore((state) => state.todos);
  const addTodo = useMiseStore((state) => state.addTodo);
  const toggleTodo = useMiseStore((state) => state.toggleTodo);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const todo = todos.find((item) => item.id === todoId && !item.archivedAt);
  const children = todos.filter((item) => item.parentId === todoId && !item.archivedAt).sort((a, b) => a.order - b.order);
  const path = todo ? todoPath(todo.id, todos) : [];
  const canAddChild = path.length < 3;

  useEffect(() => { setDraft(''); }, [todoId]);

  const submit = async () => {
    const title = draft.trim();
    if (!todo || !title || saving) return;
    setSaving(true);
    try { await addTodo(title, todo.id); setDraft(''); }
    finally { setSaving(false); }
  };

  return <Modal visible={!!todo} transparent animationType="slide" onRequestClose={onClose}>
    <SafeAreaSheet>
      <Card style={styles.sheet}>
        <View style={styles.header}>
          <Label>{path.length > 1 ? path.slice(0, -1).join(' / ') : 'TODO'}</Label>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
        <Title>{todo?.title}</Title>
        <View style={styles.actions}>
          {todo && <Button label="수정" tone="quiet" onPress={() => onEdit(todo)} />}
          {todo?.parentId && <Button label="상위 Todo" tone="quiet" onPress={() => onSelect(todo.parentId!)} />}
        </View>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>하위 Todo</Text><Sub>{children.length}개</Sub></View>
        {children.map((child) => <View key={child.id} style={styles.childRow}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: child.status === 'completed' }} accessibilityLabel={`${child.title} 완료 전환`} onPress={() => toggleTodo(child.id)} style={[styles.check, child.status === 'completed' && styles.checked]}>
            {child.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${child.title} 상세 보기`} onPress={() => onSelect(child.id)} style={styles.childTitleButton}>
            <Text style={[styles.childTitle, child.status === 'completed' && styles.done]}>{child.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>)}
        {!children.length && <Sub>아직 하위 Todo가 없습니다.</Sub>}
        {canAddChild && todo && <View style={styles.addSection}>
          <Field value={draft} onChangeText={setDraft} placeholder="하위 Todo 이름" />
          <Button label="+ 하위 Todo 추가" onPress={submit} disabled={!draft.trim() || saving} />
        </View>}
        {!canAddChild && <Sub>Todo는 3단계까지만 만들 수 있습니다.</Sub>}
      </Card>
    </SafeAreaSheet>
  </Modal>;
}

const styles = StyleSheet.create({
  sheet: { gap: space[4] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 28, color: palette.ink, lineHeight: 32 },
  actions: { flexDirection: 'row', gap: space[2] },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', gap: space[2], borderTopWidth: 1, borderColor: palette.line, paddingTop: space[4] },
  sectionTitle: { fontSize: font.lg, fontWeight: '600', color: palette.ink },
  childRow: { minHeight: size.touchLarge, flexDirection: 'row', alignItems: 'center', gap: space[2], borderBottomWidth: 1, borderColor: palette.line },
  check: { width: 23, height: 23, borderRadius: 5, borderWidth: 1.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: palette.ink },
  checkmark: { color: palette.card },
  childTitleButton: { minHeight: size.touch, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  childTitle: { color: palette.ink, fontWeight: '600', fontSize: font.md, flexShrink: 1 },
  done: { textDecorationLine: 'line-through', color: palette.muted },
  chevron: { fontSize: 22, color: palette.muted, paddingHorizontal: space[2] },
  addSection: { gap: space[2] },
});
