import { Chevron } from '@/components/chevron';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activeSession, dateKey, descendants, elapsedSeconds, formatClock, formatDuration, todoPath } from '@/domain/logic';
import { aggregateStats, monthPeriod, movePeriod, weekPeriod } from '@/domain/statistics';
import type { ScheduleBlock, Todo } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, Card, SheetCard, Field, Label, palette, Sub, Title } from '@/components/mise-ui';
import { BottomTabs, type Tab } from '@/components/bottom-tabs';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { TodoDetailSheet } from '@/components/todo-detail-sheet';
import { TodoActionsSheet, TodoMenuButton, type MenuAnchor } from '@/components/todo-actions-sheet';
import { CategoryBadge, CategoryManagerSheet } from '@/components/todo-categories';
import { ScheduleView } from '@/components/schedule-views';
import { StatsReview, TodayBriefing } from '@/components/mise-dashboard';
import { Calendar } from 'react-native-calendars';
import { font, pageGutter, size, space } from '@/constants/layout';
import { notificationPermission, notificationPermissionStatus, reconcileSessionNotifications } from '@/notifications/local-notifications';
import { motion } from '@/components/motion';

const day = (key: string, minute = 0) => { const value = new Date(`${key}T12:00:00`); value.setHours(Math.floor(minute / 60), minute % 60, 0, 0); return value; };
const minutes = (value: Date) => Math.floor(value.getHours() * 60 + value.getMinutes() / 5) * 5;
const changeDay = (key: string, amount: number) => { const value = day(key); value.setDate(value.getDate() + amount); return dateKey(value); };
const TIMELINE_START_MINUTE = 0;
const TIMELINE_HEIGHT = 24 * 60;

