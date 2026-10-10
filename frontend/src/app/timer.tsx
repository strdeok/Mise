import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { activeSession, elapsedSeconds, formatDuration } from '@/domain/logic';
import type { CompletionMode, SessionType } from '@/domain/types';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, Card, Field, Label, palette, Sub, Title } from '@/components/mise-ui';
import { clearSessionNotification, scheduleSessionNotification } from '@/notifications/local-notifications';

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

function Dial({ seconds, mode, paused, diameter }: { seconds: number; mode: 'countdown' | 'elapsed'; paused: boolean; diameter: number }) {
  const minutes = Math.max(0, Math.min(60, seconds / 60));
  return <Svg width={diameter} height={diameter} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel={`${Math.ceil(minutes)}분 ${mode === 'countdown' ? '남음' : '경과'}`}>
    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#FFFFFF" stroke={palette.line} strokeWidth="2" />
    <Path d={sector(minutes)} fill={palette.ink} opacity={paused ? 0.38 : 1} />
    {Array.from({ length: 60 }, (_, index) => {
      const outer = polar(index * 6, RADIUS - 5);
      const inner = polar(index * 6, RADIUS - (index % 5 === 0 ? 17 : 11));
      return <Line key={index} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={index % 5 === 0 ? palette.ink : '#A8A8A8'} strokeWidth={index % 5 === 0 ? 1.6 : 0.8} />;
    })}
    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((value) => {
      const point = polar(value * 6, RADIUS - 29);
      const overSector = minutes > 0 && (value === 0 || value <= minutes);
      return <SvgText key={value} x={point.x} y={point.y + 3} fill={overSector && !paused ? '#FFFFFF' : palette.muted} fontSize="10" fontWeight="600" textAnchor="middle">{value === 0 ? '60' : value}</SvgText>;
    })}
    <Circle cx={CENTER} cy={CENTER} r="25" fill="#FFFFFF" stroke={palette.ink} strokeWidth="2" />
    <Circle cx={CENTER} cy={CENTER} r="16" fill={palette.ink} />
    <Line x1={CENTER} y1={CENTER} x2={CENTER + 8} y2={CENTER - 8} stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>;
}

