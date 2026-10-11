import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, palette, Sub, Title } from '@/components/mise-ui';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { dateKey, descendants, todoPath } from '@/domain/logic';
import type { Todo } from '@/domain/types';
import { font, size, space } from '@/constants/layout';
import { useMiseStore } from '@/store/use-mise-store';

type Props = {
  todo: Todo | null;
  context: 'today' | 'list';
  archived?: boolean;
  onClose: () => void;
  onEdit: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
};

export function TodoActionsSheet({ todo, context, archived = false, onClose, onEdit, onOpen }: Props) {
  const todos = useMiseStore((state) => state.todos);
  const toggleToday = useMiseStore((state) => state.toggleToday);
  const archiveTodo = useMiseStore((state) => state.archiveTodo);
  const reorderTodo = useMiseStore((state) => state.reorderTodo);
  const deleteTodo = useMiseStore((state) => state.deleteTodo);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const close = () => { setConfirmingDelete(false); onClose(); };
  const act = (action: () => void | Promise<unknown>) => { close(); void action(); };
  const siblingIds = todo ? todos.filter((item) => item.parentId === todo.parentId && !item.archivedAt).sort((a, b) => a.order - b.order).map((item) => item.id) : [];
  const siblingIndex = todo ? siblingIds.indexOf(todo.id) : -1;
  const childCount = todo ? descendants(todo.id, todos).size - 1 : 0;

  return <Modal visible={!!todo} transparent animationType="slide" onRequestClose={close}>
    <SafeAreaSheet><Card style={styles.sheet}>
      <View style={styles.heading}><Title>{confirmingDelete ? 'Todo 삭제' : todo?.title}</Title><Pressable accessibilityRole="button" accessibilityLabel="메뉴 닫기" onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
      {confirmingDelete ? <>
        <Sub>{childCount ? `하위 Todo ${childCount}개도 함께 삭제됩니다. ` : ''}완료 Focus 기록은 보존하지만 통계에서는 제외합니다.</Sub>
        <View style={styles.confirmActions}><Button label="돌아가기" tone="quiet" onPress={() => setConfirmingDelete(false)} /><Button label="삭제 확인" tone="danger" onPress={() => todo && act(() => deleteTodo(todo.id))} /></View>
      </> : <>
        {todo && <>
          <Action label="수정" onPress={() => act(() => onEdit(todo))} />
          {context === 'today' ? <Action label="오늘에서 제외" onPress={() => act(() => toggleToday(todo.id, dateKey()))} /> : <>
            {!archived && todoPath(todo.id, todos).length < 3 && <Action label="하위 Todo 추가" onPress={() => act(() => onOpen(todo))} />}
            {!archived && <>
              <Action label="위로 이동" disabled={siblingIndex <= 0} onPress={() => act(() => reorderTodo(todo.id, -1))} />
              <Action label="아래로 이동" disabled={siblingIndex < 0 || siblingIndex >= siblingIds.length - 1} onPress={() => act(() => reorderTodo(todo.id, 1))} />
            </>}
            <Action label={archived ? '복원' : '보관'} onPress={() => act(() => archiveTodo(todo.id, !archived))} />
          </>}
          {!archived && <Action label="삭제" destructive onPress={() => setConfirmingDelete(true)} />}
        </>}
      </>}
    </Card></SafeAreaSheet>
  </Modal>;
}

function Action({ label, onPress, disabled = false, destructive = false }: { label: string; onPress: () => void; disabled?: boolean; destructive?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={styles.action}>
    <Text style={[styles.actionText, destructive && styles.destructive, disabled && styles.disabled]}>{label}</Text>
    {!destructive && <Text style={[styles.chevron, disabled && styles.disabled]}>›</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  sheet: { gap: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[2] },
  close: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 28, color: palette.ink, lineHeight: 32 },
  action: { minHeight: size.touchLarge, borderTopWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: palette.ink, fontSize: font.md, fontWeight: '600' },
  destructive: { color: palette.red },
  disabled: { opacity: 0.35 },
  chevron: { color: palette.muted, fontSize: 22 },
  confirmActions: { flexDirection: 'row', gap: space[2], marginTop: space[4] },
});
