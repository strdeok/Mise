import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { dateKey, formatClock, formatDuration } from '@/domain/logic';
import type { ScheduleBlock } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, SheetCard, Label, palette, PrepLabel, Sub, TimeValue, Title } from '@/components/mise-ui';
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
const DAY_MINUTE_HEIGHT = 4;
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
const durationColor = palette.ink;
const accentFor = (_block: ScheduleBlock) => ({ fill: palette.greenSoft, line: palette.ink });

function DurationMarker({ height, duration, fill }: { height: number; duration: number; fill: string }) {
  const shortTask = duration <= 15;
  return <View accessible={false} style={[styles.durationMarker, shortTask && styles.durationMarkerShort, { height: shortTask ? Math.min(height, 48) : height, backgroundColor: fill }]} />;
}

function TimetableBlock({ block, todoTitle, onOpen, timelineStartMinute, markerColor }: { block: ScheduleBlock; todoTitle: string; onOpen: () => void; timelineStartMinute: number; markerColor: string }) {
  const saveBlock = useMiseStore((x) => x.saveBlock);
  const [dragging, setDragging] = useState(false);
  const deltaY = useSharedValue(0);
  const latestBlock = useRef(block);
  latestBlock.current = block;
  const duration = block.endMinute - block.startMinute;
  const blockHeight = Math.max(48, duration * DAY_MINUTE_HEIGHT - 2);
  const blockStyle = useAnimatedStyle(() => ({ transform: [{ translateY: dragging ? deltaY.get() : 0 }], opacity: dragging ? 0.35 : 1 }));
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
      const start = Math.max(0, Math.min(1440 - duration, Math.round((block.startMinute + event.translationY / DAY_MINUTE_HEIGHT) / 5) * 5));
      deltaY.set((start - block.startMinute) * DAY_MINUTE_HEIGHT);
      scheduleOnRN(commitDrag, start);
    })
    .onFinalize((_, success) => { if (!success) scheduleOnRN(cancelDrag); }),
  [block.startMinute, cancelDrag, commitDrag, beginDrag, deltaY, duration]);
  return <GestureDetector gesture={pan}><Animated.View style={[styles.timetableBlock, { top: (block.startMinute - timelineStartMinute) * DAY_MINUTE_HEIGHT, height: blockHeight }, blockStyle]}>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${block.title}, ${formatClock(block.startMinute)}부터 ${formatClock(block.endMinute)}까지. 일정 메뉴 열기`} style={styles.blockTap}>
      <DurationMarker height={blockHeight} duration={duration} fill={markerColor} />
      <View style={styles.blockCopy}>
        <Text numberOfLines={1} style={styles.timetableMeta}>{formatClock(block.startMinute)}–{formatClock(block.endMinute)} · {formatDuration(duration * 60)}</Text>
        <Text numberOfLines={2} style={styles.dayBlockTitle}>{block.title}</Text>
        {duration >= 90 && todoTitle !== block.title && block.todoId && <Text numberOfLines={1} style={styles.timetableMeta}>{todoTitle}</Text>}
      </View>
    </Pressable>
  </Animated.View></GestureDetector>;
}

function ScheduleBlockDetails({ selectedBlock, onClose, addBlock, onOpenTimer }: { selectedBlock?: ScheduleBlock; onClose: () => void; addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void }) {
  const todos = useMiseStore((x) => x.todos);
  const remove = useMiseStore((x) => x.deleteBlock);
  const start = useMiseStore((x) => x.prepareSession);
  const [picker, setPicker] = useState<string | null>(null);
  const availableTodos = todos.filter((todo) => !todo.archivedAt);
  const beginFocus = (block: ScheduleBlock) => block.todoId ? start('focus', block.todoId, block.id).then((id) => { if (id) onOpenTimer(); }) : setPicker(block.id);
  return <>
    <Modal visible={!!selectedBlock} transparent animationType="slide" onRequestClose={() => onClose()}><SafeAreaSheet><SheetCard style={styles.modal}><PrepLabel>시간표 일정</PrepLabel><Title>{selectedBlock?.title}</Title><TimeValue>{selectedBlock ? `${formatClock(selectedBlock.startMinute)}–${formatClock(selectedBlock.endMinute)}` : ''}</TimeValue><Sub>{selectedBlock?.todoId ? `Todo · ${todos.find((todo) => todo.id === selectedBlock.todoId)?.title ?? '삭제된 Todo'}` : 'Todo 미연결'}</Sub><View style={styles.modalActions}><Button label="수정" tone="quiet" onPress={() => { if (!selectedBlock) return; onClose(); addBlock(selectedBlock.dateKey, selectedBlock); }} /><Button label="집중 시작" onPress={() => { if (!selectedBlock) return; onClose(); beginFocus(selectedBlock); }} /></View><Button label="삭제" tone="quiet" onPress={() => { if (!selectedBlock) return; const id = selectedBlock.id; onClose(); Alert.alert('일정 삭제', '삭제해도 연결된 완료 Focus 기록은 유지됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => remove(id) }]); }} /><Button label="닫기" tone="quiet" onPress={() => onClose()} /></SheetCard></SafeAreaSheet></Modal>
    <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}><SafeAreaSheet><SheetCard style={styles.modal}><Title>Todo 선택</Title>{availableTodos.map((todo) => <Button key={todo.id} label={todo.title} tone="quiet" onPress={() => picker && start('focus', todo.id, picker).then((id) => { setPicker(null); if (id) onOpenTimer(); })} />)}{!availableTodos.length && <Sub>먼저 Todo를 추가해 주세요.</Sub>}<Button label="취소" tone="quiet" onPress={() => setPicker(null)} /></SheetCard></SafeAreaSheet></Modal>
  </>;
}

function DayTimeline({ selectedDate, blocks, addBlock, onOpenTimer, onSelect }: { selectedDate: string; blocks: ScheduleBlock[]; addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void; onSelect: (key: string) => void }) {
  const todos = useMiseStore((x) => x.todos);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const list = blocks.filter((block) => block.dateKey === selectedDate && !block.deletedAt).sort((a, b) => a.startMinute - b.startMinute);
  const selectedBlock = list.find((block) => block.id === selectedBlockId);
  const dates = weekKeys(selectedDate);
  const timelineStartMinute = list.length ? Math.floor(list[0].startMinute / 60) * 60 : 0;
  const timelineEndMinute = list.length ? Math.min(1440, Math.ceil((list[list.length - 1].endMinute + 30) / 60) * 60) : 0;
  const timelineHeight = (timelineEndMinute - timelineStartMinute) * DAY_MINUTE_HEIGHT;
  const createAt = (positionY: number) => addBlock(selectedDate, undefined, Math.max(0, Math.min(1435, Math.round((timelineStartMinute + positionY / DAY_MINUTE_HEIGHT) / 5) * 5)));
  return <>
    <View style={styles.dayDateStrip}>{dates.map((key, index) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key} 일정 보기`} accessibilityState={{ selected: key === selectedDate }} onPress={() => onSelect(key)} style={styles.dayDateCell}>
      <Text style={styles.weekDayText}>{['월', '화', '수', '목', '금', '토', '일'][index]}</Text>
      <View style={[styles.weekDateCircle, key === selectedDate && styles.weekDateCircleSelected]}><Text style={[styles.weekDateText, key === selectedDate && styles.weekDateTextSelected]}>{day(key).getDate()}</Text></View>
      <View style={[styles.weekDot, blocks.some((block) => !block.deletedAt && block.dateKey === key) && styles.weekDotFilled]} />
    </Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.timelineScroll}>
      {list.length ? <View style={[styles.timeline, { height: timelineHeight }]}>
        <View accessible={false} style={styles.timelineSpine} />
        {Array.from({ length: Math.floor((timelineEndMinute - timelineStartMinute) / 60) + 1 }, (_, index) => <View key={index} style={[styles.hourLine, { top: index * 60 * DAY_MINUTE_HEIGHT }]}><Text style={styles.hourLabel}>{formatClock(timelineStartMinute + index * 60)}</Text></View>)}
        <Pressable style={styles.timelineTap} onPress={(event) => createAt(event.nativeEvent.locationY)} />
        {list.map((block) => {
          return <TimetableBlock key={block.id} block={block} timelineStartMinute={timelineStartMinute} todoTitle={block.todoId ? todos.find((todo) => todo.id === block.todoId)?.title ?? '삭제된 Todo' : 'Todo 미연결'} markerColor={durationColor} onOpen={() => setSelectedBlockId(block.id)} />;
        })}
      </View> : <View style={styles.dayEmpty}><Sub>이 날은 아직 비어 있어요.</Sub><Button label="일정 추가" onPress={() => addBlock(selectedDate)} /></View>}
    </ScrollView>
    <ScheduleBlockDetails selectedBlock={selectedBlock} onClose={() => setSelectedBlockId(null)} addBlock={addBlock} onOpenTimer={onOpenTimer} />
  </>;
}

