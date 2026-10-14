import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { dateKey, formatClock } from '@/domain/logic';
import type { ScheduleBlock } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, SheetCard, Label, palette, Sub, Title } from '@/components/mise-ui';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { font, pageGutter, radius, size, space } from '@/constants/layout';

LocaleConfig.locales.ko = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

type ScheduleView = 'month' | 'week' | 'day';
const TIMELINE_HEIGHT = 24 * size.timelineHour;
const WEEK_HOUR_WIDTH = 36;
const MORNING_SCROLL = 7 * size.timelineHour - 16;
const day = (key: string) => new Date(`${key}T12:00:00`);
const changeDay = (key: string, amount: number) => {
  const value = day(key);
  value.setDate(value.getDate() + amount);
  return dateKey(value);
};
const changeMonth = (key: string, amount: number) => {
  const value = day(key);
  value.setDate(1);
  value.setMonth(value.getMonth() + amount);
  return dateKey(value);
};
const startOfWeek = (key: string) => {
  const value = day(key);
  const offset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - offset);
  return dateKey(value);
};
const weekKeys = (key: string) => Array.from({ length: 7 }, (_, index) => changeDay(startOfWeek(key), index));
const accentFor = (_block: ScheduleBlock) => ({ fill: palette.greenSoft, line: palette.ink });

function TimetableBlock({ block, todoTitle, onOpen }: { block: ScheduleBlock; todoTitle: string; onOpen: () => void }) {
  const saveBlock = useMiseStore((x) => x.saveBlock);
  const [dragging, setDragging] = useState(false);
  const deltaY = useSharedValue(0);
  const latestBlock = useRef(block);
  latestBlock.current = block;
  const duration = block.endMinute - block.startMinute;
  const accent = accentFor(block);
  const blockHeight = duration - 2;
  const blockStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragging ? deltaY.get() : 0 }], opacity: dragging ? 0.35 : 1 }));
  const previewStyle = useAnimatedStyle(() => {
    const snappedStart = Math.max(0, Math.min(1440 - duration, Math.round((block.startMinute + deltaY.get()) / 5) * 5));
    return { transform: [{ translateY: snappedStart - block.startMinute }] };
  });
  const beginDrag = useCallback(() => setDragging(true), []);
  const cancelDrag = useCallback(() => { deltaY.set(0); setDragging(false); }, [deltaY]);
  const commitDrag = useCallback(async (startMinute: number) => {
    const current = latestBlock.current;
    const currentDuration = current.endMinute - current.startMinute;
    if (startMinute !== current.startMinute) {
      await saveBlock({ id: current.id, dateKey: current.dateKey, startMinute, endMinute: startMinute + currentDuration, title: current.title, todoId: current.todoId });
    }
    deltaY.set(0);
    setDragging(false);
  }, [deltaY, saveBlock]);
  const pan = useMemo(() => Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart(() => { scheduleOnRN(beginDrag); })
    .onUpdate((event) => { deltaY.set(event.translationY); })
    .onEnd((event) => {
      const start = Math.max(0, Math.min(1440 - duration, Math.round((block.startMinute + event.translationY) / 5) * 5));
      deltaY.set(start - block.startMinute);
      scheduleOnRN(commitDrag, start);
    })
    .onFinalize((_, success) => { if (!success) scheduleOnRN(cancelDrag); }),
  [block.startMinute, cancelDrag, commitDrag, beginDrag, deltaY, duration]);
  return <>
    {dragging && <Animated.View pointerEvents="none" style={[styles.dropPreview, { top: block.startMinute, height: blockHeight }, previewStyle]} />}
    <GestureDetector gesture={pan}><Animated.View style={[styles.timetableBlock, { top: block.startMinute, height: blockHeight, borderColor: accent.line, backgroundColor: accent.fill }, blockStyle]}>
      <Pressable onPress={onOpen} accessibilityLabel={`${block.title}, ${formatClock(block.startMinute)}부터 ${formatClock(block.endMinute)}까지. 일정 메뉴 열기`} style={[styles.blockTap, { paddingVertical: duration < 40 ? 1 : 4 }]}>
        {duration >= 20 && <Text numberOfLines={1} style={styles.timetableTitle}>{block.title}</Text>}
        {duration >= 40 && <Text numberOfLines={1} style={styles.timetableMeta}>{formatClock(block.startMinute)}–{formatClock(block.endMinute)} · {todoTitle}</Text>}
      </Pressable>
    </Animated.View></GestureDetector>
  </>;
}

