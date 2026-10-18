import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { activeSession, dateKey, elapsedSeconds, formatClock, formatDuration } from '@/domain/logic';
import { aggregateStats, monthPeriod, movePeriod, weekPeriod } from '@/domain/statistics';
import type { ScheduleBlock, Todo } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Label, palette, Sub, Title } from '@/components/mise-ui';
import { CategoryBadge } from '@/components/todo-categories';
import { TodoMenuButton, type MenuAnchor } from '@/components/todo-actions-sheet';
import { font, pageGutter, radius, size, space } from '@/constants/layout';

const koreanDate = (key: string) => {
  const value = new Date(`${key}T12:00:00`);
  return value.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
};
const dayStrip = (key: string) => {
  const pivot = new Date(`${key}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(pivot);
    value.setDate(value.getDate() + index - 3);
    return { key: dateKey(value), day: value.getDate(), weekday: ['일', '월', '화', '수', '목', '금', '토'][value.getDay()] };
  });
};
const reviewColors = [palette.ink, palette.blue, palette.mint, palette.purple, palette.orange];
const scheduleColor = (_block: ScheduleBlock) => ({ fill: palette.card, line: palette.ink });

type TodayProps = {
  onAddTodo: () => void;
  onOpenTodo: (todo: Todo) => void;
  onOpenTimer: (todo?: Todo, block?: ScheduleBlock) => void;
  onMenu: (todo: Todo, anchor: MenuAnchor) => void;
};

export function TodayBriefing({ onAddTodo, onOpenTodo, onOpenTimer, onMenu }: TodayProps) {
  const todos = useMiseStore((state) => state.todos);
  const categories = useMiseStore((state) => state.categories);
  const sessions = useMiseStore((state) => state.sessions);
  const settings = useMiseStore((state) => state.settings);
  const blocks = useMiseStore((state) => state.blocks);
  const toggleTodo = useMiseStore((state) => state.toggleTodo);
  const key = dateKey();
  const nowMinute = new Date().getHours() * 60 + new Date().getMinutes();
  const todayBlocks = blocks.filter((block) => !block.deletedAt && block.dateKey === key).sort((a, b) => a.startMinute - b.startMinute);
  const currentBlock = todayBlocks.find((block) => block.startMinute <= nowMinute && block.endMinute > nowMinute);
  const nextBlock = todayBlocks.find((block) => block.startMinute > nowMinute);
  const nowBlock = currentBlock ?? nextBlock;
  const todayTodos = todos.filter((todo) => !todo.archivedAt && todo.todayDateKeys.includes(key));
  const openTodos = todayTodos.filter((todo) => todo.status === 'open');
  const completedCount = todayTodos.length - openTodos.length;
  const focusSeconds = sessions.filter((session) => session.status === 'completed' && !session.excludedFromStatsAt && session.type === 'focus' && session.localStartDate === key).reduce((sum, session) => sum + (session.recordedSeconds ?? 0), 0);
  const plannedSeconds = todayBlocks.reduce((sum, block) => sum + (block.endMinute - block.startMinute) * 60, 0);
  const focusProgress = plannedSeconds ? Math.min(1, focusSeconds / plannedSeconds) : 0;
  const active = activeSession(sessions);
  const activeElapsed = active ? elapsedSeconds(active) : 0;
  const timerSeconds = active
    ? active.status === 'ready'
      ? settings.timerMode === 'countdown' ? active.targetSeconds : 0
      : settings.timerMode === 'countdown' ? Math.max(0, active.targetSeconds - activeElapsed) : activeElapsed
    : settings.defaultFocusMinutes * 60;
  const timerReadout = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(Math.floor(timerSeconds % 60)).padStart(2, '0')}`;
  const openTimer = () => {
    if (!active && !nowBlock && !openTodos.length) { onAddTodo(); return; }
    const scheduledTodo = nowBlock?.todoId ? todos.find((todo) => todo.id === nowBlock.todoId) : undefined;
    onOpenTimer(active ? undefined : scheduledTodo ?? openTodos[0], nowBlock);
  };

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.eyebrowRow}><Text style={styles.date}>{koreanDate(key)}</Text></View>
    <View style={styles.dateStrip}>{dayStrip(key).map((item) => <View key={item.key} style={styles.dayItem}><Text style={styles.dayWeek}>{item.weekday}</Text><View style={[styles.dayNumber, item.key === key && styles.dayNumberToday]}><Text style={[styles.dayNumberText, item.key === key && styles.dayNumberTextToday]}>{item.day}</Text></View></View>)}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={active ? '진행 중인 타이머 열기' : nowBlock ? `${nowBlock.title} 일정 집중 열기` : openTodos[0] ? `${openTodos[0].title} 타이머 열기` : '첫 할 일 추가'} onPress={openTimer} style={styles.startCard}>
      <View style={styles.startCopy}><Text style={styles.startTitle}>{timerReadout}</Text><Text style={styles.startHint}>{active ? '타이머 열기' : nowBlock ? '이 일정으로 집중하기' : openTodos[0] ? '이 Todo로 집중하기' : '첫 할 일 추가'}</Text></View><View style={styles.startPlay}><Text style={styles.startPlayText}>▶</Text></View>
    </Pressable>
    <View style={styles.ledger}>
      <View style={styles.ledgerValues}>
        <View style={styles.ledgerMetric}><Text style={styles.ledgerLabel}>실제 집중</Text><Text style={styles.ledgerValue}>{formatDuration(focusSeconds)}</Text></View>
        <View style={styles.ledgerDivider} />
        <View style={styles.ledgerMetric}><Text style={styles.ledgerLabel}>계획 시간</Text><Text style={styles.ledgerValue}>{plannedSeconds ? formatDuration(plannedSeconds) : '없음'}</Text></View>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="계획 시간 대비 실제 집중 시간" accessibilityValue={{ min: 0, max: 100, now: Math.round(focusProgress * 100) }} style={styles.ledgerRail}>
        <View style={[styles.ledgerRailFill, { width: `${focusProgress * 100}%` }]} />
      </View>
    </View>
    <View style={styles.scheduleSection}><View style={styles.listHeader}><View><Text style={styles.listTitle}>오늘 시간표</Text><Text style={styles.listMeta}>{todayBlocks.length ? `${todayBlocks.length}개 일정` : '등록된 일정 없음'}</Text></View></View>
      {todayBlocks.length ? <View style={styles.scheduleList}>{todayBlocks.map((block) => { const color = scheduleColor(block); const linkedTodo = block.todoId ? todos.find((todo) => todo.id === block.todoId) : null; const isCurrent = block.id === currentBlock?.id; return <View key={block.id} style={[styles.scheduleRow, { borderLeftColor: color.line, backgroundColor: color.fill }, isCurrent && styles.scheduleRowCurrent]}><Text style={styles.scheduleTime}>{formatClock(block.startMinute)}{`\n`}–{`\n`}{formatClock(block.endMinute)}</Text><View style={styles.scheduleCopy}><Text numberOfLines={1} style={styles.scheduleTitle}>{block.title}</Text><Text numberOfLines={1} style={styles.scheduleMeta}>{linkedTodo?.title ?? 'Todo 미연결'}{isCurrent ? ' · 진행 중' : ''}</Text></View></View>; })}</View> : <View style={styles.scheduleEmpty}><Text style={styles.scheduleEmptyText}>오늘은 비어 있어요. 일정 탭에서 시간을 배치해 보세요.</Text></View>}
    </View>
    <View style={styles.listHeader}><View><Text style={styles.listTitle}>오늘 할 일</Text><Text style={styles.listMeta}>{completedCount} 완료 · {openTodos.length} 남음</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Todo 추가" onPress={onAddTodo} style={styles.addButton}><Text style={styles.addButtonText}>+ 추가</Text></Pressable></View>
    <View style={styles.todoList}>{todayTodos.length ? todayTodos.map((todo) => <View key={todo.id} style={styles.todoRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.status === 'completed' }} accessibilityLabel={`${todo.title} 완료 전환`} onPress={() => toggleTodo(todo.id)} style={styles.checkboxTarget}><View style={[styles.checkbox, todo.status === 'completed' && styles.checkboxChecked]}>{todo.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}</View></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} 상세 보기`} style={styles.todoBody} onPress={() => onOpenTodo(todo)}><Text numberOfLines={1} style={[styles.todoTitle, todo.status === 'completed' && styles.todoDone]}>{todo.title}</Text><View style={styles.todoMeta}>{todo.parentId && <Text style={styles.todoPath}>하위 Todo</Text>}<CategoryBadge category={categories.find((category) => category.id === todo.categoryId)} /></View></Pressable>
      {todo.status === 'open' && <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} 타이머 열기`} onPress={() => onOpenTimer(todo)} style={styles.focusButton}><Text style={styles.focusButtonText}>집중</Text></Pressable>}
      <TodoMenuButton title={todo.title} onOpen={(anchor) => onMenu(todo, anchor)} />
    </View>) : <Pressable onPress={onAddTodo} style={styles.empty}><Text style={styles.emptyTitle}>오늘 할 일을 적어보세요</Text><Sub>먼저 제목만 입력하고, 나머지는 나중에 정해도 됩니다.</Sub></Pressable>}</View>
  </ScrollView>;
}