function MonthView({ selectedDate, blocks, onSelect }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void }) {
  const todos = useMiseStore((x) => x.todos);
  const active = blocks.filter((block) => !block.deletedAt);
  const markedDates: Record<string, { dots?: { key: string; color: string; selectedDotColor: string }[]; selected?: boolean; selectedColor?: string }> = {};
  active.forEach((block) => {
    const mark = markedDates[block.dateKey] ?? { dots: [] };
    if ((mark.dots?.length ?? 0) < 3) mark.dots?.push({ key: block.id, color: accentFor(block).line, selectedDotColor: '#fff' });
    markedDates[block.dateKey] = mark;
  });
  markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: palette.ink };
  const selected = active.filter((block) => block.dateKey === selectedDate).sort((a, b) => a.startMinute - b.startMinute);
  return <ScrollView style={styles.monthScroll} contentContainerStyle={styles.monthContent}><Calendar markingType="multi-dot" current={selectedDate} firstDay={1} onDayPress={(value) => onSelect(value.dateString)} onMonthChange={(value) => onSelect(`${value.year}-${String(value.month).padStart(2, '0')}-01`)} markedDates={markedDates} theme={{ calendarBackground: palette.bg, dayTextColor: palette.ink, monthTextColor: palette.ink, textMonthFontWeight: '700', textDayFontWeight: '600', arrowColor: palette.ink, todayTextColor: palette.ink, textDisabledColor: '#BDBDBD', textDayHeaderFontWeight: '700', textDayHeaderFontSize: font.xs }} /><View style={styles.monthAgenda}><View style={styles.monthAgendaHead}><PrepLabel>{selectedDate}</PrepLabel><Text style={styles.monthAgendaCount}>{selected.length}개 일정</Text></View>{selected.length ? selected.map((block) => { const linkedTodo = block.todoId ? todos.find((todo) => todo.id === block.todoId) : undefined; return <View key={block.id} style={styles.monthBlock}><TimeValue>{formatClock(block.startMinute)}</TimeValue><View style={styles.monthBlockMark} /><View style={styles.monthBlockText}><Text style={styles.timetableTitle}>{block.title}</Text><Text style={styles.monthBlockMeta}>{formatClock(block.startMinute)}–{formatClock(block.endMinute)} · {linkedTodo ? `Todo · ${linkedTodo.title}` : 'Todo 미연결'}</Text></View></View>; }) : <Sub>등록한 일정이 없습니다. 빈 시간대를 눌러 추가할 수 있어요.</Sub>}</View></ScrollView>;
}