function TodoForm({ visible, close, editing, parentId, dateContext }: { visible: boolean; close: () => void; editing: Todo | null; parentId: string | null; dateContext: string | null }) {
  const todos = useMiseStore((s) => s.todos); const categories = useMiseStore((s) => s.categories); const add = useMiseStore((s) => s.addTodo); const update = useMiseStore((s) => s.updateTodo); const saveCategory = useMiseStore((s) => s.saveCategory); const [title, setTitle] = useState(''); const [estimatedMinutes, setEstimatedMinutes] = useState(''); const [selectedParent, setSelectedParent] = useState<string | null>(null); const [selectedCategory, setSelectedCategory] = useState<string | null>(null); const [selectedDates, setSelectedDates] = useState<string[]>([]); const [datePickerOpen, setDatePickerOpen] = useState(false); const [saving, setSaving] = useState(false); const [newCategory, setNewCategory] = useState(''); const [picker, setPicker] = useState<'parent' | 'category' | null>(null); const [search, setSearch] = useState(''); const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => { if (visible) { setTitle(editing?.title ?? ''); setEstimatedMinutes(editing?.estimatedMinutes ? String(editing.estimatedMinutes) : ''); setSelectedParent(editing?.parentId ?? parentId); setSelectedCategory(editing?.categoryId ?? null); setSelectedDates(editing?.todayDateKeys ?? [dateContext ?? dateKey()]); setDatePickerOpen(false); setSaving(false); setNewCategory(''); setPicker(null); setSearch(''); setDetailsOpen(!!editing || !!parentId); } }, [visible, editing, parentId, dateContext]);
  const invalidParents = editing ? descendants(editing.id, todos) : new Set<string>();
  const availableParents = todos.filter((todo) => !invalidParents.has(todo.id) && !todo.archivedAt && todoPath(todo.id, todos).length < 3);
  const matches = (value: string) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const openPicker = (kind: 'parent' | 'category') => { setSearch(''); setPicker(kind); };
  const createCategory = async () => { const result = await saveCategory(newCategory); if (result) { setSelectedCategory(result); setNewCategory(''); setPicker(null); } };
  const onBack = () => picker ? setPicker(null) : close();
  const selectedCategoryData = categories.find((category) => category.id === selectedCategory);
  const marks = Object.fromEntries(selectedDates.map((date) => [date, { selected: true, selectedColor: palette.ink } ]));
  const toggleDate = (key: string) => setSelectedDates((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key].sort());
  const submitTodo = async () => {
    if (saving) return;
    const trimmedMinutes = estimatedMinutes.trim();
    const parsedMinutes = trimmedMinutes ? Number(trimmedMinutes) : null;
    if (parsedMinutes !== null && (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 9999)) { useMiseStore.setState({ error: '예상 시간은 1분에서 9,999분 사이로 입력해 주세요.' }); return; }
    setSaving(true);
    try {
      const ok = editing
        ? await update(editing.id, { title, parentId: selectedParent, categoryId: selectedCategory, todayDateKeys: selectedDates, estimatedMinutes: parsedMinutes })
        : await add(title, selectedParent, true, selectedCategory, selectedDates, parsedMinutes);
      if (ok) close();
    } catch {
      useMiseStore.setState({ error: 'Todo를 저장하지 못했습니다. 다시 시도해 주세요.' });
    } finally { setSaving(false); }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onBack}><SafeAreaSheet><SheetCard style={s.modal}>
    {picker ? <>
      <View style={s.pickerHeader}><Pressable accessibilityRole="button" accessibilityLabel="선택 닫기" onPress={() => setPicker(null)} style={s.pickerBack}><Text style={s.pickerBackText}>‹</Text></Pressable><Title>{picker === 'parent' ? '상위 Todo 선택' : '카테고리 선택'}</Title></View>
      <Field value={search} onChangeText={setSearch} placeholder={picker === 'parent' ? 'Todo 검색' : '카테고리 검색'} />
      <Pressable accessibilityRole="button" accessibilityLabel="없음 선택" onPress={() => { picker === 'parent' ? setSelectedParent(null) : setSelectedCategory(null); setPicker(null); }} style={s.pickerRow}><Text style={s.pickerText}>없음</Text>{(picker === 'parent' ? !selectedParent : !selectedCategory) && <Text style={s.pickerCheck}>✓</Text>}</Pressable>
      {picker === 'parent' ? availableParents.filter((todo) => matches(todoPath(todo.id, todos).join(' / '))).map((todo) => <Pressable key={todo.id} accessibilityRole="button" accessibilityLabel={`${todo.title} 상위 Todo 선택`} onPress={() => { setSelectedParent(todo.id); setPicker(null); }} style={s.pickerRow}><Text numberOfLines={2} style={s.pickerText}>{todoPath(todo.id, todos).join(' / ')}</Text>{selectedParent === todo.id && <Text style={s.pickerCheck}>✓</Text>}</Pressable>) : categories.slice().sort((a, b) => a.order - b.order).filter((category) => matches(category.name)).map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`${category.name} 카테고리 선택`} onPress={() => { setSelectedCategory(category.id); setPicker(null); }} style={s.pickerRow}><CategoryBadge category={category} />{selectedCategory === category.id && <Text style={s.pickerCheck}>✓</Text>}</Pressable>)}
      {picker === 'parent' && !availableParents.some((todo) => matches(todoPath(todo.id, todos).join(' / '))) && <Sub>일치하는 Todo가 없습니다.</Sub>}
      {picker === 'category' && !categories.some((category) => matches(category.name)) && <Sub>일치하는 카테고리가 없습니다.</Sub>}
      {picker === 'category' && <View style={s.categoryCreate}><View style={s.flex}><Field value={newCategory} onChangeText={setNewCategory} placeholder="새 카테고리 이름" /></View><Button label="등록" tone="quiet" disabled={!newCategory.trim()} onPress={createCategory} /></View>}
    </> : <>
      <Label>{editing ? 'TODO 수정' : '빠른 추가'}</Label>
      <Title>{editing ? '할 일을 다듬어보세요' : '무엇을 해야 하나요?'}</Title>
      <Field value={title} onChangeText={setTitle} placeholder="예: 통계 화면 구현" />
      <View style={s.estimateField}><View style={s.dateHeading}><Label>예상 소요 시간 · 선택 사항</Label><Text style={s.dateSummary}>Timer 설정과 별개</Text></View><Field value={estimatedMinutes} onChangeText={setEstimatedMinutes} placeholder="예: 60 (분)" keyboardType="number-pad" /></View>
      {detailsOpen && <View style={s.dateField}><View style={s.dateHeading}><Label>할 일 표시 날짜</Label><Text style={s.dateSummary}>{selectedDates.length ? `${selectedDates.length}일 선택` : '날짜 미지정'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="할 일 날짜 선택 열기" onPress={() => setDatePickerOpen((open) => !open)} style={s.dateToggle}><Text style={s.quickDetailText}>{datePickerOpen ? '달력 닫기' : '날짜 선택'}</Text><Text style={s.selectionChevron}>{datePickerOpen ? '−' : '+'}</Text></Pressable>{selectedDates.length > 0 && <View style={s.dateChips}>{selectedDates.map((date) => <Pressable key={date} onPress={() => toggleDate(date)} style={s.dateChip}><Text style={s.dateChipText}>{new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })} ×</Text></Pressable>)}</View>}{datePickerOpen && <Calendar current={selectedDates[0] ?? dateKey()} onDayPress={(value) => toggleDate(value.dateString)} markedDates={marks} theme={{ calendarBackground: palette.card, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '700', textDayFontWeight: '600', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#BDBDBD', selectedDayBackgroundColor: palette.ink, selectedDayTextColor: '#fff' }} />}</View>}
      {!detailsOpen && <Pressable accessibilityRole="button" accessibilityLabel="세부 정보 열기" onPress={() => setDetailsOpen(true)} style={s.quickDetail}><Text style={s.quickDetailText}>{selectedDates.includes(dateKey()) ? '오늘' : selectedDates.length ? `${selectedDates.length}일 선택` : '날짜 미지정'} · 날짜와 세부 정보</Text><Text style={s.selectionChevron}>+</Text></Pressable>}
      {detailsOpen && <><Label>상위 Todo</Label>
      <Pressable accessibilityRole="button" accessibilityLabel="상위 Todo 선택" onPress={() => openPicker('parent')} style={s.selectionRow}><Text numberOfLines={1} style={s.selectionValue}>{selectedParent ? todoPath(selectedParent, todos).join(' / ') : '없음'}</Text><Chevron /></Pressable>
      <Label>카테고리 · 선택 사항</Label>
      <Pressable accessibilityRole="button" accessibilityLabel="카테고리 선택" onPress={() => openPicker('category')} style={s.selectionRow}><View style={s.flex}>{selectedCategoryData ? <CategoryBadge category={selectedCategoryData} /> : <Text style={[s.selectionValue, { flex: 0 }]}>없음</Text>}</View><Chevron /></Pressable></>}
      <View style={s.row}><Button label="취소" tone="quiet" onPress={close} /><View style={s.saveButton}><Button label={saving ? '저장 중…' : 'Todo 저장'} disabled={!title.trim() || saving} onPress={submitTodo} /></View></View>
    </>}
  </SheetCard></SafeAreaSheet></Modal>;
}

function BlockForm({ visible, close, selectedDate, editing, initialStartMinute }: { visible: boolean; close: () => void; selectedDate: string; editing: ScheduleBlock | null; initialStartMinute: number | null }) {
  const save = useMiseStore((s) => s.saveBlock); const todos = useMiseStore((s) => s.todos); const [title, setTitle] = useState(''); const [start, setStart] = useState(540); const [end, setEnd] = useState(600); const [todoId, setTodoId] = useState<string | null>(null); const [picker, setPicker] = useState<'start' | 'end' | null>(null); const availableTodos = todos.filter((todo) => !todo.archivedAt);
  useEffect(() => { if (visible) { const initialStart = editing?.startMinute ?? initialStartMinute ?? 540; setTitle(editing?.title ?? ''); setStart(initialStart); setEnd(editing?.endMinute ?? Math.min(1440, initialStart + 60)); setTodoId(editing?.todoId ?? null); setPicker(null); } }, [visible, editing, initialStartMinute]);
  const pick = (kind: 'start' | 'end', value?: Date) => { if (Platform.OS === 'android') setPicker(null); if (value) kind === 'start' ? setStart(minutes(value)) : setEnd(minutes(value)); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><SafeAreaSheet><SheetCard style={s.modal}><Title>{editing ? 'Schedule 수정' : '새 Schedule'}</Title><Field value={title} onChangeText={setTitle} placeholder="일정 제목" /><Label>시작 / 종료</Label><View style={s.row}><Pressable style={s.timeButton} onPress={() => setPicker('start')}><Text style={s.timeButtonText}>{formatClock(start)}</Text></Pressable><Pressable style={s.timeButton} onPress={() => setPicker('end')}><Text style={s.timeButtonText}>{formatClock(end)}</Text></Pressable></View>{picker && <DateTimePicker value={day(selectedDate, picker === 'start' ? start : end)} mode="time" minuteInterval={5} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, value) => pick(picker, value)} />}{picker && Platform.OS === 'ios' && <Button label="시간 선택 완료" tone="quiet" onPress={() => setPicker(null)} />}<Label>Todo 연결</Label><ScrollView horizontal contentContainerStyle={s.chips}>{availableTodos.map((todo) => <Pressable key={todo.id} onPress={() => setTodoId(todo.id === todoId ? null : todo.id)} style={[s.chip, todoId === todo.id && s.chipOn]}><Text style={todoId === todo.id ? s.chipTextOn : s.chipText}>{todo.title}</Text></Pressable>)}</ScrollView><View style={s.row}><Button label="취소" tone="quiet" onPress={close} /><Button label="저장" onPress={async () => { const ok = await save({ id: editing?.id, dateKey: selectedDate, startMinute: start, endMinute: end, title, todoId }); if (ok) close(); }} /></View></SheetCard></SafeAreaSheet></Modal>;
}