function DayTimeline({ selectedDate, blocks, addBlock, onOpenTimer }: { selectedDate: string; blocks: ScheduleBlock[]; addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const todos = useMiseStore((x) => x.todos);
  const remove = useMiseStore((x) => x.deleteBlock);
  const start = useMiseStore((x) => x.prepareSession);
  const [picker, setPicker] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const list = blocks.filter((block) => block.dateKey === selectedDate && !block.deletedAt).sort((a, b) => a.startMinute - b.startMinute);
  const selectedBlock = list.find((block) => block.id === selectedBlockId);
  const availableTodos = todos.filter((todo) => !todo.archivedAt);
  const beginFocus = (block: ScheduleBlock) => block.todoId ? start('focus', block.todoId, block.id).then((id) => { if (id) onOpenTimer(); }) : setPicker(block.id);
  const createAt = (positionY: number) => addBlock(selectedDate, undefined, Math.max(0, Math.min(1380, Math.round(positionY / 5) * 5)));
  return <>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.timelineScroll} onContentSizeChange={() => scrollRef.current?.scrollTo({ y: MORNING_SCROLL, animated: false })}>
      <View style={[styles.timeline, { height: TIMELINE_HEIGHT }]}>
        {Array.from({ length: 25 }, (_, index) => <View key={index} style={[styles.hourLine, { top: index * size.timelineHour }]}><Text style={styles.hourLabel}>{String(index).padStart(2, '0')}:00</Text><View style={styles.hourRule} /></View>)}
        <Pressable style={styles.timelineTap} onPress={(event) => createAt(event.nativeEvent.locationY)} />
        {list.map((block) => <TimetableBlock key={block.id} block={block} todoTitle={block.todoId ? todos.find((todo) => todo.id === block.todoId)?.title ?? '삭제된 Todo' : 'Todo 선택'} onOpen={() => setSelectedBlockId(block.id)} />)}
      </View>
    </ScrollView>
    <Modal visible={!!selectedBlock} transparent animationType="slide" onRequestClose={() => setSelectedBlockId(null)}><SafeAreaSheet><SheetCard style={styles.modal}><Label>일정</Label><Title>{selectedBlock?.title}</Title><Sub>{selectedBlock ? `${formatClock(selectedBlock.startMinute)}–${formatClock(selectedBlock.endMinute)}` : ''}</Sub><View style={styles.modalActions}><Button label="수정" tone="quiet" onPress={() => { if (!selectedBlock) return; setSelectedBlockId(null); addBlock(selectedDate, selectedBlock); }} /><Button label="집중 시작" onPress={() => { if (!selectedBlock) return; setSelectedBlockId(null); beginFocus(selectedBlock); }} /></View><Button label="삭제" tone="quiet" onPress={() => { if (!selectedBlock) return; const id = selectedBlock.id; setSelectedBlockId(null); Alert.alert('일정 삭제', '삭제해도 연결된 완료 Focus 기록은 유지됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => remove(id) }]); }} /><Button label="닫기" tone="quiet" onPress={() => setSelectedBlockId(null)} /></SheetCard></SafeAreaSheet></Modal>
    <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><SafeAreaSheet><SheetCard style={styles.modal}><Title>Todo 선택</Title>{availableTodos.map((todo) => <Button key={todo.id} label={todo.title} tone="quiet" onPress={() => picker && start('focus', todo.id, picker).then((id) => { setPicker(null); if (id) onOpenTimer(); })} />)}{!availableTodos.length && <Sub>먼저 Todo를 추가해 주세요.</Sub>}<Button label="취소" tone="quiet" onPress={() => setPicker(null)} /></SheetCard></SafeAreaSheet></Modal>
  </>;
}

function MonthView({ selectedDate, blocks, onSelect }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void }) {
  const active = blocks.filter((block) => !block.deletedAt);
  const markedDates: Record<string, { dots?: { key: string; color: string; selectedDotColor: string }[]; selected?: boolean; selectedColor?: string }> = {};
  active.forEach((block) => {
    const mark = markedDates[block.dateKey] ?? { dots: [] };
    if ((mark.dots?.length ?? 0) < 3) mark.dots?.push({ key: block.id, color: accentFor(block).line, selectedDotColor: '#fff' });
    markedDates[block.dateKey] = mark;
  });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: palette.ink };
  const selected = active.filter((block) => block.dateKey === selectedDate).sort((a, b) => a.startMinute - b.startMinute);
  const monthBlocks = active.filter((block) => block.dateKey.slice(0, 7) === selectedDate.slice(0, 7));
  return <ScrollView style={styles.monthScroll} contentContainerStyle={styles.monthContent}><View style={styles.monthSummary}><Text style={styles.monthSummaryNumber}>{monthBlocks.length}</Text><Text style={styles.monthSummaryText}>이번 달에 계획한 블록</Text><Text style={styles.monthSummaryText}>{[...new Set(monthBlocks.map((block) => block.dateKey))].length}일에 배치됨</Text></View><Calendar markingType="multi-dot" current={selectedDate} firstDay={1} onDayPress={(value) => onSelect(value.dateString)} onMonthChange={(value) => onSelect(`${value.year}-${String(value.month).padStart(2, '0')}-01`)} markedDates={markedDates} theme={{ calendarBackground: palette.bg, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '700', textDayFontWeight: '600', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#BDBDBD', textDayHeaderFontWeight: '700', textDayHeaderFontSize: font.xs }} /><View style={styles.monthAgenda}><View style={styles.monthAgendaHead}><View><Label>{selectedDate}</Label><Title>선택한 날</Title></View><Text style={styles.monthAgendaCount}>{selected.length}개</Text></View>{selected.length ? selected.map((block) => <View key={block.id} style={styles.monthBlock}><Text style={styles.monthBlockTime}>{formatClock(block.startMinute)}</Text><View style={[styles.monthBlockMark, { backgroundColor: accentFor(block).line }]} /><View style={styles.monthBlockText}><Text style={styles.timetableTitle}>{block.title}</Text><Sub>{formatClock(block.startMinute)}–{formatClock(block.endMinute)}</Sub></View></View>) : <Sub>등록한 일정이 없습니다. 빈 시간대를 눌러 추가할 수 있어요.</Sub>}</View></ScrollView>;
}

function WeekView({ selectedDate, blocks, onSelect, onOpenDay }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void; onOpenDay: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const keys = weekKeys(selectedDate);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId && !block.deletedAt && keys.includes(block.dateKey));
  const dayWidth = Math.max(1, (width - WEEK_HOUR_WIDTH) / 7);
  return <View style={styles.weekGrid}>
    <View style={styles.weekHeader}><View style={{ width: WEEK_HOUR_WIDTH }} />{keys.map((key, index) => <Pressable key={key} onPress={() => { setSelectedBlockId(null); onSelect(key); }} style={[styles.weekDayHead, { width: dayWidth }, key === selectedDate && styles.weekDayHeadSelected]}><Text style={[styles.weekDayText, key === selectedDate && styles.weekDayTextSelected]}>{['월', '화', '수', '목', '금', '토', '일'][index]}</Text><Text style={[styles.weekDateText, key === selectedDate && styles.weekDayTextSelected]}>{day(key).getDate()}</Text></Pressable>)}</View>
    <ScrollView style={{ flex: 1 }} ref={scrollRef} contentContainerStyle={styles.weekScroll} onContentSizeChange={() => scrollRef.current?.scrollTo({ y: MORNING_SCROLL, animated: false })}>
      <View style={styles.weekBody}>
        {keys.map((key, index) => <View key={key} style={[styles.weekColumn, { left: WEEK_HOUR_WIDTH + index * dayWidth, width: dayWidth }]} />)}
        {Array.from({ length: 25 }, (_, index) => <View key={index} style={[styles.weekHourLine, { top: index * size.timelineHour, left: WEEK_HOUR_WIDTH }]}><Text style={[styles.weekHourLabel, { width: WEEK_HOUR_WIDTH }]}>{String(index).padStart(2, '0')}</Text></View>)}
        {keys.map((key, column) => blocks.filter((block) => !block.deletedAt && block.dateKey === key).map((block) => { const accent = accentFor(block); return <Pressable key={block.id} onPress={() => { setSelectedBlockId(block.id); onSelect(key); }} accessibilityRole="button" accessibilityState={{ selected: selectedBlockId === block.id }} accessibilityLabel={`${key} ${formatClock(block.startMinute)} ${block.title}`} style={[styles.weekBlock, selectedBlockId === block.id && styles.weekBlockSelected, { borderColor: accent.line, backgroundColor: selectedBlockId === block.id ? accent.line : accent.fill, left: WEEK_HOUR_WIDTH + column * dayWidth + 1, width: dayWidth - 2, top: block.startMinute, height: Math.max(22, block.endMinute - block.startMinute) }]}><Text numberOfLines={1} style={[styles.weekBlockText, selectedBlockId === block.id && styles.weekBlockTextSelected]}>{block.title}</Text></Pressable>; }))}
      </View>
    </ScrollView>
    <View style={styles.weekDetail}>{selectedBlock ? <><View style={{ flex: 1, gap: 4 }}><Label>{selectedBlock.dateKey.slice(5)} · {formatClock(selectedBlock.startMinute)}–{formatClock(selectedBlock.endMinute)}</Label><Text numberOfLines={2} style={styles.timetableTitle}>{selectedBlock.title}</Text></View><Button label="하루 보기" tone="quiet" onPress={onOpenDay} /></> : <Sub>블록을 누르면 일정의 제목과 시간을 볼 수 있어요.</Sub>}</View>
  </View>;
}

export function ScheduleView({ addBlock, onOpenTimer }: { addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void }) {
  const blocks = useMiseStore((x) => x.blocks);
  const [view, setView] = useState<ScheduleView>('month');
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const shiftPeriod = (direction: number) => setSelectedDate(view === 'month' ? changeMonth(selectedDate, direction) : changeDay(selectedDate, view === 'week' ? direction * 7 : direction));
  return <View style={styles.page}>
    <View style={styles.header}><View style={styles.headerTop}><View><Label>MISE / SCHEDULE</Label><Title>일정</Title></View><Pressable style={styles.addAction} onPress={() => addBlock(selectedDate)}><Text style={styles.addActionText}>+ 일정</Text></Pressable></View><View style={styles.headerBottom}>{view === 'month' ? <Label>월간 보기</Label> : <View style={styles.dateNav}><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(-1)}><Text style={styles.nav}>‹</Text></Pressable><Pressable onPress={() => setSelectedDate(dateKey())}><Text style={styles.periodText}>{view === 'week' ? `${weekKeys(selectedDate)[0].slice(5)} – ${weekKeys(selectedDate)[6].slice(5)}` : selectedDate.slice(5)}</Text></Pressable><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(1)}><Text style={styles.nav}>›</Text></Pressable></View>}<View style={styles.switcher}>{([['month', '월'], ['week', '주'], ['day', '일']] as const).map(([id, label]) => <Pressable key={id} onPress={() => setView(id)} style={[styles.switchButton, view === id && styles.switchButtonOn]}><Text style={[styles.switchText, view === id && styles.switchTextOn]}>{label}</Text></Pressable>)}</View></View></View>
    {view === 'month' && <MonthView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} />}
    {view === 'week' && <WeekView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} onOpenDay={() => setView('day')} />}
    {view === 'day' && <DayTimeline selectedDate={selectedDate} blocks={blocks} addBlock={addBlock} onOpenTimer={onOpenTimer} />}
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  header: { paddingHorizontal: pageGutter(), paddingTop: space[3], paddingBottom: space[2], gap: space[3], borderBottomWidth: 1, borderColor: palette.line, backgroundColor: palette.card },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addAction: { minHeight: size.touch, justifyContent: 'center', paddingHorizontal: space[3], borderWidth: 1, borderColor: palette.line, borderRadius: radius.sm },
  addActionText: { color: palette.ink, fontWeight: '600', fontSize: font.md },
  headerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  nav: { fontSize: 27, fontWeight: '300', color: palette.ink, paddingHorizontal: space[1] },
  periodText: { fontSize: font.md, fontWeight: '600', color: palette.ink, fontVariant: ['tabular-nums'] },
  switcher: { flexDirection: 'row', borderWidth: 1, borderColor: palette.line, borderRadius: radius.sm, overflow: 'hidden' },
  switchButton: { minWidth: 38, minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  switchButtonOn: { backgroundColor: palette.ink },
  switchText: { fontSize: font.sm, fontWeight: '600', color: palette.muted },
  switchTextOn: { color: '#fff' },
  monthContent: { paddingBottom: 128 },
  monthScroll: { flex: 1 },
  monthSummary: { minHeight: 58, marginHorizontal: pageGutter(), marginTop: space[3], paddingVertical: space[2], borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  monthSummaryNumber: { color: palette.ink, fontSize: font.xl, fontWeight: '800', letterSpacing: -.6 }, monthSummaryText: { color: palette.muted, fontSize: font.xs, fontWeight: '600' },
  monthAgenda: { paddingHorizontal: pageGutter(), paddingTop: space[5], gap: space[2] }, monthAgendaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthAgendaCount: { color: palette.muted, fontSize: font.sm, fontWeight: '700' },
  monthBlock: { flexDirection: 'row', alignItems: 'center', minHeight: 62, borderBottomWidth: 1, borderColor: palette.line },
  monthBlockTime: { width: 58, fontWeight: '600', fontSize: font.sm, color: palette.muted, fontVariant: ['tabular-nums'] },
  monthBlockMark: { width: 3, alignSelf: 'stretch', marginVertical: space[2], marginRight: space[2], backgroundColor: palette.ink }, monthBlockText: { flex: 1 },
  weekBlockSelected: { backgroundColor: palette.ink, borderColor: palette.ink },
  weekBlockTextSelected: { color: '#fff' },
  weekDetail: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, gap: 12, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: palette.line },
  weekGrid: { flex: 1, backgroundColor: palette.card },
  weekScroll: { paddingBottom: 128 },
  weekHeader: { height: 49, flexDirection: 'row', borderBottomWidth: 1, borderColor: palette.line },
  weekDayHead: { alignItems: 'center', justifyContent: 'center', gap: 1, borderLeftWidth: 1, borderColor: palette.line },
  weekDayHeadSelected: { backgroundColor: palette.greenSoft, borderBottomWidth: 3, borderBottomColor: palette.ink },
  weekDayText: { fontSize: font.xs, color: palette.muted, fontWeight: '500' },
  weekDateText: { color: palette.ink, fontSize: font.sm, fontWeight: '600' },
  weekDayTextSelected: { color: palette.ink },
  weekBody: { height: TIMELINE_HEIGHT, position: 'relative' },
  weekColumn: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderColor: palette.line },
  weekHourLine: { position: 'absolute', right: 0, height: 1, borderTopWidth: 1, borderColor: palette.line },
  weekHourLabel: { position: 'absolute', right: '100%', top: -7, color: palette.muted, textAlign: 'right', paddingRight: space[1], fontSize: font.xs, fontWeight: '500' },
  weekBlock: { position: 'absolute', paddingHorizontal: 3, paddingVertical: 2, borderLeftWidth: 2, borderColor: palette.ink, backgroundColor: palette.greenSoft, overflow: 'hidden' },
  weekBlockText: { color: palette.ink, fontSize: 10, fontWeight: '600', lineHeight: 12 },
  timelineScroll: { paddingBottom: 128 },
  timeline: { marginLeft: 58, marginRight: space[4], position: 'relative', borderLeftWidth: 1, borderColor: palette.line },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, flexDirection: 'row' },
  hourLabel: { position: 'absolute', right: '100%', width: 53, textAlign: 'right', paddingRight: space[2], top: -8, fontSize: font.xs, fontWeight: '500', color: palette.muted },
  hourRule: { height: 1, backgroundColor: palette.line, flex: 1 },
  timelineTap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  timetableBlock: { position: 'absolute', left: space[1], right: 7, borderLeftWidth: 3, borderColor: palette.ink, backgroundColor: palette.greenSoft, paddingHorizontal: 9, overflow: 'hidden', zIndex: 2 },
  blockTap: { flex: 1, justifyContent: 'center' },
  timetableTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
  timetableMeta: { fontSize: 10, color: palette.muted, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: space[2] },
  dropPreview: { position: 'absolute', left: space[1], right: 7, borderWidth: 2, borderStyle: 'dashed', borderColor: palette.ink, backgroundColor: palette.greenSoft, zIndex: 1 },
  modal: { gap: space[3] },
});
