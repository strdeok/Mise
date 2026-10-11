import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { activeSession, dateKey, elapsedSeconds, formatClock, formatDuration } from '@/domain/logic';
import { aggregateStats, monthPeriod, movePeriod, weekPeriod } from '@/domain/statistics';
import type { Todo } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Label, palette, Sub, Title } from '@/components/mise-ui';
import { CategoryBadge } from '@/components/todo-categories';
import { TodoMenuButton, type MenuAnchor } from '@/components/todo-actions-sheet';
import { font, pageGutter, radius, size, space } from '@/constants/layout';

const koreanDate = (key: string) => {
  const value = new Date(`${key}T12:00:00`);
  return value.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
};

type TodayProps = {
  onAddTodo: () => void;
  onOpenTodo: (todo: Todo) => void;
  onEditTodo: (todo: Todo) => void;
  onMenu: (todo: Todo, anchor: MenuAnchor) => void;
};

export function TodayBriefing({ onAddTodo, onOpenTodo, onEditTodo: _onEditTodo, onMenu }: TodayProps) {
  const todos = useMiseStore((state) => state.todos);
  const categories = useMiseStore((state) => state.categories);
  const sessions = useMiseStore((state) => state.sessions);
  const blocks = useMiseStore((state) => state.blocks);
  const toggleTodo = useMiseStore((state) => state.toggleTodo);
  const prepareSession = useMiseStore((state) => state.prepareSession);
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
  const active = activeSession(sessions);
  const startFocus = async (todo: Todo) => {
    const id = await prepareSession('focus', todo.id);
    if (id) router.push('/timer');
  };
  const startBlock = async () => {
    if (active) return router.push('/timer');
    if (nowBlock?.todoId) {
      const id = await prepareSession('focus', nowBlock.todoId, nowBlock.id);
      if (id) router.push('/timer');
      return;
    }
    if (openTodos[0]) {
      await startFocus(openTodos[0]);
      return;
    }
    onAddTodo();
  };
  const planRatio = plannedSeconds ? Math.min(1, focusSeconds / plannedSeconds) : 0;

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.eyebrowRow}><Label>MISE EN PLACE</Label><Text style={styles.date}>{koreanDate(key)}</Text></View>
    <View style={styles.heroHeading}><Text style={styles.kicker}>{currentBlock ? 'NOW' : nextBlock ? 'UP NEXT' : 'TODAY'}</Text><Title>{nowBlock?.title ?? (openTodos[0]?.title ?? '오늘의 한 가지를 시작해 보세요.')}</Title><Sub>{nowBlock ? `${formatClock(nowBlock.startMinute)}–${formatClock(nowBlock.endMinute)} · ${nowBlock.todoId ? '연결된 Todo' : 'Todo를 선택해 집중할 수 있어요'}` : `${openTodos.length}개의 열린 Todo가 기다리고 있어요.`}</Sub></View>
    <Pressable accessibilityRole="button" accessibilityLabel="집중 시작" onPress={startBlock} style={styles.startCard}>
      <View><Text style={styles.startLabel}>{active ? '진행 중인 타이머' : nowBlock ? '이 일정으로 집중' : '바로 집중하기'}</Text><Text style={styles.startTitle}>{active ? formatDuration(elapsedSeconds(active)) : '집중 시작'}</Text></View><Text style={styles.startArrow}>→</Text>
    </Pressable>
    <View style={styles.ledger}>
      <View style={styles.ledgerHeading}><Text style={styles.ledgerTitle}>오늘의 시간</Text><Text style={styles.ledgerMeta}>{plannedSeconds ? `계획 ${formatDuration(plannedSeconds)}` : '계획 없음'}</Text></View>
      <View style={styles.rail}><View style={[styles.railFill, { width: `${planRatio * 100}%` }]} /></View>
      <View style={styles.ledgerFooter}><Text style={styles.ledgerNumber}>{focusSeconds ? formatDuration(focusSeconds) : '0분'}</Text><Text style={styles.ledgerMeta}>기록됨</Text><Text style={styles.ledgerMeta}>{todayBlocks.length ? `다음 ${nextBlock ? formatClock(nextBlock.startMinute) : '없음'}` : '일정 없음'}</Text></View>
    </View>
    <View style={styles.listHeader}><View><Text style={styles.listTitle}>오늘 할 일</Text><Text style={styles.listMeta}>{completedCount} 완료 · {openTodos.length} 남음</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Todo 추가" onPress={onAddTodo} style={styles.addButton}><Text style={styles.addButtonText}>+ 추가</Text></Pressable></View>
    <View style={styles.todoList}>{todayTodos.length ? todayTodos.map((todo) => <View key={todo.id} style={styles.todoRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.status === 'completed' }} accessibilityLabel={`${todo.title} 완료 전환`} onPress={() => toggleTodo(todo.id)} style={[styles.checkbox, todo.status === 'completed' && styles.checkboxChecked]}>{todo.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}</Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} 상세 보기`} style={styles.todoBody} onPress={() => onOpenTodo(todo)}><Text numberOfLines={1} style={[styles.todoTitle, todo.status === 'completed' && styles.todoDone]}>{todo.title}</Text><View style={styles.todoMeta}><Text style={styles.todoPath}>{todo.parentId ? '하위 Todo' : '프로젝트'}</Text><CategoryBadge category={categories.find((category) => category.id === todo.categoryId)} /></View></Pressable>
      {todo.status === 'open' && <Pressable accessibilityRole="button" accessibilityLabel={`${todo.title} 집중 시작`} onPress={() => startFocus(todo)} style={styles.focusButton}><Text style={styles.focusButtonText}>집중</Text></Pressable>}
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
    <View style={styles.reviewHero}><Text style={styles.reviewLabel}>계획 대비 실제 집중</Text><Text style={styles.reviewTime}>{formatDuration(stats.focusSeconds)}</Text><Text style={styles.reviewPlan}>계획 {formatDuration(stats.plannedSeconds)}</Text><View style={styles.reviewRail}><View style={[styles.reviewRailFill, { width: `${plannedRatio * 100}%` }]} /></View><View style={styles.reviewFoot}><Text style={styles.reviewFootText}>{stats.focusSeconds >= stats.plannedSeconds ? '계획한 시간만큼 채웠어요.' : `${formatDuration(Math.max(0, stats.plannedSeconds - stats.focusSeconds))} 남았어요.`}</Text><Text style={styles.reviewFootText}>{Math.round(plannedRatio * 100)}%</Text></View></View>
    <View style={styles.statColumns}><View style={styles.statColumn}><Label>계획 안</Label><Text style={styles.statValue}>{formatDuration(stats.plannedFocusSeconds)}</Text><Sub>일정에서 시작</Sub></View><View style={[styles.statColumn, styles.statColumnSecond]}><Label>계획 밖</Label><Text style={styles.statValue}>{formatDuration(stats.unplannedFocusSeconds)}</Text><Sub>바로 시작</Sub></View></View>
    <View style={styles.breakLine}><Text style={styles.breakText}>FOCUS {formatDuration(stats.focusSeconds)}</Text><View style={styles.breakRail}><View style={[styles.breakFill, { width: `${breakRatio * 100}%` }]} /></View><Text style={styles.breakText}>BREAK {formatDuration(stats.breakSeconds)}</Text></View>
    <View style={styles.taskReviewHeader}><Text style={styles.listTitle}>어디에 썼나요</Text><Text style={styles.listMeta}>{stats.byTodo.length}개 Todo</Text></View>
    <View style={styles.taskReview}>{stats.byTodo.length ? stats.byTodo.map((todo) => <View key={todo.id} style={styles.taskReviewItem}><View style={styles.taskReviewHead}><View style={styles.taskReviewName}><Text numberOfLines={1} style={styles.todoTitle}>{todo.title}</Text>{todo.isDeleted && <Text style={styles.deletedTag}>삭제됨</Text>}</View><Text style={styles.taskReviewTime}>{formatDuration(todo.totalSeconds)}</Text></View><View style={styles.taskRail}><View style={[styles.taskFill, { width: `${(todo.totalSeconds / topTodoSeconds) * 100}%` }]} /></View>{(todo.directSeconds > 0 || todo.childSeconds > 0) && <Text style={styles.taskBreakdown}>직접 {formatDuration(todo.directSeconds)}{todo.childSeconds ? ` · 하위 ${formatDuration(todo.childSeconds)}` : ''}</Text>}</View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>아직 회고할 기록이 없습니다</Text><Sub>Focus를 완료하면 이 기간의 시간을 여기서 볼 수 있어요.</Sub></View>}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: pageGutter(), paddingTop: space[5], paddingBottom: 128, gap: space[5], backgroundColor: palette.bg },
  eyebrowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: palette.muted, fontSize: font.sm, fontWeight: '600' },
  heroHeading: { gap: space[1] }, kicker: { color: palette.muted, fontSize: font.xs, letterSpacing: 1.3, fontWeight: '800' },
  startCard: { minHeight: 98, borderRadius: radius.lg, backgroundColor: palette.ink, paddingHorizontal: space[5], paddingVertical: space[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startLabel: { color: '#BDBDBB', fontSize: font.sm, fontWeight: '700' }, startTitle: { color: '#fff', fontSize: font.xl, fontWeight: '700', letterSpacing: -.4, marginTop: 3 }, startArrow: { color: '#fff', fontSize: 28, fontWeight: '300' },
  ledger: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line, paddingVertical: space[3], gap: space[2] }, ledgerHeading: { flexDirection: 'row', justifyContent: 'space-between' }, ledgerTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' }, ledgerMeta: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, rail: { height: 7, borderRadius: radius.pill, backgroundColor: palette.greenSoft, overflow: 'hidden' }, railFill: { height: '100%', borderRadius: radius.pill, backgroundColor: palette.ink }, ledgerFooter: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] }, ledgerNumber: { color: palette.ink, fontSize: font.xl, fontWeight: '700', letterSpacing: -.6, marginRight: 'auto' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[1] }, listTitle: { color: palette.ink, fontSize: font.lg, fontWeight: '700', letterSpacing: -.25 }, listMeta: { color: palette.muted, fontSize: font.sm, marginTop: 2 }, addButton: { minHeight: size.touch, paddingHorizontal: space[3], justifyContent: 'center' }, addButtonText: { color: palette.ink, fontSize: font.md, fontWeight: '800' },
  todoList: { borderTopWidth: 1, borderColor: palette.line }, todoRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: space[2], borderBottomWidth: 1, borderColor: palette.line }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: palette.ink, justifyContent: 'center', alignItems: 'center' }, checkboxChecked: { backgroundColor: palette.ink }, checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' }, todoBody: { flex: 1, minWidth: 0, paddingVertical: space[2] }, todoTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' }, todoDone: { color: palette.muted, textDecorationLine: 'line-through' }, todoMeta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: space[1] }, todoPath: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, focusButton: { minHeight: size.touch, minWidth: 42, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.greenSoft }, focusButtonText: { color: palette.ink, fontSize: font.xs, fontWeight: '800' }, empty: { paddingVertical: space[6], gap: space[1] }, emptyTitle: { color: palette.ink, fontSize: font.md, fontWeight: '700' },
  segment: { flexDirection: 'row', padding: 2, borderRadius: radius.pill, backgroundColor: palette.greenSoft }, segmentItem: { minWidth: 34, minHeight: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, segmentOn: { backgroundColor: palette.ink }, segmentText: { color: palette.muted, fontSize: font.sm, fontWeight: '700' }, segmentTextOn: { color: '#fff' },
  reviewNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navButton: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' }, navText: { fontSize: 30, color: palette.ink, fontWeight: '300' }, reviewHero: { backgroundColor: palette.ink, borderRadius: radius.lg, padding: space[5], gap: space[2] }, reviewLabel: { color: '#BDBDBB', fontSize: font.xs, letterSpacing: 1.1, fontWeight: '800' }, reviewTime: { color: '#fff', fontSize: 42, lineHeight: 48, letterSpacing: -1.6, fontWeight: '600', fontVariant: ['tabular-nums'] }, reviewPlan: { color: '#BDBDBB', fontSize: font.sm, fontWeight: '600' }, reviewRail: { height: 7, borderRadius: radius.pill, backgroundColor: '#4A4A4A', overflow: 'hidden' }, reviewRailFill: { height: '100%', borderRadius: radius.pill, backgroundColor: '#fff' }, reviewFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] }, reviewFootText: { color: '#BDBDBB', fontSize: font.xs, fontWeight: '600' },
  statColumns: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line }, statColumn: { flex: 1, minHeight: 98, justifyContent: 'center', gap: 3 }, statColumnSecond: { borderLeftWidth: 1, borderColor: palette.line, paddingLeft: space[4] }, statValue: { color: palette.ink, fontSize: font.xl, fontWeight: '700', letterSpacing: -.5 },
  breakLine: { flexDirection: 'row', alignItems: 'center', gap: space[2] }, breakText: { color: palette.muted, fontSize: 10, fontWeight: '800' }, breakRail: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: palette.ink, overflow: 'hidden' }, breakFill: { height: '100%', backgroundColor: '#CFCFCD' },
  taskReviewHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space[2] }, taskReview: { borderTopWidth: 1, borderColor: palette.line }, taskReviewItem: { paddingVertical: space[3], borderBottomWidth: 1, borderColor: palette.line, gap: space[2] }, taskReviewHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] }, taskReviewName: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space[1] }, taskReviewTime: { color: palette.ink, fontSize: font.md, fontWeight: '800', fontVariant: ['tabular-nums'] }, taskRail: { height: 5, backgroundColor: palette.greenSoft, overflow: 'hidden', borderRadius: radius.pill }, taskFill: { height: '100%', backgroundColor: palette.ink, borderRadius: radius.pill }, taskBreakdown: { color: palette.muted, fontSize: font.xs, fontWeight: '600' }, deletedTag: { borderWidth: 1, borderColor: palette.line, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2, color: palette.muted, fontSize: 10, fontWeight: '700' },
});