function Today({ addTodo, openTodo, editTodo, openTimer }: { addTodo: () => void; openTodo: (todo: Todo) => void; editTodo: (todo: Todo, dateContext?: string) => void; openTimer: (todo?: Todo, block?: ScheduleBlock) => void }) {
  const todos = useMiseStore((state) => state.todos);
  const [menuTodoId, setMenuTodoId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  return <><TodayBriefing onAddTodo={addTodo} onOpenTodo={openTodo} onOpenTimer={openTimer} onMenu={(todo, anchor) => { setMenuTodoId(todo.id); setMenuAnchor(anchor); }} /><TodoActionsSheet todo={todos.find((todo) => todo.id === menuTodoId) ?? null} anchor={menuAnchor} context="today" onClose={() => { setMenuTodoId(null); setMenuAnchor(null); }} onEdit={(todo) => editTodo(todo, dateKey())} onOpen={openTodo} /></>;
}

function TodoList({ addTodo, editTodo, openTodo, openTimer, manageCategories }: { addTodo: (parentId?: string | null) => void; editTodo: (todo: Todo) => void; openTodo: (todo: Todo) => void; openTimer: (todo: Todo) => void; manageCategories: () => void }) {
  const todos = useMiseStore((x) => x.todos); const categories = useMiseStore((x) => x.categories); const toggle = useMiseStore((x) => x.toggleTodo); const [archived, setArchived] = useState(false); const [query, setQuery] = useState(''); const [categoryFilter, setCategoryFilter] = useState<string | null>(null); const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set()); const [menuTodoId, setMenuTodoId] = useState<string | null>(null); const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  useEffect(() => { if (categoryFilter && categoryFilter !== 'none' && !categories.some((category) => category.id === categoryFilter)) setCategoryFilter(null); }, [categories, categoryFilter]);
  const base = todos.filter((todo) => archived ? !!todo.archivedAt : !todo.archivedAt); const normalizedQuery = query.trim().toLocaleLowerCase(); const visibleIds = new Set(base.filter((todo) => (!normalizedQuery || todo.title.toLocaleLowerCase().includes(normalizedQuery)) && (!categoryFilter || (categoryFilter === 'none' ? !todo.categoryId : todo.categoryId === categoryFilter))).map((todo) => todo.id));
  if (normalizedQuery || categoryFilter) { let changed = true; while (changed) { changed = false; base.forEach((todo) => { if (visibleIds.has(todo.id) && todo.parentId && !visibleIds.has(todo.parentId)) { visibleIds.add(todo.parentId); changed = true; } }); } }
  const visible = base.filter((todo) => visibleIds.has(todo.id)); const roots = visible.filter((todo) => !todo.parentId).sort((a,b) => a.order - b.order);
  const toggleCollapsed = (id: string) => setCollapsedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const rows = (parentId: string | null, level = 0): ReactNode[] => visible.filter((todo) => todo.parentId === parentId).sort((a,b) => a.order - b.order).flatMap((todo) => {
    const childCount = visible.filter((item) => item.parentId === todo.id).length;
    const collapsed = !normalizedQuery && !categoryFilter && collapsedIds.has(todo.id);
    return [<Animated.View key={todo.id} entering={level ? FadeIn.duration(150).reduceMotion(ReduceMotion.System) : undefined} exiting={level ? FadeOut.duration(110).reduceMotion(ReduceMotion.System) : undefined} layout={LinearTransition.duration(motion.treeMs).reduceMotion(ReduceMotion.System)} style={[s.todoTreeRow, { marginLeft: level * 16 }]}>
      {childCount ? <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} ${collapsed ? '펼치기' : '접기'}`} accessibilityState={{ expanded: !collapsed }} onPress={() => toggleCollapsed(todo.id)} style={s.treeToggle}><Chevron direction={collapsed ? 'right' : 'down'} color={palette.ink} /></Pressable> : <View style={s.treeToggle} />}
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.status === 'completed' }} accessibilityLabel={`${todo.title} 완료 전환`} onPress={() => toggle(todo.id)} style={[s.check, todo.status === 'completed' && s.checked]}>{todo.status === 'completed' && <Text style={{ color:'#fff' }}>✓</Text>}</Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} 상세 보기`} style={s.flex} onPress={() => openTodo(todo)}><Text style={[s.todoTitle, todo.status === 'completed' && s.done]}>{todo.title}</Text><View style={s.todoMeta}><Sub>{level === 0 ? '프로젝트' : `${level}단계 Todo`}{childCount ? ` · 하위 ${childCount}` : ''}{todo.estimatedMinutes ? ` · 예상 ${formatDuration(todo.estimatedMinutes * 60)}` : ''}</Sub><CategoryBadge category={categories.find((category) => category.id === todo.categoryId)} /></View></Pressable>
      <TodoMenuButton title={todo.title} onOpen={(anchor) => { setMenuAnchor(anchor); setMenuTodoId(todo.id); }} />
    </Animated.View>, ...(!collapsed ? rows(todo.id, level + 1) : [])];
  });
  return <><ScrollView contentContainerStyle={s.content}><View style={s.head}><View><Label>MISE EN PLACE</Label><Title>전체 Todo</Title></View><View style={s.row}><Button label="카테고리" tone="quiet" onPress={manageCategories} /><Button label="+ 추가" onPress={() => addTodo(null)} /></View></View><Field value={query} onChangeText={setQuery} placeholder="Todo 검색" /><View style={s.period}><Button label="진행 중" tone={!archived ? 'primary' : 'quiet'} onPress={() => setArchived(false)} /><Button label="보관함" tone={archived ? 'primary' : 'quiet'} onPress={() => setArchived(true)} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryFilters} keyboardShouldPersistTaps="handled"><Pressable onPress={() => setCategoryFilter(null)} style={[s.filterChip, !categoryFilter && s.filterChipOn]}><Text style={!categoryFilter ? s.filterTextOn : s.filterText}>전체</Text></Pressable><Pressable onPress={() => setCategoryFilter('none')} style={[s.filterChip, categoryFilter === 'none' && s.filterChipOn]}><Text style={categoryFilter === 'none' ? s.filterTextOn : s.filterText}>미분류</Text></Pressable>{categories.slice().sort((a, b) => a.order - b.order).map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`${category.name} 카테고리 필터`} onPress={() => setCategoryFilter(category.id)} style={s.categoryOption}><CategoryBadge category={category} selected={categoryFilter === category.id} /></Pressable>)}</ScrollView>{roots.length ? rows(null) : <Card><Sub>{query || categoryFilter ? '조건에 맞는 Todo가 없습니다.' : archived ? '보관한 Todo가 없습니다.' : '새 Todo를 추가해 보세요.'}</Sub></Card>}</ScrollView><TodoActionsSheet todo={todos.find((todo) => todo.id === menuTodoId) ?? null} anchor={menuAnchor} context="list" archived={archived} onClose={() => { setMenuTodoId(null); setMenuAnchor(null); }} onEdit={editTodo} onOpen={openTodo} /></>;
}

