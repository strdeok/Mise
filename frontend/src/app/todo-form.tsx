import { Chevron } from '@/components/chevron';
import { Button, Field, Label, palette, PrepLabel, Sub, TimeValue } from '@/components/mise-ui';
import { CategoryBadge } from '@/components/todo-categories';
import { MiseTimePicker } from '@/components/mise-time-picker';
import { font, pageGutter, size, space } from '@/constants/layout';
import { dateKey, descendants, formatClock, todoPath } from '@/domain/logic';
import { useMiseStore } from '@/store/use-mise-store';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const paramsValue = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;

export default function TodoFormPage() {
  const params = useLocalSearchParams<{ todoId?: string; parentId?: string; dateContext?: string }>();
  const todoId = paramsValue(params.todoId);
  const parentParam = paramsValue(params.parentId);
  const dateContext = paramsValue(params.dateContext);
  const todos = useMiseStore((state) => state.todos);
  const categories = useMiseStore((state) => state.categories);
  const blocks = useMiseStore((state) => state.blocks);
  const error = useMiseStore((state) => state.error);
  const saveTodoPlan = useMiseStore((state) => state.saveTodoPlan);
  const saveCategory = useMiseStore((state) => state.saveCategory);
  const editing = todos.find((todo) => todo.id === todoId) ?? null;
  const parentId = parentParam || null;
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [scheduleDate, setScheduleDate] = useState(dateContext ?? dateKey());
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleCalendarOpen, setScheduleCalendarOpen] = useState(false);
  const [timePicker, setTimePicker] = useState<'start' | 'end' | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [picker, setPicker] = useState<'parent' | 'category' | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const existingBlock = editing ? blocks.find((block) => block.todoId === editing.id && !block.deletedAt) : undefined;
    setTitle(editing?.title ?? '');
    setEstimatedMinutes(editing?.estimatedMinutes ? String(editing.estimatedMinutes) : '');
    setScheduleDate(existingBlock?.dateKey ?? dateContext ?? dateKey());
    setScheduleStart(existingBlock ? formatClock(existingBlock.startMinute) : '');
    setScheduleEnd(existingBlock ? formatClock(existingBlock.endMinute) : '');
    setScheduleCalendarOpen(false);
    setTimePicker(null);
    setSelectedParent(editing?.parentId ?? parentId);
    setSelectedCategory(editing?.categoryId ?? null);
    setSelectedDates(editing?.todayDateKeys ?? [dateContext ?? dateKey()]);
    setDatePickerOpen(false);
    setSaving(false);
    setNewCategory('');
    setPicker(null);
    setSearch('');
  }, [todoId, parentId, dateContext, editing?.title, editing?.parentId, editing?.categoryId, editing?.estimatedMinutes, editing?.todayDateKeys]);

  const invalidParents = useMemo(() => editing ? descendants(editing.id, todos) : new Set<string>(), [editing, todos]);
  const availableParents = todos.filter((todo) => !invalidParents.has(todo.id) && !todo.archivedAt && todoPath(todo.id, todos).length < 3);
  const matchingParents = availableParents.filter((todo) => todoPath(todo.id, todos).join(' / ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const matchingCategories = categories.slice().sort((a, b) => a.order - b.order).filter((category) => category.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selectedCategoryData = categories.find((category) => category.id === selectedCategory);
  const marks = Object.fromEntries(selectedDates.map((date) => [date, { selected: true, selectedColor: palette.ink } ]));

  const close = () => router.canGoBack() ? router.back() : router.replace('/');
  const onBack = () => picker ? setPicker(null) : close();
  const openPicker = (kind: 'parent' | 'category') => { setSearch(''); setPicker(kind); };
  const toggleDate = (key: string) => setSelectedDates((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key].sort());
  const handleTimeConfirm = (next: string) => {
    if (!timePicker) return;
    if (timePicker === 'start') setScheduleStart(next); else setScheduleEnd(next);
    setTimePicker(null);
  };

  const createCategory = async () => {
    const result = await saveCategory(newCategory);
    if (result) { setSelectedCategory(result); setNewCategory(''); setPicker(null); }
  };

  const submitTodo = async () => {
    if (saving) return;
    const trimmedMinutes = estimatedMinutes.trim();
    const parsedMinutes = trimmedMinutes ? Number(trimmedMinutes) : null;
    if (parsedMinutes !== null && (!Number.isInteger(parsedMinutes) || parsedMinutes < 1 || parsedMinutes > 9999)) {
      useMiseStore.setState({ error: '예상 시간은 1분에서 9,999분 사이로 입력해 주세요.' });
      return;
    }
    const parseTime = (value: string) => {
      const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
      if (!match) return null;
      const hours = Number(match[1]); const minutes = Number(match[2]);
      return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
    };
    const hasStart = !!scheduleStart.trim(); const hasEnd = !!scheduleEnd.trim();
    if (hasStart !== hasEnd) { useMiseStore.setState({ error: '시작 시간과 종료 시간을 모두 입력해 주세요.' }); return; }
    const startMinute = hasStart ? parseTime(scheduleStart) : null;
    const endMinute = hasEnd ? parseTime(scheduleEnd) : null;
    if (hasStart && (startMinute === null || endMinute === null)) { useMiseStore.setState({ error: '시간은 24시간 형식으로 입력해 주세요. 예: 09:30' }); return; }
    setSaving(true);
    try {
      const ok = await saveTodoPlan({ id: editing?.id, title, parentId: selectedParent, categoryId: selectedCategory, todayDateKeys: selectedDates, estimatedMinutes: parsedMinutes, schedule: startMinute !== null && endMinute !== null ? { dateKey: scheduleDate, startMinute, endMinute } : null });
      if (ok) close();
    } catch {
      useMiseStore.setState({ error: 'Todo를 저장하지 못했습니다. 다시 시도해 주세요.' });
    } finally { setSaving(false); }
  };

  const selectedParentLabel = selectedParent ? todoPath(selectedParent, todos).join(' / ') : '없음';

  return <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Todo 입력 닫기" onPress={onBack} style={styles.headerAction}><Text style={styles.headerActionText}>{picker ? '뒤로' : '취소'}</Text></Pressable>
        <Text style={styles.headerTitle}>{picker ? (picker === 'parent' ? '상위 Todo' : '카테고리') : editing ? 'Todo 수정' : 'Todo 추가'}</Text>
        <View style={styles.headerAction} />
      </View>

      {picker ? <ScrollView contentContainerStyle={styles.pickerContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.pickerHeading}>{picker === 'parent' ? '어떤 Todo 아래에 둘까요?' : '어떤 카테고리로 묶을까요?'}</Text>
        <Label>{picker === 'parent' ? '상위 Todo 검색' : '카테고리 검색'}</Label>
        <Field value={search} onChangeText={setSearch} placeholder={picker === 'parent' ? 'Todo 이름으로 검색' : '카테고리 이름으로 검색'} />
        <Pressable accessibilityRole="button" accessibilityLabel="없음 선택" onPress={() => { picker === 'parent' ? setSelectedParent(null) : setSelectedCategory(null); setPicker(null); }} style={styles.pickerRow}>
          <Text style={styles.pickerText}>없음</Text>{(picker === 'parent' ? !selectedParent : !selectedCategory) && <Text style={styles.pickerCheck}>✓</Text>}
        </Pressable>
        {picker === 'parent' ? matchingParents.map((todo) => <Pressable key={todo.id} accessibilityRole="button" accessibilityLabel={`${todo.title} 상위 Todo 선택`} onPress={() => { setSelectedParent(todo.id); setPicker(null); }} style={styles.pickerRow}>
          <Text numberOfLines={2} style={styles.pickerText}>{todoPath(todo.id, todos).join(' / ')}</Text>{selectedParent === todo.id && <Text style={styles.pickerCheck}>✓</Text>}
        </Pressable>) : matchingCategories.map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`${category.name} 카테고리 선택`} onPress={() => { setSelectedCategory(category.id); setPicker(null); }} style={styles.pickerRow}>
          <CategoryBadge category={category} />{selectedCategory === category.id && <Text style={styles.pickerCheck}>✓</Text>}
        </Pressable>)}
        {picker === 'parent' && matchingParents.length === 0 && <Sub>일치하는 Todo가 없습니다.</Sub>}
        {picker === 'category' && matchingCategories.length === 0 && <Sub>일치하는 카테고리가 없습니다.</Sub>}
        {picker === 'category' && <View style={styles.categoryCreate}><View style={styles.flex}><Label>새 카테고리</Label><Field value={newCategory} onChangeText={setNewCategory} placeholder="카테고리 이름" /></View><Button label="등록" tone="quiet" disabled={!newCategory.trim()} onPress={createCategory} /></View>}
      </ScrollView> : <>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{editing ? '할 일을 다듬어보세요' : '해야 할 일을 적어주세요'}</Text>
          <Text style={styles.intro}>제목을 먼저 정하고, 날짜와 분류는 필요에 맞게 설정할 수 있어요.</Text>

          <View style={styles.fieldGroup}>
            <Label>할 일 제목</Label>
            <TextInput accessibilityLabel="할 일 제목" value={title} onChangeText={setTitle} placeholder="예: 통계 화면 구현" placeholderTextColor="#777773" multiline textAlignVertical="top" style={styles.titleInput} />
            <Text style={styles.helper}>해야 할 일을 알아보기 쉽게 적어주세요.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}><PrepLabel>시간 계획</PrepLabel><Text style={styles.optional}>선택 사항</Text></View>
            <Text style={styles.helper}>입력하면 해당 날짜의 Schedule에도 등록됩니다.</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: scheduleCalendarOpen }} accessibilityLabel="일정 날짜 선택" onPress={() => setScheduleCalendarOpen((open) => !open)} style={styles.selectionRow}>
              <Text style={styles.rowValue}>{new Date(`${scheduleDate}T12:00:00`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</Text><Text style={styles.expandMark}>{scheduleCalendarOpen ? '−' : '+'}</Text>
            </Pressable>
            {scheduleCalendarOpen && <Calendar current={scheduleDate} onDayPress={(value) => { setScheduleDate(value.dateString); setScheduleCalendarOpen(false); }} markedDates={{ [scheduleDate]: { selected: true, selectedColor: palette.ink } }} theme={{ calendarBackground: palette.bg, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '700', textDayFontWeight: '600', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#777773', selectedDayBackgroundColor: palette.ink, selectedDayTextColor: '#fff' }} />}
            <View style={styles.timeRow}>
              <View style={styles.timeField}><Label>시작</Label><Pressable accessibilityRole="button" accessibilityLabel="시작 시간 선택" onPress={() => setTimePicker('start')} style={styles.timeInput}>{scheduleStart ? <TimeValue>{scheduleStart}</TimeValue> : <Text style={styles.timePlaceholder}>시간 선택</Text>}</Pressable></View>
              <Text style={styles.timeDivider}>–</Text>
              <View style={styles.timeField}><Label>종료</Label><Pressable accessibilityRole="button" accessibilityLabel="종료 시간 선택" onPress={() => setTimePicker('end')} style={styles.timeInput}>{scheduleEnd ? <TimeValue>{scheduleEnd}</TimeValue> : <Text style={styles.timePlaceholder}>시간 선택</Text>}</Pressable></View>
            </View>
            <MiseTimePicker visible={!!timePicker} value={timePicker === 'end' ? scheduleEnd || '10:00' : scheduleStart || '09:00'} label={timePicker === 'end' ? '종료 시간' : '시작 시간'} onDismiss={() => setTimePicker(null)} onConfirm={handleTimeConfirm} />
            <Text style={styles.helper}>24시간 형식, 5분 단위로 입력해 주세요. 예: 09:30–10:30</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}><Label>할 일 표시 날짜</Label><Text style={styles.optional}>{selectedDates.length ? `${selectedDates.length}일 선택` : '날짜 미지정'}</Text></View>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: datePickerOpen }} accessibilityLabel={datePickerOpen ? '달력 닫기' : '날짜 선택 달력 열기'} onPress={() => setDatePickerOpen((open) => !open)} style={styles.expandRow}>
              <Text style={styles.rowValue}>{datePickerOpen ? '달력 닫기' : '날짜 선택'}</Text><Text style={styles.expandMark}>{datePickerOpen ? '−' : '+'}</Text>
            </Pressable>
            {selectedDates.length > 0 && <View style={styles.dateChips}>{selectedDates.map((date) => <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })} 날짜 제외`} onPress={() => toggleDate(date)} style={styles.dateChip}>
              <Text style={styles.dateChipText}>{new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}  ×</Text>
            </Pressable>)}</View>}
            {datePickerOpen && <Calendar current={selectedDates[0] ?? dateKey()} onDayPress={(value) => toggleDate(value.dateString)} markedDates={marks} theme={{ calendarBackground: palette.bg, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '700', textDayFontWeight: '600', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#777773', selectedDayBackgroundColor: palette.ink, selectedDayTextColor: '#fff' }} />}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}><Label>예상 소요 시간</Label><Text style={styles.optional}>선택 사항</Text></View>
            <View style={styles.estimateRow}><View style={styles.flex}><Field value={estimatedMinutes} onChangeText={setEstimatedMinutes} placeholder="예: 60" keyboardType="number-pad" /></View><Text style={styles.unit}>분</Text></View>
            <Text style={styles.helper}>Timer 기본 시간과는 별개로 계획에 표시됩니다.</Text>
          </View>

          <View style={styles.section}>
            <Label>상위 Todo</Label>
            <Pressable accessibilityRole="button" accessibilityLabel="상위 Todo 선택" onPress={() => openPicker('parent')} style={styles.selectionRow}><Text numberOfLines={2} style={styles.rowValue}>{selectedParentLabel}</Text><Chevron /></Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHead}><Label>카테고리</Label><Text style={styles.optional}>선택 사항</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="카테고리 선택" onPress={() => openPicker('category')} style={styles.selectionRow}><View style={styles.flex}>{selectedCategoryData ? <CategoryBadge category={selectedCategoryData} /> : <Text style={styles.rowValue}>없음</Text>}</View><Chevron /></Pressable>
          </View>

          {error && <Text accessibilityRole="alert" style={styles.formError}>{error}</Text>}
        </ScrollView>
        <View style={styles.footer}><Button label={saving ? '저장 중…' : editing ? '변경 사항 저장' : 'Todo 저장'} disabled={!title.trim() || saving} onPress={submitTodo} /></View>
      </>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  keyboard: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 720 },
  header: { minHeight: 56, paddingHorizontal: pageGutter(), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.line },
  headerAction: { minWidth: 64, minHeight: size.touch, justifyContent: 'center' },
  headerActionText: { color: palette.ink, fontSize: font.md, fontWeight: '700' },
  headerTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' },
  content: { paddingHorizontal: pageGutter(), paddingTop: space[8], paddingBottom: space[6], gap: space[6] },
  heading: { color: palette.ink, fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6 },
  intro: { color: palette.muted, fontSize: font.md, lineHeight: 22, marginTop: -space[4] },
  fieldGroup: { gap: space[2] },
  titleInput: { minHeight: 112, borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingHorizontal: space[4], paddingVertical: space[4], color: palette.ink, backgroundColor: palette.card, fontSize: 21, lineHeight: 29, fontWeight: '600' },
  helper: { color: palette.muted, fontSize: font.sm, lineHeight: 19 },
  section: { gap: space[2] },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optional: { color: palette.muted, fontSize: font.sm, fontWeight: '600' },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[3] },
  timeField: { flex: 1, gap: space[2] },
  timeInput: { minHeight: size.touchLarge, borderWidth: 1, borderColor: palette.line, borderRadius: 8, paddingHorizontal: space[3], justifyContent: 'center', color: palette.ink, backgroundColor: palette.card, fontSize: font.lg, fontWeight: '600' },
  timePlaceholder: { color: palette.muted, fontSize: font.md, fontWeight: '600' },
  timeDivider: { color: palette.muted, fontSize: font.lg, paddingBottom: space[3] },
  flex: { flex: 1 },
  unit: { color: palette.muted, fontSize: font.md, fontWeight: '700', paddingHorizontal: space[2] },
  expandRow: { minHeight: size.touchLarge, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowValue: { flex: 1, color: palette.ink, fontSize: font.md, fontWeight: '600' },
  expandMark: { width: size.touch, textAlign: 'center', color: palette.ink, fontSize: 24 },
  dateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  dateChip: { minHeight: size.touch, justifyContent: 'center', paddingHorizontal: space[3], borderRadius: 99, backgroundColor: palette.greenSoft },
  dateChipText: { color: palette.ink, fontSize: font.sm, fontWeight: '700' },
  selectionRow: { minHeight: size.touchLarge, borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.card, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', gap: space[2] },
  formError: { color: palette.ink, fontSize: font.sm, fontWeight: '700', padding: space[3], borderWidth: 1, borderColor: palette.ink, borderRadius: 8 },
  footer: { paddingHorizontal: pageGutter(), paddingTop: space[3], paddingBottom: space[3], borderTopWidth: 1, borderColor: palette.line, backgroundColor: palette.bg },
  pickerContent: { paddingHorizontal: pageGutter(), paddingTop: space[8], paddingBottom: space[6], gap: space[2] },
  pickerHeading: { color: palette.ink, fontSize: 24, lineHeight: 32, fontWeight: '700', marginBottom: space[3] },
  pickerRow: { minHeight: size.touchLarge, borderBottomWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2], paddingVertical: space[2] },
  pickerText: { flex: 1, color: palette.ink, fontSize: font.md, fontWeight: '600' },
  pickerCheck: { color: palette.ink, fontSize: font.lg, fontWeight: '700' },
  categoryCreate: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2], paddingTop: space[4] },
});