type NextSession = { type: SessionType; todoId: string | null; completedLabel: string };
const typeLabel = (type: SessionType) => type === 'focus' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break';
const timeText = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function Timer() {
  const { width, height } = useWindowDimensions();
  const dialSize = Math.min(width - 72, Math.max(220, height * 0.38), SIZE);
  const fullSquare = Math.max(220, Math.min(width - 16, height - 300));
  const sessions = useMiseStore((x) => x.sessions);
  const settings = useMiseStore((x) => x.settings);
  const prepare = useMiseStore((x) => x.prepareSession);
  const begin = useMiseStore((x) => x.beginSession);
  const pause = useMiseStore((x) => x.pause);
  const resume = useMiseStore((x) => x.resume);
  const continuePastTarget = useMiseStore((x) => x.continuePastTarget);
  const complete = useMiseStore((x) => x.complete);
  const discard = useMiseStore((x) => x.discard);
  const [now, setNow] = useState(Date.now());
  const [manual, setManual] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [next, setNext] = useState<NextSession | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const session = activeSession(sessions);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!session) return;
    const enabled = session.type === 'focus' ? settings.focusNotificationEnabled : settings.breakNotificationEnabled;
    scheduleSessionNotification(session, enabled).catch(() => undefined);
  }, [session?.id, session?.status, settings.focusNotificationEnabled, settings.breakNotificationEnabled]);

  const startNext = async () => {
    if (!next) return;
    const id = await prepare(next.type, next.todoId);
    if (id) { setNext(null); setFullScreen(false); }
  };

  if (next) {
    const isBreak = next.type !== 'focus';
    return <SafeAreaView style={s.safe}><View style={s.completeWrap}>
      <Label>{next.completedLabel.toUpperCase()} COMPLETE</Label>
      <Title>{isBreak ? '집중을 마쳤어요.' : '휴식이 끝났어요.'}</Title>
      <Sub>{isBreak ? '다음 단계는 잠깐의 휴식입니다.' : '같은 Todo로 다음 Focus를 이어갈 수 있어요.'}</Sub>
      <View style={s.nextDial}><Text style={s.nextDialText}>{isBreak ? (next.type === 'long_break' ? 'LONG\nBREAK' : 'BREAK') : 'FOCUS'}</Text></View>
      <Button label={`${typeLabel(next.type)} 타이머 열기`} onPress={startNext} />
      <Button label="오늘 화면으로" tone="quiet" onPress={() => router.replace('/')} />
    </View></SafeAreaView>;
  }
  if (!session) return <SafeAreaView style={s.center}><Title>활성 세션이 없습니다.</Title><Button label="돌아가기" onPress={() => router.back()} /></SafeAreaView>;

  const elapsed = elapsedSeconds(session, now);
  const reached = session.status !== 'ready' && elapsed >= session.targetSeconds;
  const shown = settings.timerMode === 'countdown' ? Math.max(0, session.targetSeconds - elapsed) : elapsed;
  const caption = session.status === 'ready' ? '시작 전' : session.status === 'paused' ? '일시정지' : settings.timerMode === 'countdown' ? '남은 시간' : '경과 시간';
  const finish = async (mode: CompletionMode, seconds?: number) => {
    await clearSessionNotification(session.id);
    const focusDone = sessions.filter((value) => value.status === 'completed' && value.type === 'focus').length + (session.type === 'focus' ? 1 : 0);
    const nextType: SessionType = session.type === 'focus' ? (focusDone % 4 === 0 ? 'long_break' : 'short_break') : 'focus';
    await complete(mode, seconds);
    setNext({ type: nextType, todoId: session.todoId, completedLabel: typeLabel(session.type) });
  };
  const dismiss = async () => { await clearSessionNotification(session.id); await discard(); router.back(); };
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
    <View style={s.fullTop}><Pressable onPress={() => setFullScreen(false)} style={s.topAction}><Text style={s.topActionText}>‹ 축소</Text></Pressable><Text style={s.type}>{typeLabel(session.type).toUpperCase()}</Text></View>
    <View style={s.fullCenter}>{dial(fullSquare - 20)}<Text style={s.fullTime}>{timeText(shown)}</Text><Text style={s.caption}>{caption}</Text></View>
    {targetChoices}
    <View style={s.actions}><View style={s.control}>{primaryControl}</View>{session.status !== 'ready' && <View style={s.control}><Button label="완료" onPress={confirmComplete} /></View>}</View>
  </ScrollView></SafeAreaView>;

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.wrap}>
    <View style={s.top}><Pressable onPress={() => router.back()} style={s.topAction}><Text style={s.back}>‹ 닫기</Text></Pressable><Pressable onPress={() => setFullScreen(true)} style={s.topAction}><Text style={s.topActionText}>전체화면 ⤢</Text></Pressable></View>
    <View style={s.task}><Label>MISE EN PLACE · {typeLabel(session.type).toUpperCase()}</Label><Title>{session.todoSnapshot?.title ?? (session.type === 'focus' ? '집중 시간' : '휴식 시간')}</Title><Sub>{session.todoSnapshot?.path.join(' › ') ?? '지금 이 시간에만 집중해 보세요.'}</Sub></View>
    <View style={s.clock}>{dial(dialSize)}<Text style={s.time}>{timeText(shown)}</Text><Text style={s.caption}>{caption}</Text></View>
    <View style={s.meta}><Text style={s.metaText}>목표 {Math.round(session.targetSeconds / 60)}분</Text><Text style={s.dot}>·</Text><Text style={s.metaText}>{session.status === 'ready' ? '시작 버튼을 누르면 기록됩니다' : reached ? `+${Math.floor((elapsed - session.targetSeconds) / 60)}분 초과` : `${Math.max(0, Math.ceil((session.targetSeconds - elapsed) / 60))}분 남음`}</Text></View>
    {targetChoices}
    {reached && session.continuedPastTargetAt && <Sub>목표 시간을 넘겨 계속 기록 중입니다.</Sub>}
    <View style={s.actions}><View style={s.control}>{primaryControl}</View>{session.status !== 'ready' && <View style={s.control}><Button label="완료" onPress={confirmComplete} /></View>}</View>
    <View style={s.utility}>{session.status !== 'ready' && <Pressable onPress={() => { setMinutes(String(Math.max(1, Math.round(elapsed / 60)))); setManual(true); }}><Text style={s.utilityText}>시간 직접 수정</Text></Pressable>}<Pressable onPress={confirmDiscard}><Text style={s.utilityText}>{session.status === 'ready' ? '취소' : '폐기'}</Text></Pressable></View>
    <Modal visible={manual} transparent animationType="slide"><View style={s.overlay}><Card style={s.modal}><Title>실제 기록 시간</Title><Sub>측정 시간은 {formatDuration(elapsed)}입니다. 1분에서 24시간 사이로 수정할 수 있어요.</Sub><Field value={minutes} onChangeText={setMinutes} placeholder="분" /><View style={s.actions}><Button label="취소" tone="quiet" onPress={() => setManual(false)} /><Button label="저장" onPress={() => { const value = Number(minutes); if (!Number.isFinite(value) || value < 1 || value > 1440) return; setManual(false); finish('manual', Math.round(value) * 60); }} /></View></Card></View></Modal>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  topActionText: { fontSize: 14, color: palette.ink, fontWeight: '600' },
  back: { fontSize: 14, color: palette.ink, fontWeight: '600' },
  type: { fontSize: 11, fontWeight: '600', letterSpacing: 1.1, color: palette.muted },
  task: { gap: 3 },
  clock: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 5, paddingVertical: 8 },
  clockCase: { alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#F0F0EE', borderWidth: 1, borderColor: palette.line },
  time: { marginTop: 10, fontSize: 42, letterSpacing: -1.6, fontWeight: '500', color: palette.ink, fontVariant: ['tabular-nums'] },
  caption: { color: palette.muted, fontSize: 12, fontWeight: '500', letterSpacing: .4 },
  meta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  metaText: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  dot: { color: palette.muted },
  actions: { flexDirection: 'row', gap: 10 },
  control: { flex: 1 },
  utility: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  utilityText: { color: palette.muted, fontSize: 13, fontWeight: '600', paddingVertical: 8 },
  reached: { gap: 9 },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: '#0008' },
  modal: { gap: 14 },
  fullWrap: { flexGrow: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 20, gap: 12 },
  fullTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12 },
  fullTime: { marginTop: 12, fontSize: 56, fontWeight: '500', letterSpacing: -2, color: palette.ink, fontVariant: ['tabular-nums'] },
  completeWrap: { flex: 1, justifyContent: 'center', alignItems: 'stretch', padding: 28, gap: 16 },
  nextDial: { width: 210, height: 210, alignSelf: 'center', marginVertical: 18, borderRadius: 105, borderWidth: 20, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  nextDialText: { color: palette.ink, fontSize: 25, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
});