export function StatsReview() {
  const sessions = useMiseStore((state) => state.sessions);
  const blocks = useMiseStore((state) => state.blocks);
  const todos = useMiseStore((state) => state.todos);
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [anchor, setAnchor] = useState(new Date());
  const period = mode === 'week' ? weekPeriod(anchor) : monthPeriod(anchor);
  const stats = aggregateStats(sessions, blocks, todos, period);
  const plannedRatio = stats.plannedSeconds ? Math.min(1, stats.focusSeconds / stats.plannedSeconds) : 0;
  const breakRatio = (stats.focusSeconds + stats.breakSeconds) ? stats.breakSeconds / (stats.focusSeconds + stats.breakSeconds) : 0;
  const topTodoSeconds = Math.max(...stats.byTodo.map((todo) => todo.totalSeconds), 1);
  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.eyebrowRow}><Label>MISE / REVIEW</Label><View style={styles.segment}><Pressable onPress={() => setMode('week')} style={[styles.segmentItem, mode === 'week' && styles.segmentOn]}><Text style={[styles.segmentText, mode === 'week' && styles.segmentTextOn]}>주</Text></Pressable><Pressable onPress={() => setMode('month')} style={[styles.segmentItem, mode === 'month' && styles.segmentOn]}><Text style={[styles.segmentText, mode === 'month' && styles.segmentTextOn]}>월</Text></Pressable></View></View>
    <View style={styles.reviewNav}><Pressable accessibilityLabel="이전 기간" onPress={() => setAnchor(movePeriod(mode, anchor, -1))} style={styles.navButton}><Text style={styles.navText}>‹</Text></Pressable><View><Title>시간 회고</Title><Sub>{period.label}</Sub></View><Pressable accessibilityLabel="다음 기간" onPress={() => setAnchor(movePeriod(mode, anchor, 1))} style={styles.navButton}><Text style={styles.navText}>›</Text></Pressable></View>
    <View style={styles.reviewHero}><Text style={styles.reviewLabel}>총 집중 시간</Text><Text style={styles.reviewTime}>{formatDuration(stats.focusSeconds)}</Text><Text style={styles.reviewPlan}>계획 {formatDuration(stats.plannedSeconds)}</Text><View style={styles.reviewRail}><View style={[styles.reviewRailFill, { width: `${plannedRatio * 100}%` }]} /></View><View style={styles.reviewFoot}><Text style={styles.reviewFootText}>{!stats.plannedSeconds ? '등록한 계획이 없어요.' : stats.focusSeconds === stats.plannedSeconds ? '계획과 같아요.' : stats.focusSeconds > stats.plannedSeconds ? `계획보다 ${formatDuration(stats.focusSeconds - stats.plannedSeconds)} 더 집중했어요.` : `계획보다 ${formatDuration(stats.plannedSeconds - stats.focusSeconds)} 적게 기록됐어요.`}</Text><Text style={styles.reviewFootText}>{Math.round(plannedRatio * 100)}%</Text></View></View>
    <View style={styles.statColumns}><View style={styles.statColumn}><Label>계획 안</Label><Text style={styles.statValue}>{formatDuration(stats.plannedFocusSeconds)}</Text><Sub>일정에서 시작</Sub></View><View style={[styles.statColumn, styles.statColumnSecond]}><Label>계획 밖</Label><Text style={styles.statValue}>{formatDuration(stats.unplannedFocusSeconds)}</Text><Sub>바로 시작</Sub></View></View>
    <View style={styles.breakLine}><Text style={styles.breakText}>FOCUS {formatDuration(stats.focusSeconds)}</Text><View style={styles.breakRail}><View style={[styles.breakFill, { width: `${breakRatio * 100}%` }]} /></View><Text style={styles.breakText}>BREAK {formatDuration(stats.breakSeconds)}</Text></View>
    <View style={styles.taskReviewHeader}><Text style={styles.listTitle}>어디에 썼나요</Text><Text style={styles.listMeta}>{stats.byTodo.length}개 Todo</Text></View>
    <View style={styles.taskReview}>{stats.byTodo.length ? stats.byTodo.map((todo, index) => <View key={todo.id} style={styles.taskReviewItem}><View style={styles.taskReviewHead}><View style={styles.taskReviewName}><View style={[styles.taskColor, { backgroundColor: reviewColors[index % reviewColors.length] }]} /><Text numberOfLines={1} style={styles.todoTitle}>{todo.title}</Text>{todo.isDeleted && <Text style={styles.deletedTag}>삭제됨</Text>}</View><Text style={styles.taskReviewTime}>{formatDuration(todo.totalSeconds)}</Text></View><View style={styles.taskRail}><View style={[styles.taskFill, { backgroundColor: reviewColors[index % reviewColors.length], width: `${(todo.totalSeconds / topTodoSeconds) * 100}%` }]} /></View>{(todo.directSeconds > 0 || todo.childSeconds > 0) && <Text style={styles.taskBreakdown}>직접 {formatDuration(todo.directSeconds)}{todo.childSeconds ? ` · 하위 ${formatDuration(todo.childSeconds)}` : ''}</Text>}</View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>아직 회고할 기록이 없습니다</Text><Sub>Focus를 완료하면 이 기간의 시간을 여기서 볼 수 있어요.</Sub></View>}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: pageGutter(), paddingTop: space[5], paddingBottom: 128, gap: space[5], backgroundColor: palette.bg },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  date: { color: palette.muted, fontSize: font.sm, fontWeight: '600' },
  dateStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space[1] }, dayItem: { alignItems: 'center', gap: 4, minWidth: 30 }, dayWeek: { color: palette.muted, fontSize: 10, fontWeight: '600' }, dayNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, dayNumberToday: { backgroundColor: palette.ink }, dayNumberText: { color: palette.ink, fontSize: font.sm, fontWeight: '700' }, dayNumberTextToday: { color: '#fff' },
  startCard: { minHeight: 136, borderRadius: radius.lg, backgroundColor: palette.ink, paddingHorizontal: space[5], paddingVertical: space[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, startCopy: { gap: 2, flex: 1 },
  startTitle: { color: '#fff', fontSize: 39, lineHeight: 44, fontWeight: '600', letterSpacing: -1.8, marginTop: 3, fontVariant: ['tabular-nums'] }, startHint: { color: '#D8D8D6', fontSize: font.xs, fontWeight: '600' }, startPlay: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, startPlayText: { color: palette.ink, fontSize: 15, marginLeft: 2 },
  ledger: { minHeight: 108, justifyContent: 'center', gap: space[3], borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, backgroundColor: palette.card, paddingHorizontal: space[4], paddingVertical: space[3] }, ledgerValues: { flexDirection: 'row', alignItems: 'center' }, ledgerMetric: { flex: 1, gap: 5 }, ledgerLabel: { color: palette.muted, fontSize: font.xs, fontWeight: '700' }, ledgerValue: { color: palette.ink, fontSize: font.xl, fontWeight: '700', letterSpacing: -.5, fontVariant: ['tabular-nums'] }, ledgerDivider: { width: 1, height: 42, backgroundColor: palette.line, marginHorizontal: space[3] }, ledgerRail: { height: 5, borderRadius: radius.pill, backgroundColor: '#E7E7E5', overflow: 'hidden' }, ledgerRailFill: { height: '100%', borderRadius: radius.pill, backgroundColor: palette.ink },
  scheduleSection: { gap: space[2] }, scheduleList: { gap: space[2] }, scheduleRow: { minHeight: 62, borderLeftWidth: 4, borderRadius: radius.sm, paddingHorizontal: space[3], paddingVertical: space[2], flexDirection: 'row', alignItems: 'center', gap: space[3] }, scheduleRowCurrent: { borderWidth: 1, borderColor: palette.ink, borderLeftWidth: 4 }, scheduleTime: { width: 40, color: palette.muted, fontSize: 10, lineHeight: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }, scheduleCopy: { flex: 1, gap: 3 }, scheduleTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' }, scheduleMeta: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, scheduleEmpty: { minHeight: 58, justifyContent: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line }, scheduleEmptyText: { color: palette.muted, fontSize: font.sm },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[1] }, listTitle: { color: palette.ink, fontSize: font.lg, fontWeight: '700', letterSpacing: -.25 }, listMeta: { color: palette.muted, fontSize: font.sm, marginTop: 2 }, addButton: { minHeight: size.touch, paddingHorizontal: space[3], justifyContent: 'center' }, addButtonText: { color: palette.ink, fontSize: font.md, fontWeight: '800' },
  todoList: { borderTopWidth: 1, borderColor: palette.line }, todoRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: space[2], borderBottomWidth: 1, borderColor: palette.line }, checkboxTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.ink, justifyContent: 'center', alignItems: 'center' }, checkboxChecked: { backgroundColor: palette.ink }, checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' }, todoBody: { flex: 1, minWidth: 0, paddingVertical: space[2] }, todoTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' }, todoDone: { color: palette.muted, textDecorationLine: 'line-through' }, todoMeta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: space[1] }, todoPath: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, focusButton: { minHeight: size.touch, minWidth: 42, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.greenSoft }, focusButtonText: { color: palette.ink, fontSize: font.xs, fontWeight: '800' }, empty: { paddingVertical: space[6], gap: space[1] }, emptyTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' },
  segment: { flexDirection: 'row', padding: 2, borderRadius: radius.pill, backgroundColor: palette.greenSoft }, segmentItem: { minWidth: 34, minHeight: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, segmentOn: { backgroundColor: palette.ink }, segmentText: { color: palette.muted, fontSize: font.sm, fontWeight: '700' }, segmentTextOn: { color: '#fff' },
  reviewNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navButton: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' }, navText: { fontSize: 30, color: palette.ink, fontWeight: '300' }, reviewHero: { backgroundColor: palette.mintSoft, borderRadius: radius.lg, padding: space[5], gap: space[2], borderLeftWidth: 4, borderColor: palette.mint }, reviewLabel: { color: palette.mint, fontSize: font.xs, letterSpacing: 1.1, fontWeight: '800' }, reviewTime: { color: palette.ink, fontSize: 42, lineHeight: 48, letterSpacing: -1.6, fontWeight: '600', fontVariant: ['tabular-nums'] }, reviewPlan: { color: palette.muted, fontSize: font.sm, fontWeight: '600' }, reviewRail: { height: 7, borderRadius: radius.pill, backgroundColor: '#E4E4E2', overflow: 'hidden' }, reviewRailFill: { height: '100%', borderRadius: radius.pill, backgroundColor: palette.mint }, reviewFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] }, reviewFootText: { color: palette.muted, fontSize: font.xs, fontWeight: '600' },
  statColumns: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line }, statColumn: { flex: 1, minHeight: 98, justifyContent: 'center', gap: 3 }, statColumnSecond: { borderLeftWidth: 1, borderColor: palette.line, paddingLeft: space[4] }, statValue: { color: palette.ink, fontSize: font.xl, fontWeight: '700', letterSpacing: -.5 },
  breakLine: { flexDirection: 'row', alignItems: 'center', gap: space[2] }, breakText: { color: palette.muted, fontSize: 10, fontWeight: '800' }, breakRail: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: palette.ink, overflow: 'hidden' }, breakFill: { height: '100%', backgroundColor: '#CFCFCD' },
  taskReviewHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space[2] }, taskReview: { borderTopWidth: 1, borderColor: palette.line }, taskReviewItem: { paddingVertical: space[3], borderBottomWidth: 1, borderColor: palette.line, gap: space[2] }, taskReviewHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] }, taskReviewName: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space[1] }, taskColor: { width: 8, height: 8, borderRadius: 4 }, taskReviewTime: { color: palette.ink, fontSize: font.md, fontWeight: '800', fontVariant: ['tabular-nums'] }, taskRail: { height: 5, backgroundColor: palette.greenSoft, overflow: 'hidden', borderRadius: radius.pill }, taskFill: { height: '100%', borderRadius: radius.pill }, taskBreakdown: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, deletedTag: { borderWidth: 1, borderColor: palette.line, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2, color: palette.muted, fontSize: 10, fontWeight: '700' },
});
