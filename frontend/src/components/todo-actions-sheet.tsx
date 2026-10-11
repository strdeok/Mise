import { Chevron } from '@/components/chevron';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, SheetCard, palette, Sub, Title } from '@/components/mise-ui';
import { dateKey, descendants, todoPath } from '@/domain/logic';
import type { Todo } from '@/domain/types';
import { font, size, space } from '@/constants/layout';
import { useMiseStore } from '@/store/use-mise-store';

export type MenuAnchor = { x: number; y: number; width: number; height: number };

export function TodoMenuButton({ title, onOpen }: { title: string; onOpen: (anchor: MenuAnchor) => void }) {
  const button = useRef<View>(null);
  return <Pressable ref={button} accessibilityRole="button" accessibilityLabel={`${title} 메뉴`} style={styles.trigger} onPress={() => {
    button.current?.measureInWindow((x, y, width, height) => onOpen({ x, y, width, height }));
  }}><Text style={styles.triggerText}>···</Text></Pressable>;
}

type Props = {
  todo: Todo | null;
  anchor: MenuAnchor | null;
  context: 'today' | 'list';
  archived?: boolean;
  onClose: () => void;
  onEdit: (todo: Todo) => void;
  onOpen: (todo: Todo) => void;
};

export function TodoActionsSheet({ todo, anchor, context, archived = false, onClose, onEdit, onOpen }: Props) {
  const todos = useMiseStore((state) => state.todos);
  const toggleToday = useMiseStore((state) => state.toggleToday);
  const archiveTodo = useMiseStore((state) => state.archiveTodo);
  const reorderTodo = useMiseStore((state) => state.reorderTodo);
  const deleteTodo = useMiseStore((state) => state.deleteTodo);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reordering, setReordering] = useState(false);
  const close = () => { setConfirmingDelete(false); setReordering(false); onClose(); };
  const goBack = () => { if (confirmingDelete) setConfirmingDelete(false); else if (reordering) setReordering(false); else close(); };
  const act = (action: () => void | Promise<unknown>) => { close(); void action(); };
  const siblingIds = todo ? todos.filter((item) => item.parentId === todo.parentId && !item.archivedAt).sort((a, b) => a.order - b.order).map((item) => item.id) : [];
  const siblingIndex = todo ? siblingIds.indexOf(todo.id) : -1;
  const canMoveUp = siblingIndex > 0;
  const canMoveDown = siblingIndex >= 0 && siblingIndex < siblingIds.length - 1;
  const canAddChild = !!todo && !archived && todoPath(todo.id, todos).length < 3;
  const childCount = todo ? descendants(todo.id, todos).size - 1 : 0;
  const menuWidth = Math.min(256, width - 24);
  const rootItems = context === 'today' ? 3 : archived ? 2 : 3 + Number(canAddChild) + Number(canMoveUp || canMoveDown);
  const menuItems = reordering ? 1 + Number(canMoveUp) + Number(canMoveDown) : rootItems;
  const estimatedHeight = 48 + menuItems * size.touch + 8;
  const safeTop = Math.max(8, insets.top) + 8;
  const safeBottom = height - Math.max(8, insets.bottom) - size.tabBar - 8;
  const left = anchor ? Math.max(12, Math.min(anchor.x + anchor.width - menuWidth, width - menuWidth - 12)) : 12;
  const below = anchor ? anchor.y + anchor.height + 6 : safeTop;
  const openBelow = below + 48 + rootItems * size.touch + 8 <= safeBottom;
  const top = openBelow ? below : Math.max(safeTop, (anchor?.y ?? safeTop) - estimatedHeight - 6);

  return <Modal visible={!!todo && !!anchor} transparent statusBarTranslucent animationType="fade" onRequestClose={goBack}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="메뉴 닫기" onPress={close} style={StyleSheet.absoluteFill} />
      {confirmingDelete ? <View style={styles.confirmLayer} pointerEvents="box-none"><SheetCard style={[styles.confirmCard, { width: Math.min(360, width - 32) }]}>
        <Title>Todo 삭제</Title>
        <Sub>{childCount ? `하위 Todo ${childCount}개도 함께 삭제됩니다. ` : ''}완료 Focus 기록은 보존하지만 통계에서는 제외합니다.</Sub>
        <View style={styles.confirmActions}><Button label="돌아가기" tone="quiet" onPress={() => setConfirmingDelete(false)} /><Button label="삭제 확인" tone="danger" onPress={() => todo && act(() => deleteTodo(todo.id))} /></View>
      </SheetCard></View> : <View style={[styles.menu, { left, top, width: menuWidth }]}>
        <Text numberOfLines={1} style={styles.menuTitle}>{todo?.title}</Text>
        {todo && (reordering ? <>
          <Action label="‹ 메뉴로" onPress={() => setReordering(false)} />
          {canMoveUp && <Action label="위로 이동" onPress={() => act(() => reorderTodo(todo.id, -1))} />}
          {canMoveDown && <Action label="아래로 이동" onPress={() => act(() => reorderTodo(todo.id, 1))} />}
        </> : <>
          <Action label="수정" onPress={() => act(() => onEdit(todo))} />
          {context === 'today' ? <Action label="오늘에서 제외" onPress={() => act(() => toggleToday(todo.id, dateKey()))} /> : <>
            {canAddChild && <Action label="하위 Todo 추가" onPress={() => act(() => onOpen(todo))} />}
            {!archived && (canMoveUp || canMoveDown) && <Action label="순서 변경" onPress={() => setReordering(true)} />}
            <Action label={archived ? '복원' : '보관'} onPress={() => act(() => archiveTodo(todo.id, !archived))} />
          </>}
          {!archived && <Action label="삭제" destructive onPress={() => setConfirmingDelete(true)} />}
        </>)}
      </View>}
    </View>
  </Modal>;
}

function Action({ label, onPress, destructive = false }: { label: string; onPress: () => void; destructive?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}>
    <Text style={[styles.actionText, destructive && styles.destructive]}>{label}</Text>
    {!destructive && <Chevron />}
  </Pressable>;
}

const styles = StyleSheet.create({
  trigger: { minWidth: size.touch, minHeight: size.touch, alignItems: 'center', justifyContent: 'center' },
  triggerText: { color: palette.muted, fontSize: 18, paddingHorizontal: space[1] },
  overlay: { flex: 1, backgroundColor: '#0002' },
  menu: { position: 'absolute', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 20, paddingHorizontal: space[3], paddingBottom: space[1], shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  menuTitle: { minHeight: 44, paddingTop: space[3], paddingBottom: space[2], color: palette.muted, fontSize: font.sm, fontWeight: '700' },
  action: { minHeight: size.touch, borderTopWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: palette.ink, fontSize: font.md, fontWeight: '600' },
  destructive: { color: palette.red },
  chevron: { color: palette.muted, fontSize: 20 },
  confirmLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center' },
  confirmCard: { gap: space[3] },
  confirmActions: { flexDirection: 'row', gap: space[2], marginTop: space[2] },
});