function TimetableBlock({ block, index, todoTitle, onEdit, onFocus, onDelete }: { block: ScheduleBlock; index: number; todoTitle: string; onEdit: () => void; onFocus: () => void; onDelete: () => void }) {
  const saveBlock = useMiseStore((x) => x.saveBlock); const [dragging, setDragging] = useState(false); const [deltaY, setDeltaY] = useState(0); const deltaRef = useRef(0); const latestBlock = useRef(block); latestBlock.current = block;
  const duration = block.endMinute - block.startMinute; const baseStart = block.startMinute;
  const proposedStart = Math.max(TIMELINE_START_MINUTE, Math.min(1440 - duration, Math.round((baseStart + deltaY) / 5) * 5));
  const baseTop = Math.max(0, baseStart - TIMELINE_START_MINUTE); const previewTop = Math.max(0, proposedStart - TIMELINE_START_MINUTE); const blockHeight = Math.max(32, duration - 2); const dark = index % 2 === 0;
  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gesture) => { deltaRef.current = gesture.dy; setDeltaY(gesture.dy); },
    onPanResponderRelease: async () => { const current = latestBlock.current; const currentDuration = current.endMinute - current.startMinute; const start = Math.max(TIMELINE_START_MINUTE, Math.min(1440 - currentDuration, Math.round((current.startMinute + deltaRef.current) / 5) * 5)); setDragging(false); setDeltaY(0); deltaRef.current = 0; if (start === current.startMinute) return; await saveBlock({ id: current.id, dateKey: current.dateKey, startMinute: start, endMinute: start + currentDuration, title: current.title, todoId: current.todoId }); },
    onPanResponderTerminate: () => { setDragging(false); setDeltaY(0); deltaRef.current = 0; },
  })).current;
  return <>{dragging && <View pointerEvents="none" style={[s.dropPreview, { top: previewTop, height: blockHeight }]}><Text style={s.dropPreviewText}>{formatClock(proposedStart)}에 놓기</Text></View>}<View {...responder.panHandlers} style={[s.timetableBlock, { top: baseTop, height: blockHeight, backgroundColor: dark ? '#111111' : '#E6E6E6', opacity: dragging ? 0.35 : 1, transform: [{ translateY: dragging ? deltaY : 0 }] }]}><View style={s.blockBody}><Text numberOfLines={1} style={[s.timetableTitle, dark && s.timetableTitleDark]}>{block.title}</Text><Text numberOfLines={1} style={[s.timetableMeta, dark && s.timetableTitleDark]}>{formatClock(block.startMinute)}–{formatClock(block.endMinute)} · {todoTitle}</Text></View><View style={s.blockActions}><Pressable onPress={onEdit}><Text style={[s.blockActionText, dark && s.timetableTitleDark]}>수정</Text></Pressable><Pressable onPress={onFocus}><Text style={[s.blockActionText, dark && s.timetableTitleDark]}>집중</Text></Pressable><Pressable onPress={onDelete}><Text style={[s.blockActionText, dark && s.timetableTitleDark]}>삭제</Text></Pressable></View></View></>;
}