function WeekView({ selectedDate, blocks, onSelect, addBlock, onOpenTimer }: { selectedDate: string; blocks: ScheduleBlock[]; onSelect: (key: string) => void; addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const todos = useMiseStore((x) => x.todos);
  const keys = weekKeys(selectedDate);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId && !block.deletedAt && keys.includes(block.dateKey));
  const selectDate = (key: string) => {
    onSelect(key);
    scrollRef.current?.scrollTo({ y: sectionOffsets.current[key] ?? 0, animated: false });
  };
  return <View style={styles.weekAgenda}>
    <View style={styles.weekHeader}>{keys.map((key, index) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key} 일정으로 이동`} accessibilityState={{ selected: key === selectedDate }} onPress={() => selectDate(key)} style={styles.weekDayHead}>
      <Text style={styles.weekDayText}>{['월', '화', '수', '목', '금', '토', '일'][index]}</Text>
      <View style={[styles.weekDateCircle, key === selectedDate && styles.weekDateCircleSelected]}><Text style={[styles.weekDateText, key === selectedDate && styles.weekDateTextSelected]}>{day(key).getDate()}</Text></View>
      <View style={[styles.weekDot, blocks.some((block) => !block.deletedAt && block.dateKey === key) && styles.weekDotFilled]} />
    </Pressable>)}</View>
    <ScrollView key={keys[0]} ref={scrollRef} contentContainerStyle={styles.weekAgendaContent}>
      {keys.map((key) => {
        const list = blocks.filter((block) => !block.deletedAt && block.dateKey === key).sort((a, b) => a.startMinute - b.startMinute);
        return <View key={key} onLayout={(event) => { sectionOffsets.current[key] = event.nativeEvent.layout.y; }} style={[styles.agendaSection, !list.length && styles.agendaSectionEmpty]}>
          <View style={styles.agendaSectionHead}><Text style={styles.agendaDate}>{day(key).getDate()}일 {LocaleConfig.locales.ko.dayNames[day(key).getDay()]}</Text>{key === dateKey() && <PrepLabel>오늘</PrepLabel>}{!list.length && <Text style={styles.agendaEmpty}>일정 없음</Text>}<Pressable accessibilityRole="button" accessibilityLabel={`${key} 일정 추가`} onPress={() => { onSelect(key); addBlock(key); }} style={styles.agendaAdd}><Text style={styles.agendaAddText}>+ 일정</Text></Pressable></View>
          {list.length ? list.map((block) => {
            const linkedTitle = todos.find((todo) => todo.id === block.todoId)?.title;
            return <Pressable key={block.id} accessibilityRole="button" accessibilityLabel={`${block.title}, ${formatClock(block.startMinute)}부터 ${formatClock(block.endMinute)}까지. 일정 상세 열기`} onPress={() => { onSelect(key); setSelectedBlockId(block.id); }} style={styles.agendaRow}>
              <View style={styles.agendaTime}><Text style={styles.agendaStart}>{formatClock(block.startMinute)}</Text><Text style={styles.agendaEnd}>{formatClock(block.endMinute)}</Text></View>
              <View style={styles.agendaCopy}><Text style={styles.agendaTitle}>{block.title}</Text><Text style={styles.agendaMeta}>{formatDuration((block.endMinute - block.startMinute) * 60)}{linkedTitle && linkedTitle !== block.title ? ` · ${linkedTitle}` : ''}</Text></View>
            </Pressable>;
          }) : null}
        </View>;
      })}
    </ScrollView>
    <ScheduleBlockDetails selectedBlock={selectedBlock} onClose={() => setSelectedBlockId(null)} addBlock={addBlock} onOpenTimer={onOpenTimer} />
  </View>;
}

export function ScheduleView({ addBlock, onOpenTimer }: { addBlock: (date: string, block?: ScheduleBlock, startMinute?: number) => void; onOpenTimer: () => void }) {
  const blocks = useMiseStore((x) => x.blocks);
  const [view, setView] = useState<ScheduleView>('month');
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const shiftPeriod = (direction: number) => setSelectedDate(view === 'month' ? changeMonth(selectedDate, direction) : changeDay(selectedDate, view === 'week' ? direction * 7 : direction));
  return <View style={styles.page}>
    <View style={styles.header}><View style={styles.headerTop}><View><Label>MISE / SCHEDULE</Label><Title>일정</Title></View><Pressable style={styles.addAction} onPress={() => addBlock(selectedDate)}><Text style={styles.addActionText}>+ 일정</Text></Pressable></View><View style={styles.headerBottom}>{view === 'month' ? <Label>월간 보기</Label> : <View style={styles.dateNav}><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(-1)}><Text style={styles.nav}>‹</Text></Pressable><Pressable onPress={() => setSelectedDate(dateKey())}><Text style={styles.periodText}>{view === 'week' ? `${weekKeys(selectedDate)[0].slice(5)} – ${weekKeys(selectedDate)[6].slice(5)}` : `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일`}</Text></Pressable><Pressable hitSlop={space[2]} onPress={() => shiftPeriod(1)}><Text style={styles.nav}>›</Text></Pressable></View>}<View style={styles.switcher}>{([['month', '월'], ['week', '주'], ['day', '일']] as const).map(([id, label]) => <Pressable key={id} onPress={() => setView(id)} style={[styles.switchButton, view === id && styles.switchButtonOn]}><Text style={[styles.switchText, view === id && styles.switchTextOn]}>{label}</Text></Pressable>)}</View></View></View>
    {view === 'month' && <MonthView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} />}
    {view === 'week' && <WeekView selectedDate={selectedDate} blocks={blocks} onSelect={setSelectedDate} addBlock={addBlock} onOpenTimer={onOpenTimer} />}
    {view === 'day' && <DayTimeline key={selectedDate} selectedDate={selectedDate} blocks={blocks} addBlock={addBlock} onOpenTimer={onOpenTimer} onSelect={setSelectedDate} />}
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
  monthAgenda: { paddingHorizontal: pageGutter(), paddingTop: space[5], gap: space[2] }, monthAgendaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthAgendaCount: { color: palette.muted, fontSize: font.sm, fontWeight: '700' },
  monthBlock: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: 1, borderColor: palette.line, gap: space[2] },
  monthBlockMark: { width: 1, alignSelf: 'stretch', marginVertical: space[2], backgroundColor: palette.line }, monthBlockText: { flex: 1, gap: 3 }, monthBlockMeta: { color: palette.muted, fontSize: font.xs, fontVariant: ['tabular-nums'] },
  weekAgenda: { flex: 1, backgroundColor: palette.bg },
  dayDateStrip: { flexDirection: 'row', paddingHorizontal: space[2], paddingVertical: space[2], borderBottomWidth: 1, borderColor: palette.line, backgroundColor: palette.card },
  dayDateCell: { flex: 1, minHeight: size.touch, alignItems: 'center', justifyContent: 'center', gap: 2 },
  weekHeader: { flexDirection: 'row', paddingHorizontal: space[2], paddingVertical: space[3], borderBottomWidth: 1, borderColor: palette.line, backgroundColor: palette.card },
  weekDayHead: { flex: 1, minHeight: size.touch, alignItems: 'center', gap: space[1] },
  weekDayText: { fontSize: font.sm, color: palette.muted, fontWeight: '600' },
  weekDateCircle: { width: 34, height: 34, borderRadius: radius.circle, alignItems: 'center', justifyContent: 'center' },
  weekDateCircleSelected: { backgroundColor: palette.ink },
  weekDateText: { color: palette.ink, fontSize: font.lg, fontWeight: '700', fontVariant: ['tabular-nums'] },
  weekDateTextSelected: { color: palette.card },
  weekDot: { width: 4, height: 4, borderRadius: radius.circle }, weekDotFilled: { backgroundColor: palette.muted },
  weekAgendaContent: { paddingHorizontal: pageGutter(), paddingBottom: 128 },
  agendaSection: { paddingTop: space[6], paddingBottom: space[3] },
  agendaSectionEmpty: { paddingTop: space[2], paddingBottom: space[2] },
  agendaSectionHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  agendaDate: { color: palette.ink, fontSize: font.md, fontWeight: '700' },
  agendaAdd: { marginLeft: 'auto', minHeight: size.touch, justifyContent: 'center', paddingHorizontal: space[2] },
  agendaAddText: { color: palette.muted, fontSize: font.sm, fontWeight: '600' },
  agendaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[4], paddingVertical: space[4], minHeight: 76, borderBottomWidth: 1, borderColor: palette.line },
  agendaTime: { width: 50, gap: space[1] },
  agendaStart: { fontSize: font.lg, fontWeight: '600', color: palette.ink, fontVariant: ['tabular-nums'] },
  agendaEnd: { fontSize: font.sm, color: palette.muted, fontVariant: ['tabular-nums'] },
  agendaCopy: { flex: 1, minWidth: 0, gap: space[1] },
  agendaTitle: { color: palette.ink, fontSize: font.lg, lineHeight: 22, fontWeight: '600' },
  agendaMeta: { color: palette.muted, fontSize: font.sm, lineHeight: 18 },
  agendaEmpty: { color: palette.muted, fontSize: font.sm },
  timelineScroll: { paddingBottom: 128, paddingTop: space[2] },
  timeline: { marginLeft: 58, marginRight: space[4], position: 'relative' },
  timelineSpine: { position: 'absolute', top: 0, bottom: 0, left: 27, width: 2, backgroundColor: palette.line },
  hourLine: { position: 'absolute', left: 0, right: 0, height: 1, flexDirection: 'row' },
  hourLabel: { position: 'absolute', right: '100%', width: 53, textAlign: 'right', paddingRight: space[2], top: -8, fontSize: font.xs, fontWeight: '500', color: palette.muted },
  timelineTap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  timetableBlock: { position: 'absolute', left: -5, right: 0, zIndex: 2 },
  blockTap: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[2], gap: space[3] },
  durationMarker: { width: 48, flexShrink: 0, borderRadius: radius.pill, backgroundColor: palette.greenSoft },
  durationMarkerShort: { borderRadius: radius.circle },
  blockCopy: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 },
  dayBlockTitle: { fontSize: 18, lineHeight: 23, fontWeight: '600', color: palette.ink },
  dayEmpty: { paddingTop: space[8], alignItems: 'flex-start', gap: space[3] },
  timetableTitle: { fontSize: 13, fontWeight: '600', color: palette.ink },
  timetableMeta: { fontSize: font.md, lineHeight: 19, color: palette.muted, fontVariant: ['tabular-nums'] },
  modalActions: { flexDirection: 'row', gap: space[2] },
  modal: { gap: space[3] },
});
