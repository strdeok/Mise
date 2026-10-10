import { useRef, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import { dateKey, formatClock } from '@/domain/logic';
import type { ScheduleBlock } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, Card, Label, palette, Sub, Title } from '@/components/mise-ui';
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

function TimetableBlock({ block, index, todoTitle, onEdit, onFocus, onDelete }: { block: ScheduleBlock; index: number; todoTitle: string; onEdit: () => void; onFocus: () => void; onDelete: () => void }) {
  const saveBlock = useMiseStore((x) => x.saveBlock);
  const [dragging, setDragging] = useState(false);
  const [deltaY, setDeltaY] = useState(0);
  const deltaRef = useRef(0);
  const latestBlock = useRef(block);
  latestBlock.current = block;
  const duration = block.endMinute - block.startMinute;
  const proposedStart = Math.max(0, Math.min(1440 - duration, Math.round((block.startMinute + deltaY) / 5) * 5));
  const blockHeight = Math.max(32, duration - 2);
  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gesture) => { deltaRef.current = gesture.dy; setDeltaY(gesture.dy); },
    onPanResponderRelease: async () => {
      const current = latestBlock.current;
      const currentDuration = current.endMinute - current.startMinute;
      const start = Math.max(0, Math.min(1440 - currentDuration, Math.round((current.startMinute + deltaRef.current) / 5) * 5));
      setDragging(false); setDeltaY(0); deltaRef.current = 0;
      if (start !== current.startMinute) await saveBlock({ id: current.id, dateKey: current.dateKey, startMinute: start, endMinute: start + currentDuration, title: current.title, todoId: current.todoId });
    },
    onPanResponderTerminate: () => { setDragging(false); setDeltaY(0); deltaRef.current = 0; },
  })).current;
  return <>
    {dragging && <View pointerEvents="none" style={[styles.dropPreview, { top: proposedStart, height: blockHeight }]}><Text style={styles.dropPreviewText}>{formatClock(proposedStart)}에 놓기</Text></View>}
    <View {...responder.panHandlers} style={[styles.timetableBlock, { top: block.startMinute, height: blockHeight, opacity: dragging ? 0.35 : 1, transform: [{ translateY: dragging ? deltaY : 0 }] }]}>
      <View style={styles.blockBody}><Text numberOfLines={1} style={styles.timetableTitle}>{block.title}</Text><Text numberOfLines={1} style={styles.timetableMeta}>{formatClock(block.startMinute)}–{formatClock(block.endMinute)} · {todoTitle}</Text></View>
      <View style={styles.blockActions}><Pressable onPress={onEdit}><Text style={styles.blockActionText}>수정</Text></Pressable><Pressable onPress={onFocus}><Text style={styles.blockActionText}>집중</Text></Pressable><Pressable onPress={onDelete}><Text style={styles.blockActionText}>삭제</Text></Pressable></View>
    </View>
  </>;
}