function Schedule({ addBlock }: { addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void }) {
  const blocks = useMiseStore((x) => x.blocks); const todos = useMiseStore((x) => x.todos); const remove = useMiseStore((x) => x.deleteBlock); const start = useMiseStore((x) => x.prepareSession); const [picker, setPicker] = useState<string | null>(null); const [selectedDate, setSelectedDate] = useState(dateKey());
  const list = blocks.filter((block) => block.dateKey === selectedDate && !block.deletedAt).sort((a,b) => a.startMinute - b.startMinute);
  const beginFocus = (block: ScheduleBlock) => block.todoId ? start('focus', block.todoId, block.id).then((id) => id && router.push('/timer')) : setPicker(block.id);
  const createAt = (positionY: number) => addBlock(selectedDate, undefined, Math.max(0, Math.min(1380, Math.round((positionY + TIMELINE_START_MINUTE) / 5) * 5)));
  const availableTodos = todos.filter((todo) => !todo.archivedAt);
  return <View style={s.schedulePage}><View style={s.scheduleHeader}><View style={s.dateNav}><Pressable onPress={() => setSelectedDate(changeDay(selectedDate, -1))}><Text style={s.nav}>‹</Text></Pressable><View style={{alignItems:'center'}}><Label>{selectedDate === dateKey() ? 'TODAY' : selectedDate}</Label><Title>하루 시간표</Title></View><Pressable onPress={() => setSelectedDate(changeDay(selectedDate, 1))}><Text style={s.nav}>›</Text></Pressable></View><View style={s.scheduleTools}><Sub>빈 칸을 누르면 그 시간에 일정을 추가합니다.</Sub><View style={s.row}><Pressable onPress={() => setSelectedDate(dateKey())}><Text style={s.action}>오늘</Text></Pressable><Button label="+ 일정" onPress={() => addBlock(selectedDate)} /></View></View></View><ScrollView contentContainerStyle={s.timelineScroll}><View style={[s.timeline, { height: TIMELINE_HEIGHT }]}>{Array.from({ length: 25 }, (_, index) => <View key={index} style={[s.hourLine, { top: index * 60 }]}><Text style={s.hourLabel}>{String(index).padStart(2, '0')}:00</Text><View style={s.hourRule} /></View>)}<Pressable style={s.timelineTap} onPress={(event) => createAt(event.nativeEvent.locationY)} />{list.map((block, index) => <TimetableBlock key={block.id} block={block} index={index} todoTitle={block.todoId ? todos.find((todo) => todo.id === block.todoId)?.title ?? '삭제된 Todo' : 'Todo 선택'} onEdit={() => addBlock(selectedDate, block)} onFocus={() => beginFocus(block)} onDelete={() => Alert.alert('일정 삭제', '삭제해도 연결된 완료 Focus 기록은 유지됩니다.', [{ text:'취소', style:'cancel' }, { text:'삭제', style:'destructive', onPress:() => remove(block.id) }])} />)}</View></ScrollView><Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><SafeAreaSheet><SheetCard style={s.modal}><Title>Todo 선택</Title>{availableTodos.map((todo) => <Button key={todo.id} label={todo.title} tone="quiet" onPress={() => picker && start('focus', todo.id, picker).then((id) => { setPicker(null); if (id) router.push('/timer'); })} />)}{!availableTodos.length && <Sub>먼저 Todo를 추가해 주세요.</Sub>}<Button label="취소" tone="quiet" onPress={() => setPicker(null)} /></SheetCard></SafeAreaSheet></Modal></View>;
}

function Stats() {
  return <StatsReview />;
}

function SettingsRow({ label, detail, children }: { label: string; detail?: string; children?: ReactNode }) {
  return <View style={s.settingsRow}><View style={s.settingsCopy}><Text style={s.settingsLabel}>{label}</Text>{detail && <Text style={s.settingsDetail}>{detail}</Text>}</View>{children}</View>;
}

