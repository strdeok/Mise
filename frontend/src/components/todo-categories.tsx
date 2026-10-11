import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, SheetCard, Field, Label, palette, Sub, Title } from '@/components/mise-ui';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { font, radius, size, space } from '@/constants/layout';
import type { TodoCategory } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';

export function CategoryBadge({ category, selected = false }: { category: TodoCategory | undefined | null; selected?: boolean }) {
  if (!category) return null;
  return <View style={[styles.badge, selected && styles.badgeSelected]}><Text numberOfLines={1} style={[styles.badgeText, selected && styles.badgeTextSelected]}>{category.name}</Text></View>;
}

export function CategoryManagerSheet({ visible, close }: { visible: boolean; close: () => void }) {
  const categories = useMiseStore((state) => state.categories);
  const todos = useMiseStore((state) => state.todos);
  const saveCategory = useMiseStore((state) => state.saveCategory);
  const deleteCategory = useMiseStore((state) => state.deleteCategory);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) { setName(''); setEditingId(null); } }, [visible]);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const result = await saveCategory(name, editingId ?? undefined);
      if (result) {
        const wasEditing = !!editingId;
        setName(''); setEditingId(null);
        if (!wasEditing) close();
      }
    } finally { setSaving(false); }
  };
  const confirmDelete = (category: TodoCategory) => {
    const count = todos.filter((todo) => todo.categoryId === category.id).length;
    const message = `${count}개의 Todo에서 카테고리 배지가 제거됩니다. Todo는 삭제되지 않습니다.`;
    if (Platform.OS === 'web') {
      if (window.confirm(`${category.name} 카테고리를 삭제할까요?\n${message}`)) deleteCategory(category.id);
    } else Alert.alert('카테고리 삭제', message, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteCategory(category.id) },
    ]);
  };

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
    <SafeAreaSheet><SheetCard style={styles.sheet}>
      <View style={styles.heading}><Title>카테고리 관리</Title><Pressable onPress={close} accessibilityRole="button" accessibilityLabel="닫기" style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
      <Sub>Todo와 별개로 관리합니다. 카테고리 없이도 Todo를 만들 수 있어요.</Sub>
      <Label>{editingId ? '이름 변경' : '새 카테고리'}</Label>
      <Field value={name} onChangeText={setName} placeholder="예: 업무, 개인" />
      <View style={styles.actions}>
        {editingId && <Button label="취소" tone="quiet" onPress={() => { setEditingId(null); setName(''); }} />}
        <Button label={editingId ? '변경 저장' : '카테고리 등록'} disabled={!name.trim() || saving} onPress={save} />
      </View>
      <View style={styles.list}>
        {categories.length ? categories.slice().sort((a, b) => a.order - b.order).map((category) => <View key={category.id} style={styles.row}>
          <CategoryBadge category={category} />
          <View style={styles.rowActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${category.name} 이름 변경`} onPress={() => { setEditingId(category.id); setName(category.name); }} style={styles.rowButton}><Text style={styles.rowButtonText}>수정</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${category.name} 삭제`} onPress={() => confirmDelete(category)} style={styles.rowButton}><Text style={styles.rowButtonText}>삭제</Text></Pressable>
          </View>
        </View>) : <Sub>등록된 카테고리가 없습니다.</Sub>}
      </View>
    </SheetCard></SafeAreaSheet>
  </Modal>;
}

const styles = StyleSheet.create({
  sheet: { gap: space[3] },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 28, color: palette.ink, lineHeight: 32 },
  badge: { alignSelf: 'flex-start', maxWidth: 148, minHeight: 24, paddingHorizontal: space[2], borderRadius: radius.pill, borderWidth: 1, borderColor: palette.ink, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: palette.ink, fontSize: font.xs, fontWeight: '700' },
  badgeSelected: { backgroundColor: palette.ink },
  badgeTextSelected: { color: palette.card },
  actions: { flexDirection: 'row', gap: space[2] },
  list: { borderTopWidth: 1, borderColor: palette.line, paddingTop: space[2] },
  row: { minHeight: size.touchLarge, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2], borderBottomWidth: 1, borderColor: palette.line },
  rowActions: { flexDirection: 'row', gap: space[1] },
  rowButton: { minWidth: size.touch, minHeight: size.touch, alignItems: 'center', justifyContent: 'center' },
  rowButtonText: { color: palette.ink, fontSize: font.sm, fontWeight: '600' },
});