function DayTimeline({ selectedDate, blocks, addBlock }: { selectedDate: string; blocks: ScheduleBlock[]; addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const todos = useMiseStore((x) => x.todos);
  const remove = useMiseStore((x) => x.deleteBlock);
  const start = useMiseStore((x) => x.startSession);
  const [picker, setPicker] = useState<string | null>(null);
  const list = blocks.filter((block) => block.dateKey === selectedDate && !block.deletedAt).sort((a, b) => a.startMinute - b.startMinute);
  const availableTodos = todos.filter((todo) => !todo.archivedAt);
  const beginFocus = (block: ScheduleBlock) => block.todoId ? start('focus', block.todoId, block.id).then((id) => id && router.push('/timer')) : setPicker(block.id);
  const createAt = (positionY: number) => addBlock(selectedDate, undefined, Math.max(0, Math.min(1380, Math.round(positionY / 5) * 5)));
  return <>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.timelineScroll} onContentSizeChange={() => scrollRef.current?.scrollTo({ y: 7 * size.timelineHour, animated: false })}>
      <View style={[styles.timeline, { height: TIMELINE_HEIGHT }]}>
        {Array.from({ length: 25 }, (_, index) => <View key={index} style={[styles.hourLine, { top: index * size.timelineHour }]}><Text style={styles.hourLabel}>{String(index).padStart(2, '0')}:00</Text><View style={styles.hourRule} /></View>)}
        <Pressable style={styles.timelineTap} onPress={(event) => createAt(event.nativeEvent.locationY)} />
        {list.map((block, index) => <TimetableBlock key={block.id} block={block} index={index} todoTitle={block.todoId ? todos.find((todo) => todo.id === block.todoId)?.title ?? '삭제된 Todo' : 'Todo 선택'} onEdit={() => addBlock(selectedDate, block)} onFocus={() => beginFocus(block)} onDelete={() => Alert.alert('일정 삭제', '삭제해도 연결된 완료 Focus 기록은 유지됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => remove(block.id) }])} />)}
      </View>
    </ScrollView>
    <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><View style={styles.overlay}><Card style={styles.modal}><Title>Todo 선택</Title>{availableTodos.map((todo) => <Button key={todo.id} label={todo.title} tone="quiet" onPress={() => picker && start('focus', todo.id, picker).then((id) => { setPicker(null); if (id) router.push('/timer'); })} />)}{!availableTodos.length && <Sub>먼저 Todo를 추가해 주세요.</Sub>}<Button label="취소" tone="quiet" onPress={() => setPicker(null)} /></Card></View></Modal>
  </>;
}

function MonthView({ selectedDate, blocks, onSelect }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void }) {
  const active = blocks.filter((block) => !block.deletedAt);
  const markedDates = active.reduce<Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>>((all, block) => ({ ...all, [block.dateKey]: { marked: true, dotColor: palette.ink } }), {});
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: palette.ink };
  const selected = active.filter((block) => block.dateKey === selectedDate).sort((a, b) => a.startMinute - b.startMinute);
  return <ScrollView style={styles.monthScroll} contentContainerStyle={styles.monthContent}><Calendar current={selectedDate} firstDay={1} onDayPress={(value) => onSelect(value.dateString)} onMonthChange={(value) => onSelect(`${value.year}-${String(value.month).padStart(2, '0')}-01`)} markedDates={markedDates} theme={{ calendarBackground: palette.bg, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '600', textDayFontWeight: '500', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#BDBDBD' }} /><View style={styles.monthAgenda}><Label>{selectedDate}</Label><Title>선택한 날의 일정</Title>{selected.length ? selected.map((block) => <View key={block.id} style={styles.monthBlock}><Text style={styles.monthBlockTime}>{formatClock(block.startMinute)}</Text><View style={styles.monthBlockText}><Text style={styles.timetableTitle}>{block.title}</Text><Sub>{formatClock(block.startMinute)}–{formatClock(block.endMinute)}</Sub></View></View>) : <Sub>등록한 일정이 없습니다.</Sub>}</View></ScrollView>;
}

function WeekView({ selectedDate, blocks, onSelect }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const keys = weekKeys(selectedDate);
  const dayWidth = Math.max(1, (width - WEEK_HOUR_WIDTH) / 7);
  return <View style={styles.weekGrid}>
    <View style={styles.weekHeader}><View style={{ width: WEEK_HOUR_WIDTH }} />{keys.map((key, index) => <Pressable key={key} onPress={() => onSelect(key)} style={[styles.weekDayHead, { width: dayWidth }, key === selectedDate && styles.weekDayHeadSelected]}><Text style={[styles.weekDayText, key === selectedDate && styles.weekDayTextSelected]}>{['월', '화', '수', '목', '금', '토', '일'][index]}</Text><Text style={[styles.weekDateText, key === selectedDate && styles.weekDayTextSelected]}>{day(key).getDate()}</Text></Pressable>)}</View>
    <ScrollView ref={scrollRef} contentContainerStyle={styles.weekScroll} onContentSizeChange={() => scrollRef.current?.scrollTo({ y: 7 * size.timelineHour, animated: false })}>
      <View style={styles.weekBody}>
        {keys.map((key, index) => <View key={key} style={[styles.weekColumn, { left: WEEK_HOUR_WIDTH + index * dayWidth, width: dayWidth }]} />)}
        {Array.from({ length: 25 }, (_, index) => <View key={index} style={[styles.weekHourLine, { top: index * size.timelineHour, left: WEEK_HOUR_WIDTH }]}><Text style={[styles.weekHourLabel, { width: WEEK_HOUR_WIDTH }]}>{String(index).padStart(2, '0')}</Text></View>)}
        {keys.map((key, column) => blocks.filter((block) => !block.deletedAt && block.dateKey === key).map((block) => <Pressable key={block.id} onPress={() => onSelect(key)} accessibilityLabel={`${key} ${formatClock(block.startMinute)} ${block.title}`} style={[styles.weekBlock, { left: WEEK_HOUR_WIDTH + column * dayWidth + 1, width: dayWidth - 2, top: block.startMinute, height: Math.max(22, block.endMinute - block.startMinute) }]}><Text numberOfLines={2} style={styles.weekBlockText}>{block.title}</Text></Pressable>))}
      </View>
    </ScrollView>
  </View>;
}

export function ScheduleView({ addBlock }: { addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void }) {
  const blocks = useMiseStore((x) => x.blocks);
  const [view, setView] = useState<ScheduleView>('month');
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const shiftPeriod = (direction: number) => setSelectedDate(view === 'month' ? changeMonth(selectedDate, direction) : changeDay(selectedDate, view === 'week' ? direction * 7 : direction));
  return <View style={styles.page}>
    <View style={styles.header}><View style={styles.headerTop}><View><Label>MISE / SCHEDULE</Label><Title>일정</Title></View><Pressable style={styles.addAction} onPress={() => addBlock(selectedDate)}><Text style={styles.addActionText}>+ 일정</Text></Pressable></View><View style={styles.headerBottom}>{view === 'month' ? <Label>월간 보기</Label> : <View style={styles.dateNav}><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(-1)}><Text style={styles.nav}>‹</Text></Pressable><Pressable onPress={() => setSelectedDate(dateKey())}><Text style={styles.periodText}>{view === 'week' ? `${weekKeys(selectedDate)[0].slice(5)} – ${weekKeys(selectedDate)[6].slice(5)}` : selectedDate.slice(5)}</Text></Pressable><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(1)}><Text style={styles.nav}>›</Text></Pressable></View>}<View style={styles.switcher}>{([['month', '월'], ['week', '주'], ['day', '일']] as const).map(([id, label]) => <Pressable key={id} onPress={() => setView(id)} style={[styles.switchButton, view === id && styles.switchButtonOn]}><Text style={[styles.switchText, view === id && styles.switchTextOn]}>{label}</Text></Pressable>)}</View></View></View>
    {view === 'month' && <MonthView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} />}
    {view === 'week' && <WeekView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} />}
    {view === 'day' && <DayTimeline selectedDate={selectedDate} blocks={blocks} addBlock={addBlock} />}
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
  monthAgenda: { paddingHorizontal: pageGutter(), paddingTop: space[4], gap: space[2] },
  monthBlock: { flexDirection: 'row', alignItems: 'center', minHeight: 62, borderBottomWidth: 1, borderColor: palette.line },
  monthBlockTime: { width: 58, fontWeight: '600', fontSize: font.sm, color: palette.muted, fontVariant: ['tabular-nums'] },
  monthBlockText: { flex: 1 },
  weekGrid: { flex: 1, backgroundColor: palette.card },
  weekScroll: { paddingBottom: 128 },
  weekHeader: { height: 49, flexDirection: 'row', borderBottomWidth: 1, borderColor: palette.line },
  weekDayHead: { alignItems: 'center', justifyContent: 'center', gap: 1, borderLeftWidth: 1, borderColor: palette.line },
  weekDayHeadSelected: { backgroundColor: palette.greenSoft },
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
  timetableBlock: { position: 'absolute', left: space[1], right: 7, borderLeftWidth: 3, borderColor: palette.ink, backgroundColor: palette.greenSoft, paddingHorizontal: 9, paddingVertical: 7, overflow: 'hidden', zIndex: 2 },
  blockBody: { flex: 1 },
  timetableTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
  timetableMeta: { fontSize: 10, color: palette.muted, marginTop: 2 },
  blockActions: { flexDirection: 'row', gap: space[3], justifyContent: 'flex-end' },
  blockActionText: { fontSize: 11, fontWeight: '600', color: palette.ink },
  dropPreview: { position: 'absolute', left: space[1], right: 7, borderWidth: 2, borderStyle: 'dashed', borderColor: '#777', backgroundColor: '#D8D8D8', paddingHorizontal: 9, paddingVertical: 7, zIndex: 1, justifyContent: 'center' },
  dropPreviewText: { color: '#444', fontSize: font.xs, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008', padding: space[4] },
  modal: { gap: space[3] },
});