function Settings() {
  const settings = useMiseStore((x) => x.settings); const update = useMiseStore((x) => x.updateSettings); const reset = useMiseStore((x) => x.reset); const [permission, setPermission] = useState('미결정');
  useEffect(() => { notificationPermissionStatus().then((status) => setPermission(status)).catch(() => undefined); }, []);
  const permissionLabel = permission === 'granted' ? '허용' : permission === 'denied' ? '거부' : '미결정';
  return <ScrollView contentContainerStyle={s.content}><Label>LOCAL PROTOTYPE</Label><Title>설정</Title>
    <View style={s.settingsSection}><Label>타이머</Label><SettingsRow label="포모도로 시간" detail="집중·휴식 시간과 긴 휴식 주기"><Text style={s.settingsLink}>타이머에서 설정 ›</Text></SettingsRow></View>
    <View style={s.settingsSection}><Label>표시 및 알림</Label><SettingsRow label="카운트다운" detail="남은 시간을 먼저 표시"><Switch value={settings.timerMode === 'countdown'} onValueChange={(value) => update({ timerMode: value ? 'countdown' : 'elapsed' })} /></SettingsRow><SettingsRow label="Focus 종료 알림"><Switch value={settings.focusNotificationEnabled} onValueChange={(value) => update({ focusNotificationEnabled: value })} /></SettingsRow><SettingsRow label="Break 종료 알림"><Switch value={settings.breakNotificationEnabled} onValueChange={(value) => update({ breakNotificationEnabled: value })} /></SettingsRow><SettingsRow label="알림 권한" detail={permissionLabel}><Pressable onPress={async () => setPermission(await notificationPermission())} style={s.settingsTextAction}><Text style={s.settingsTextActionLabel}>요청</Text></Pressable></SettingsRow></View>
    <View style={s.settingsSection}><Label>계정</Label><SettingsRow label="Mock 사용자" detail="OAuth 연결은 서버 단계에서 추가됩니다."><Chevron /></SettingsRow></View>
    <Pressable accessibilityRole="button" accessibilityLabel="샘플 데이터 초기화" onPress={() => Alert.alert('초기화', '이 기기의 데이터를 초기화할까요?', [{ text:'취소', style:'cancel' }, { text:'초기화', style:'destructive', onPress: reset }])} style={s.resetAction}><Text style={s.resetActionText}>샘플 데이터 초기화</Text></Pressable>
  </ScrollView>;
}

