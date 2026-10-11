import { useEffect, useState } from 'react';
import { Alert, BackHandler, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { activeSession, elapsedSeconds, formatClock, formatDuration } from '@/domain/logic';
import type { CompletionMode, SessionType } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, Card, SheetCard, Field, Label, palette, Sub, Title } from '@/components/mise-ui';
import { SafeAreaSheet } from '@/components/safe-area-sheet';
import { clearSessionNotification, scheduleSessionNotification } from '@/notifications/local-notifications';
import { CategoryBadge } from '@/components/todo-categories';
import { TimerSettingsSheet } from '@/components/timer-settings-sheet';

const SIZE = 310;
const CENTER = SIZE / 2;
const RADIUS = 126;
const polar = (angle: number, radius: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
};
const sector = (minutes: number) => {
  const sweep = Math.max(0, Math.min(59.99, minutes)) * 6;
  if (!sweep) return '';
  const end = polar(sweep, RADIUS - 17);
  return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - RADIUS + 17} A ${RADIUS - 17} ${RADIUS - 17} 0 ${sweep > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
};

function Dial({ seconds, mode, paused, diameter, immersive = false }: { seconds: number; mode: 'countdown' | 'elapsed'; paused: boolean; diameter: number; immersive?: boolean }) {
  const minutes = Math.max(0, Math.min(60, seconds / 60));
  return <Svg width={diameter} height={diameter} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel={`${Math.ceil(minutes)}분 ${mode === 'countdown' ? '남음' : '경과'}`}>
    <Circle cx={CENTER} cy={CENTER} r={immersive ? RADIUS - 17 : RADIUS} fill={immersive ? palette.greenSoft : palette.card} stroke={immersive ? 'none' : palette.line} strokeWidth="2" />
    <Path d={sector(minutes)} fill={palette.ink} opacity={paused ? 0.38 : 1} />
    {Array.from({ length: 60 }, (_, index) => {
      const outer = polar(index * 6, RADIUS - 5);
      const inner = polar(index * 6, RADIUS - (index % 5 === 0 ? 17 : 11));
      return <Line key={index} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={index % 5 === 0 ? palette.ink : palette.muted} strokeWidth={index % 5 === 0 ? 1.6 : 0.8} />;
    })}
    {!immersive && [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((value) => {
      const point = polar(value * 6, RADIUS - 29);
      const overSector = minutes > 0 && (value === 0 || value <= minutes);
      return <SvgText key={value} x={point.x} y={point.y + 3} fill={overSector && !paused ? '#FFFFFF' : palette.muted} fontSize="10" fontWeight="600" textAnchor="middle">{value === 0 ? '60' : value}</SvgText>;
    })}
    {immersive ? <><Line x1={CENTER} y1={CENTER} x2={polar(minutes * 6, RADIUS - 9).x} y2={polar(minutes * 6, RADIUS - 9).y} stroke={palette.ink} strokeWidth="2" strokeLinecap="round" /><Circle cx={CENTER} cy={CENTER} r="9" fill={palette.card} stroke={palette.ink} strokeWidth="3" /></> : <><Circle cx={CENTER} cy={CENTER} r="25" fill="#FFFFFF" stroke={palette.ink} strokeWidth="2" /><Circle cx={CENTER} cy={CENTER} r="16" fill={palette.ink} /><Line x1={CENTER} y1={CENTER} x2={CENTER + 8} y2={CENTER - 8} stroke="#FFF" strokeWidth="2" strokeLinecap="round" /></>}
  </Svg>;
}

type NextSession = { type: SessionType; todoId: string | null; completedLabel: string };
const typeLabel = (type: SessionType) => type === 'focus' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break';
const timeText = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function Cycle({ type, interval, completed }: { type: SessionType; interval: number; completed: number }) {
  const current = type === 'focus' ? `Focus ${completed % interval + 1}/${interval}` : type === 'long_break' ? 'Long Break' : 'Short Break';
  return <View style={s.cycle} accessibilityLabel={`${current}. Long Break every ${interval} completed Focus sessions`}>
    <View style={[s.cycleDot, type === 'focus' && s.cycleDotActive]}><Text style={[s.cycleText, type === 'focus' && s.cycleTextActive]}>FOCUS</Text></View>
    <Text style={s.cycleArrow}>→</Text>
    <View style={[s.cycleDot, type === 'short_break' && s.cycleDotActive]}><Text style={[s.cycleText, type === 'short_break' && s.cycleTextActive]}>SHORT BREAK</Text></View>
    <Text style={s.cycleRule}>{current} · {interval}회마다 LONG BREAK</Text>
  </View>;
}

export default function Timer() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dialSize = Math.min(width - 72, Math.max(220, height * 0.38), SIZE);
  const landscape = width > height;
  const fullDialSize = Math.max(120, Math.min(520, landscape ? width * .45 : width - 32, height - insets.top - insets.bottom - (landscape ? 110 : 340)));
  const sessions = useMiseStore((x) => x.sessions);
  const todos = useMiseStore((x) => x.todos);
  const blocks = useMiseStore((x) => x.blocks);
  const categories = useMiseStore((x) => x.categories);
  const settings = useMiseStore((x) => x.settings);
  const longBreakInterval = settings.longBreakInterval ?? 4;
  const prepare = useMiseStore((x) => x.prepareSession);
  const begin = useMiseStore((x) => x.beginSession);
  const pause = useMiseStore((x) => x.pause);
  const resume = useMiseStore((x) => x.resume);
  const continuePastTarget = useMiseStore((x) => x.continuePastTarget);
  const complete = useMiseStore((x) => x.complete);
  const discard = useMiseStore((x) => x.discard);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [manual, setManual] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [next, setNext] = useState<NextSession | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const session = activeSession(sessions);
  const sessionBlock = session?.scheduleBlockId ? blocks.find((block) => block.id === session.scheduleBlockId) : undefined;
  const completedFocusCount = sessions.filter((value) => value.status === 'completed' && value.type === 'focus').length;
  const changeFullScreen = setFullScreen;
  const settingsButton = <Pressable accessibilityRole="button" accessibilityLabel="타이머 설정 열기" onPress={() => setSettingsVisible(true)} style={s.topAction}><Text style={s.topActionText}>설정</Text></Pressable>;
  const settingsSheet = <TimerSettingsSheet visible={settingsVisible} close={() => setSettingsVisible(false)} />;

  useEffect(() => {
    if (!selectedTodoId || !todos.some((todo) => todo.id === selectedTodoId && !todo.archivedAt && todo.status === 'open')) {
      setSelectedTodoId(todos.find((todo) => !todo.archivedAt && todo.status === 'open')?.id ?? null);
    }
  }, [todos, selectedTodoId]);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!fullScreen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setFullScreen(false); return true; });
    return () => subscription.remove();
  }, [fullScreen]);
  useEffect(() => {
    if (!session) return;
    const enabled = session.type === 'focus' ? settings.focusNotificationEnabled : settings.breakNotificationEnabled;
    scheduleSessionNotification(session, enabled).catch(() => undefined);
  }, [session?.id, session?.status, settings.focusNotificationEnabled, settings.breakNotificationEnabled]);

  const startNext = async () => {
    if (!next) return;
    const id = await prepare(next.type, next.todoId);
    if (id) { setNext(null); changeFullScreen(false); }
  };

  const startConfiguredFocus = async () => {
    if (!selectedTodoId) return;
    const id = await prepare('focus', selectedTodoId);
    if (!id) return;
    await begin();
  };

  const leaveTimer = () => {
    changeFullScreen(false);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (next) {
    const isBreak = next.type !== 'focus';
    return <SafeAreaView style={s.safe}><View style={s.completeWrap}>
      <View style={s.top}><Label>{next.completedLabel.toUpperCase()} COMPLETE</Label>{settingsButton}</View>
      <Title>{isBreak ? '집중을 마쳤어요.' : '휴식이 끝났어요.'}</Title>
      <Sub>{isBreak ? '다음 단계는 잠깐의 휴식입니다.' : '같은 Todo로 다음 Focus를 이어갈 수 있어요.'}</Sub>
      <View style={s.nextDial}><Text style={s.nextDialText}>{isBreak ? (next.type === 'long_break' ? 'LONG\nBREAK' : 'BREAK') : 'FOCUS'}</Text></View>
      <Button label={`${typeLabel(next.type)} 타이머 열기`} onPress={startNext} />
      <Button label="오늘 화면으로" tone="quiet" onPress={leaveTimer} />
    </View>{settingsSheet}</SafeAreaView>;
  }
  if (!session) {
    const activeTodos = todos.filter((todo) => !todo.archivedAt && todo.status === 'open');
    return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.setupWrap}>
      <View style={s.top}><Pressable onPress={leaveTimer} style={s.topAction}><Text style={s.back}>‹ 닫기</Text></Pressable>{settingsButton}</View>
      <View style={s.task}><Label>MISE EN PLACE · TIMER</Label><Title>집중할 일을 골라보세요</Title><Sub>집중 {settings.defaultFocusMinutes}분 · 짧은 휴식 {settings.shortBreakMinutes}분 · 긴 휴식 {settings.longBreakMinutes}분{'\n'}집중 {longBreakInterval}회마다 긴 휴식</Sub></View>
      <View style={s.setupSection}><View style={s.setupSectionHead}><Text style={s.setupTitle}>집중할 Todo</Text><Text style={s.durationHint}>{activeTodos.length}개 열림</Text></View>{activeTodos.length ? activeTodos.map((todo) => <Pressable key={todo.id} accessibilityRole="radio" accessibilityState={{ selected: selectedTodoId === todo.id }} accessibilityLabel={`${todo.title} 선택`} onPress={() => setSelectedTodoId(todo.id)} style={[s.taskChoice, selectedTodoId === todo.id && s.taskChoiceOn]}><View style={[s.radio, selectedTodoId === todo.id && s.radioOn]} /><View style={s.taskChoiceText}><Text numberOfLines={1} style={s.taskChoiceTitle}>{todo.title}</Text><Text numberOfLines={1} style={s.durationHint}>{todo.parentId ? '하위 Todo' : '프로젝트'}</Text></View><CategoryBadge category={categories.find((category) => category.id === todo.categoryId)} /></Pressable>) : <View style={s.emptyTask}><Text style={s.durationLabel}>먼저 할 일을 만들어 주세요.</Text><Button label="오늘로 이동해 Todo 추가" tone="quiet" onPress={leaveTimer} /></View>}</View>
      <Button label="집중 시작" disabled={!selectedTodoId} onPress={startConfiguredFocus} />
    </ScrollView>{settingsSheet}</SafeAreaView>;
  }

  const elapsed = elapsedSeconds(session, now);
  const reached = session.status !== 'ready' && elapsed >= session.targetSeconds;
  const shown = settings.timerMode === 'countdown' ? Math.max(0, session.targetSeconds - elapsed) : elapsed;
  const caption = session.status === 'ready' ? '시작 전' : session.status === 'paused' ? '일시정지' : settings.timerMode === 'countdown' ? '남은 시간' : '경과 시간';
  const finish = async (mode: CompletionMode, seconds?: number) => {
    await clearSessionNotification(session.id);
    const focusDone = completedFocusCount + (session.type === 'focus' ? 1 : 0);
    const nextType: SessionType = session.type === 'focus' ? (focusDone % longBreakInterval === 0 ? 'long_break' : 'short_break') : 'focus';
    await complete(mode, seconds);
    setNext({ type: nextType, todoId: session.todoId, completedLabel: typeLabel(session.type) });
  };
  const dismiss = async () => { await clearSessionNotification(session.id); await discard(); leaveTimer(); };
  const confirmDiscard = () => {
    if (session.status === 'ready') { dismiss(); return; }
    if (Platform.OS === 'web') { if (window.confirm('기록하지 않고 폐기할까요?')) dismiss(); return; }
    Alert.alert('세션 폐기', '기록하지 않고 폐기할까요?', [{ text: '취소', style: 'cancel' }, { text: '폐기', style: 'destructive', onPress: dismiss }]);
  };
  const confirmComplete = () => {
    if (elapsed >= 60) { finish('actual'); return; }
    if (Platform.OS === 'web') { if (window.confirm('1분 미만의 기록을 저장할까요?')) finish('actual'); else dismiss(); return; }
    Alert.alert('1분 미만', '기록을 저장할까요?', [{ text: '폐기', style: 'destructive', onPress: dismiss }, { text: '저장', onPress: () => finish('actual') }]);
  };
  const primaryControl = session.status === 'ready'
    ? <Button label="시작" onPress={begin} />
    : session.status === 'running'
      ? <Button label="일시정지" tone="quiet" onPress={pause} />
      : <Button label="재개" onPress={resume} />;
  const dial = (diameter: number) => <View style={[s.clockCase, { width: diameter + 20, height: diameter + 20 }]}><Dial seconds={shown} mode={settings.timerMode} paused={session.status === 'paused'} diameter={diameter} /></View>;
  const targetChoices = reached && !session.continuedPastTargetAt && <Card style={s.reached}><Title>목표 시간에 도달했어요</Title><Sub>지금까지의 목표만 저장하거나 계속 기록할 수 있어요.</Sub><View style={s.actions}><Button label="목표 저장" onPress={() => finish('target')} /><Button label="계속 기록" tone="quiet" onPress={continuePastTarget} /></View></Card>;

  if (fullScreen) return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.fullWrap}>
    <View style={s.fullTop}><Pressable accessibilityRole="button" accessibilityLabel="전체화면 나가기" onPress={() => changeFullScreen(false)} style={s.topAction}><Text style={s.fullTopText}>‹ 축소</Text></Pressable><Text style={s.fullType}>{typeLabel(session.type).toUpperCase()}</Text><Pressable accessibilityRole="button" accessibilityLabel="타이머 설정 열기" onPress={() => setSettingsVisible(true)} style={s.topAction}><Text style={s.fullTopText}>설정</Text></Pressable></View>
    <View style={[s.fullCenter, landscape && s.fullLandscape]}>
      <Dial seconds={shown} mode={settings.timerMode} paused={session.status === 'paused'} diameter={fullDialSize} immersive />
      <View style={s.fullReadout}><Text numberOfLines={2} style={s.fullTask}>{session.todoSnapshot?.title ?? (session.type === 'focus' ? '집중 시간' : '잠깐 쉬어가세요')}</Text><Text style={s.fullTime}>{timeText(shown)}</Text><Text style={s.fullCaption}>{caption}{reached ? ` · ${formatDuration(elapsed)} 기록 중` : ` · 목표 ${Math.round(session.targetSeconds / 60)}분`}</Text></View>
    </View>
    {targetChoices}
    <View style={s.fullActions}><Pressable accessibilityRole="button" onPress={session.status === 'ready' ? begin : session.status === 'running' ? pause : resume} style={s.fullPrimary}><Text style={s.fullPrimaryText}>{session.status === 'ready' ? '시작' : session.status === 'running' ? '일시정지' : '재개'}</Text></Pressable>{session.status !== 'ready' && <Pressable accessibilityRole="button" onPress={confirmComplete} style={s.fullSecondary}><Text style={s.fullTopText}>완료</Text></Pressable>}</View>
  </ScrollView>{settingsSheet}</SafeAreaView>;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.wrap}>
    <View style={s.top}><Pressable onPress={leaveTimer} style={s.topAction}><Text style={s.back}>‹ 닫기</Text></Pressable><View style={s.topTools}>{settingsButton}<Pressable onPress={() => changeFullScreen(true)} style={s.topAction}><Text style={s.topActionText}>전체화면 ⤢</Text></Pressable></View></View>
    <View style={s.task}><Label>MISE EN PLACE · {typeLabel(session.type).toUpperCase()}</Label><Title>{session.todoSnapshot?.title ?? (session.type === 'focus' ? '집중 시간' : '휴식 시간')}</Title><Sub>{sessionBlock ? `일정 · ${sessionBlock.title} · ${formatClock(sessionBlock.startMinute)}–${formatClock(sessionBlock.endMinute)}${session.todoSnapshot ? `\nTodo · ${session.todoSnapshot.path.join(' › ')}` : ''}` : session.todoSnapshot?.path.join(' › ') ?? '지금 이 시간에만 집중해 보세요.'}</Sub></View>
    <Cycle type={session.type} interval={longBreakInterval} completed={completedFocusCount} />
    <View style={s.clock}>{dial(dialSize)}<Text style={s.time}>{timeText(shown)}</Text><Text style={s.caption}>{caption}</Text></View>
    <View style={s.meta}><Text style={s.metaText}>목표 {Math.round(session.targetSeconds / 60)}분</Text><Text style={s.dot}>·</Text><Text style={s.metaText}>{session.status === 'ready' ? '시작 버튼을 누르면 기록됩니다' : reached ? `+${Math.floor((elapsed - session.targetSeconds) / 60)}분 초과` : `${Math.max(0, Math.ceil((session.targetSeconds - elapsed) / 60))}분 남음`}</Text></View>
    {targetChoices}
    {reached && session.continuedPastTargetAt && <Sub>목표 시간을 넘겨 계속 기록 중입니다.</Sub>}
    <View style={s.actions}><View style={s.control}>{primaryControl}</View>{session.status !== 'ready' && <View style={s.control}><Button label="완료" onPress={confirmComplete} /></View>}</View>
    <View style={s.utility}>{session.status !== 'ready' && <Pressable onPress={() => { setMinutes(String(Math.max(1, Math.round(elapsed / 60)))); setManual(true); }}><Text style={s.utilityText}>시간 직접 수정</Text></Pressable>}<Pressable onPress={confirmDiscard}><Text style={s.utilityText}>{session.status === 'ready' ? '취소' : '폐기'}</Text></Pressable></View>
    <Modal visible={manual} transparent animationType="slide" onRequestClose={() => setManual(false)}><SafeAreaSheet><SheetCard style={s.modal}><Title>실제 기록 시간</Title><Sub>측정 시간은 {formatDuration(elapsed)}입니다. 1분에서 24시간 사이로 수정할 수 있어요.</Sub><Field value={minutes} onChangeText={setMinutes} placeholder="분" /><View style={s.actions}><Button label="취소" tone="quiet" onPress={() => setManual(false)} /><Button label="저장" onPress={() => { const value = Number(minutes); if (!Number.isFinite(value) || value < 1 || value > 1440) return; setManual(false); finish('manual', Math.round(value) * 60); }} /></View></SheetCard></SafeAreaSheet></Modal>
  </ScrollView>{settingsSheet}</SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  setupWrap: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 20 },
  setupCard: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.line, paddingVertical: 4 },
  setupTitle: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  durationRow: { minHeight: 64, borderBottomWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  durationLabel: { color: palette.ink, fontSize: 15, fontWeight: '600' },
  durationHint: { color: palette.muted, fontSize: 12, fontWeight: '500', marginTop: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: palette.ink, fontSize: 22, fontWeight: '600', lineHeight: 26 },
  durationValue: { minWidth: 52, color: palette.ink, fontSize: 14, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  intervalRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  setupSection: { gap: 8 },
  setupSectionHead: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskChoice: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: palette.line },
  taskChoiceOn: { backgroundColor: palette.greenSoft, paddingHorizontal: 10, borderRadius: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: palette.ink },
  radioOn: { borderWidth: 6 },
  taskChoiceText: { flex: 1, minWidth: 0 },
  taskChoiceTitle: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  emptyTask: { paddingVertical: 12, gap: 8 },
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.bg },
  topTools: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  topActionText: { fontSize: 14, color: palette.ink, fontWeight: '600' },
  back: { fontSize: 14, color: palette.ink, fontWeight: '600' },
  type: { fontSize: 11, fontWeight: '600', letterSpacing: 1.1, color: palette.muted },
  task: { gap: 3 },
  cycle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', alignSelf: 'stretch', gap: 5 },
  cycleDot: { minHeight: 25, paddingHorizontal: 9, borderRadius: 999, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' },
  cycleDotActive: { backgroundColor: palette.ink }, cycleText: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: .4 }, cycleTextActive: { color: '#fff' }, cycleArrow: { color: palette.muted, fontSize: 14 }, cycleRule: { width: '100%', color: palette.muted, fontSize: 11, fontWeight: '600' },
  clock: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 250, gap: 5, paddingVertical: 8 },
  clockCase: { alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F1F1EF', borderWidth: 1, borderColor: palette.line, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  time: { marginTop: 14, fontSize: 46, letterSpacing: -2.2, fontWeight: '600', color: palette.ink, fontVariant: ['tabular-nums'] },
  caption: { color: palette.muted, fontSize: 12, fontWeight: '500', letterSpacing: .4 },
  meta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  metaText: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  dot: { color: palette.muted },
  actions: { flexDirection: 'row', gap: 10 },
  control: { flex: 1 },
  utility: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  utilityText: { color: palette.muted, fontSize: 13, fontWeight: '600', paddingVertical: 8 },
  reached: { gap: 9 },
  modal: { gap: 14 },
  fullWrap: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 16 },
  fullTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingVertical: 16 },
  fullLandscape: { flexDirection: 'row', gap: 32 },
  fullReadout: { alignItems: 'center', gap: 8, maxWidth: '100%', flexShrink: 1 },
  fullTask: { color: palette.ink, fontSize: 17, fontWeight: '500', textAlign: 'center' },
  fullTime: { fontSize: 64, fontWeight: '300', letterSpacing: -2, color: palette.ink, fontVariant: ['tabular-nums'] },
  fullCaption: { color: palette.muted, fontSize: 12, textAlign: 'center' },
  fullType: { color: palette.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.5 },
  fullTopText: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  fullActions: { flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: 400, gap: 12 },
  fullPrimary: { flex: 1, minHeight: 52, borderRadius: 26, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  fullPrimaryText: { color: palette.card, fontSize: 16, fontWeight: '600' },
  fullSecondary: { flex: 1, minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  completeWrap: { flex: 1, justifyContent: 'center', alignItems: 'stretch', padding: 28, gap: 16 },
  nextDial: { width: 210, height: 210, alignSelf: 'center', marginVertical: 18, borderRadius: 105, borderWidth: 20, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  nextDialText: { color: palette.ink, fontSize: 25, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
});