export default function Home() {
  const hydrate = useMiseStore((x) => x.hydrate); const hydrated = useMiseStore((x) => x.hydrated); const sessions = useMiseStore((x) => x.sessions); const settings = useMiseStore((x) => x.settings); const prepareSession = useMiseStore((x) => x.prepareSession); const error = useMiseStore((x) => x.error); const [tab, setTab] = useState<Tab>('today'); const [todoForm, setTodoForm] = useState<{ editing: Todo | null; parentId: string | null; dateContext?: string | null } | null>(null); const [todoDetailId, setTodoDetailId] = useState<string | null>(null); const [categoryManagerVisible, setCategoryManagerVisible] = useState(false); const [blockForm, setBlockForm] = useState<{ date: string; block: ScheduleBlock | null; startMinute: number | null } | null>(null); const [now, setNow] = useState(Date.now());
  useEffect(() => { hydrate(); }, [hydrate]); useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []); useEffect(() => { if (hydrated) reconcileSessionNotifications(sessions, settings).catch(() => undefined); }, [hydrated]); if (!hydrated) return <SafeAreaView style={s.center}><Text>데이터를 준비하고 있어요…</Text></SafeAreaView>;
  const openTodo = (todo: Todo) => setTodoDetailId(todo.id);
  const editTodo = (editing: Todo, dateContext: string | null = null) => { setTodoDetailId(null); setTodoForm({ editing, parentId: editing.parentId, dateContext }); };
  const openTimer = async (todo?: Todo, block?: ScheduleBlock) => {
    const currentSession = activeSession(useMiseStore.getState().sessions);
    if (!currentSession && todo) {
      const sessionId = await prepareSession('focus', todo.id, block?.todoId === todo.id ? block.id : undefined);
      if (!sessionId) return;
    }
    router.navigate('/timer');
  };
  const openTodoTimer = (todo: Todo) => { void openTimer(todo); };
  const current = activeSession(sessions);
  return <SafeAreaView style={s.safe}>
    <View style={s.app}>
      <Animated.View key={tab} entering={FadeIn.duration(motion.tabEnterMs).reduceMotion(ReduceMotion.System)} style={s.flex}>
        {tab === 'today' && <Today addTodo={() => setTodoForm({ editing:null, parentId:null, dateContext: dateKey() })} openTodo={openTodo} editTodo={editTodo} openTimer={(todo, block) => { void openTimer(todo, block); }} />}
        {tab === 'todos' && <TodoList addTodo={(parentId = null) => setTodoForm({ editing:null, parentId, dateContext: dateKey() })} editTodo={editTodo} openTodo={openTodo} openTimer={openTodoTimer} manageCategories={() => setCategoryManagerVisible(true)} />}
        {tab === 'schedule' && <ScheduleView addBlock={(date, block, startMinute) => setBlockForm({ date, block: block ?? null, startMinute: startMinute ?? null })} onOpenTimer={() => router.navigate('/timer')} />}
        {tab === 'stats' && <Stats />}
        {tab === 'settings' && <Settings />}
      </Animated.View>
      {current && <Pressable accessibilityRole="button" accessibilityLabel="타이머 열기" onPress={() => router.navigate('/timer')} style={s.mini}><Text style={s.miniText}>{current.status === 'ready' ? (current.type === 'focus' ? '집중 시작 전' : '휴식 시작 전') : `${current.type === 'focus' ? '집중 중' : '휴식 중'} · ${formatDuration(elapsedSeconds(current, now))}`}</Text><Text style={{color:'#fff'}}>타이머 열기 ›</Text></Pressable>}
      <BottomTabs value={tab} onChange={setTab} />
    </View>
    <TodoDetailSheet todoId={todoDetailId} onSelect={setTodoDetailId} onEdit={editTodo} onClose={() => setTodoDetailId(null)} />
    <CategoryManagerSheet visible={categoryManagerVisible} close={() => setCategoryManagerVisible(false)} />
    <TodoForm visible={!!todoForm} close={() => setTodoForm(null)} editing={todoForm?.editing ?? null} parentId={todoForm?.parentId ?? null} dateContext={todoForm?.dateContext ?? null} />
    <BlockForm visible={!!blockForm} close={() => setBlockForm(null)} selectedDate={blockForm?.date ?? dateKey()} editing={blockForm?.block ?? null} initialStartMinute={blockForm?.startMinute ?? null} />
    {error && <Pressable onPress={() => useMiseStore.setState({ error:null })} style={s.toast}><Text style={{color:'#fff'}}>{error}</Text></Pressable>}
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe:{flex:1,backgroundColor:palette.bg},app:{flex:1},content:{paddingHorizontal:pageGutter(),paddingTop:space[4],paddingBottom:128,gap:space[4]},settingsSection:{gap:space[1]},settingsRow:{minHeight:70,borderBottomWidth:1,borderColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:space[3]},settingsCopy:{flex:1,gap:3},settingsLabel:{fontSize:font.md,fontWeight:'700',color:palette.ink},settingsDetail:{fontSize:font.xs,color:palette.muted,fontWeight:'500'},settingsLink:{fontSize:font.xs,color:palette.muted,fontWeight:'700'},settingsTextAction:{minWidth:size.touch,minHeight:size.touch,alignItems:'center',justifyContent:'center'},settingsTextActionLabel:{fontSize:font.sm,fontWeight:'700',color:palette.ink},resetAction:{minHeight:size.touchLarge,borderRadius:12,borderWidth:1,borderColor:'#F4D9D5',backgroundColor:palette.redSoft,alignItems:'center',justifyContent:'center'},resetActionText:{color:palette.red,fontSize:font.md,fontWeight:'700'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.bg},head:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},row:{flexDirection:'row',gap:space[2],alignItems:'center'},flex:{flex:1},big:{fontSize:font.display,fontWeight:'600',color:palette.ink},muted:{color:palette.muted,fontSize:font.lg},todo:{flexDirection:'row',alignItems:'center'},todoTreeRow:{flexDirection:'row',alignItems:'center',paddingVertical:space[3],paddingHorizontal:space[2],borderBottomWidth:1,borderColor:palette.line,gap:space[2]},todoControls:{flexDirection:'row',gap:space[2],alignItems:'center'},check:{width:23,height:23,borderRadius:5,borderWidth:1.5,borderColor:palette.ink,alignItems:'center',justifyContent:'center',marginRight:space[2]},checked:{backgroundColor:palette.green},todoTitle:{color:palette.ink,fontWeight:'600',fontSize:font.md},done:{textDecorationLine:'line-through',color:palette.muted},action:{color:palette.green,fontWeight:'800'},menu:{color:palette.muted,fontSize:18,paddingHorizontal:space[1]},time:{color:palette.green,fontWeight:'800'},delete:{color:palette.red,fontWeight:'700'},modal:{gap:space[3]},chips:{gap:space[2]},chip:{paddingHorizontal:space[3],paddingVertical:9,borderRadius:99,backgroundColor:palette.greenSoft},chipOn:{backgroundColor:palette.green},chipText:{color:palette.green,fontWeight:'700'},chipTextOn:{color:'#fff',fontWeight:'700'},timeButton:{flex:1,padding:13,borderRadius:12,borderWidth:1,borderColor:palette.line,backgroundColor:'#fff'},timeButtonText:{textAlign:'center',fontSize:18,fontWeight:'800',color:palette.ink},grid:{flexDirection:'row',gap:space[3]},stat:{fontSize:20,fontWeight:'600',color:palette.ink},setting:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',minHeight:size.touch},step:{fontSize:25,fontWeight:'700',color:palette.green,paddingHorizontal:space[2]},minute:{minWidth:48,textAlign:'center',fontWeight:'700'},mini:{marginHorizontal:pageGutter(),marginBottom:space[2],backgroundColor:palette.ink,borderRadius:8,padding:space[3],flexDirection:'row',justifyContent:'space-between'},miniText:{color:'#fff',fontWeight:'800'},toast:{position:'absolute',bottom:size.bottomFloat,left:pageGutter(),right:pageGutter(),padding:space[3],borderRadius:12,backgroundColor:palette.red},dateNav:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},nav:{fontSize:36,fontWeight:'400',color:palette.green,paddingHorizontal:space[3]},period:{flexDirection:'row',gap:space[2]},schedulePage:{flex:1},scheduleHeader:{padding:20,paddingBottom:8,gap:8},scheduleTools:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},timelineScroll:{paddingBottom:130},timeline:{marginLeft:58,marginRight:16,position:'relative',borderLeftWidth:1,borderColor:palette.line},hourLine:{position:'absolute',left:0,right:0,height:1,flexDirection:'row'},hourLabel:{position:'absolute',right:'100%',width:53,textAlign:'right',paddingRight:10,top:-8,fontSize:11,fontWeight:'700',color:palette.muted},hourRule:{height:1,backgroundColor:palette.line,flex:1},timelineTap:{position:'absolute',left:0,right:0,top:0,bottom:0},timetableBlock:{position:'absolute',left:6,right:7,borderRadius:7,paddingHorizontal:9,paddingVertical:7,overflow:'hidden',zIndex:2},blockBody:{flex:1},timetableTitle:{fontSize:13,fontWeight:'800',color:palette.ink},timetableMeta:{fontSize:10,color:palette.muted,marginTop:2},timetableTitleDark:{color:'#fff'},blockActions:{flexDirection:'row',gap:12,justifyContent:'flex-end'},blockActionText:{fontSize:10,fontWeight:'800',color:palette.ink},dropPreview:{position:'absolute',left:6,right:7,borderRadius:7,borderWidth:2,borderStyle:'dashed',borderColor:'#777',backgroundColor:'#D8D8D8',paddingHorizontal:9,paddingVertical:7,zIndex:1,justifyContent:'center'},dropPreviewText:{color:'#444',fontSize:11,fontWeight:'800'},
  todayIntro:{gap:space[1],paddingBottom:space[1]},
  todayHeading:{fontSize:32,fontWeight:'600',letterSpacing:-1,color:palette.ink},
  focusPanel:{backgroundColor:palette.card,borderWidth:1,borderColor:palette.line,borderRadius:8,padding:space[4],gap:space[1]},
  focusNumber:{fontSize:36,fontWeight:'500',letterSpacing:-1.5,color:palette.ink,fontVariant:['tabular-nums'],marginVertical:space[2]},
  focusDivider:{height:1,backgroundColor:palette.line,marginVertical:space[2]},
  nextLabel:{fontSize:font.xs,fontWeight:'600',color:palette.muted,letterSpacing:.4},
  nextValue:{fontSize:font.md,fontWeight:'500',color:palette.ink,marginTop:space[1]},
  sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:space[2]},
  sectionTitle:{fontSize:font.lg,fontWeight:'600',color:palette.ink},
  count:{fontSize:font.sm,fontWeight:'500',color:palette.muted},
  textAction:{minHeight:size.touch,justifyContent:'center',paddingHorizontal:space[2]},
  textActionLabel:{fontSize:font.md,fontWeight:'600',color:palette.ink},
  flatList:{borderTopWidth:1,borderColor:palette.line},
  flatTodoRow:{minHeight:66,flexDirection:'row',alignItems:'center',paddingVertical:space[2],borderBottomWidth:1,borderColor:palette.line,gap:space[1]},
  focusAction:{minHeight:size.touch,justifyContent:'center',paddingHorizontal:space[1]},
  focusActionText:{fontSize:font.sm,fontWeight:'600',color:palette.ink},
  emptyLine:{color:palette.muted,fontSize:font.md,paddingVertical:space[6]},
  treeToggle:{width:30,height:size.touch,flexShrink:0,alignItems:'center',justifyContent:'center'},
  todoMeta:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:space[1],marginTop:space[1]},
  categoryCreate:{flexDirection:'row',alignItems:'center',gap:space[2]},
  selectionRow:{minHeight:size.touchLarge,borderWidth:1,borderColor:palette.line,borderRadius:8,paddingHorizontal:space[3],flexDirection:'row',alignItems:'center',gap:space[2]},quickDetail:{minHeight:size.touch,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderBottomWidth:1,borderColor:palette.line},quickDetailText:{fontSize:font.sm,fontWeight:'700',color:palette.muted},
  selectionValue:{flex:1,minWidth:0,color:palette.ink,fontSize:font.md,fontWeight:'600'},
  selectionChevron:{width:32,flexShrink:0,textAlign:'center',color:palette.muted,fontSize:24,lineHeight:28},estimateField:{gap:space[1]},
  dateField:{borderTopWidth:1,borderBottomWidth:1,borderColor:palette.line,paddingVertical:space[2],gap:space[2]},dateHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dateSummary:{color:palette.muted,fontSize:font.xs,fontWeight:'600'},dateToggle:{minHeight:size.touch,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dateChips:{flexDirection:'row',flexWrap:'wrap',gap:space[1]},dateChip:{minHeight:30,paddingHorizontal:space[2],justifyContent:'center',borderRadius:99,backgroundColor:palette.greenSoft},dateChipText:{color:palette.ink,fontSize:font.xs,fontWeight:'700'},saveButton:{flex:1},
  pickerHeader:{flexDirection:'row',alignItems:'center',gap:space[2]},
  pickerBack:{width:size.touch,height:size.touch,alignItems:'center',justifyContent:'center'},
  pickerBackText:{color:palette.ink,fontSize:30,lineHeight:34},
  pickerRow:{minHeight:size.touchLarge,borderBottomWidth:1,borderColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:space[2],paddingVertical:space[2]},
  pickerText:{flex:1,color:palette.ink,fontSize:font.md,fontWeight:'600'},
  pickerCheck:{color:palette.ink,fontSize:font.lg,fontWeight:'700'},
  categoryOption:{minHeight:size.touch,justifyContent:'center'},
  categoryFilters:{alignItems:'center',gap:space[2]},
  filterChip:{minHeight:size.touch,paddingHorizontal:space[3],borderRadius:99,borderWidth:1,borderColor:palette.line,justifyContent:'center'},
  filterChipOn:{backgroundColor:palette.ink,borderColor:palette.ink},
  filterText:{fontSize:font.sm,fontWeight:'600',color:palette.ink},
  filterTextOn:{fontSize:font.sm,fontWeight:'700',color:palette.card},
  menuButton:{minWidth:size.touch,minHeight:size.touch,alignItems:'center',justifyContent:'center'},
 });
