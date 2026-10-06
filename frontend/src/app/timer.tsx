import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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

function Dial({ seconds, mode, paused }: { seconds: number; mode: 'countdown' | 'elapsed'; paused: boolean }) {
  const minutes = Math.max(0, Math.min(60, seconds / 60));
  return <View style={s.dial}><Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel={`${Math.ceil(minutes)}분 ${mode === 'countdown' ? '남음' : '경과'}`}>
    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#FAFAFA" stroke={palette.line} strokeWidth="2" />
    <Path d={sector(minutes)} fill={palette.ink} opacity={paused ? 0.38 : 1} />
    {Array.from({ length: 60 }, (_, index) => {
      const outer = polar(index * 6, RADIUS - 5);
      const inner = polar(index * 6, RADIUS - (index % 5 === 0 ? 17 : 11));
      return <Line key={index} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={index % 5 === 0 ? palette.ink : '#A8A8A8'} strokeWidth={index % 5 === 0 ? 1.6 : 0.8} />;
    })}
    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((value) => {
      const point = polar(value * 6, RADIUS - 29);
      return <SvgText key={value} x={point.x} y={point.y + 3} fill={palette.muted} fontSize="10" fontWeight="700" textAnchor="middle">{value === 0 ? '60' : value}</SvgText>;
    })}
    <Circle cx={CENTER} cy={CENTER} r="31" fill="#FFF" stroke={palette.ink} strokeWidth="3" />
    <Circle cx={CENTER} cy={CENTER} r="21" fill={palette.ink} />
    <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - 13} stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
  </Svg></View>;
}

type NextSession = { type: SessionType; todoId: string | null; completedLabel: string };
const typeLabel = (type: SessionType) => type === 'focus' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break';

export default function Timer() {
  const sessions = useMiseStore((x) => x.sessions);
  const settings = useMiseStore((x) => x.settings);
  const start = useMiseStore((x) => x.startSession);
  const pause = useMiseStore((x) => x.pause);
  const resume = useMiseStore((x) => x.resume);
  const continuePastTarget = useMiseStore((x) => x.continuePastTarget);
  const complete = useMiseStore((x) => x.complete);
  const discard = useMiseStore((x) => x.discard);
  const [now, setNow] = useState(Date.now());
  const [manual, setManual] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [next, setNext] = useState<NextSession | null>(null);
  const session = activeSession(sessions);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!session) return;
    const enabled = session.type === 'focus' ? settings.focusNotificationEnabled : settings.breakNotificationEnabled;
    scheduleSessionNotification(session, enabled).catch(() => undefined);
  }, [session?.id, session?.status, settings.focusNotificationEnabled, settings.breakNotificationEnabled]);

  const startNext = async () => {
    if (!next) return;
    const id = await start(next.type, next.todoId);
    if (id) setNext(null);
  };

  if (next) {
    const isBreak = next.type !== 'focus';
    return <SafeAreaView style={s.safe}><View style={s.completeWrap}>
      <Label>{next.completedLabel.toUpperCase()} COMPLETE</Label>
      <Title>{isBreak ? '집중을 마쳤어요.' : '휴식이 끝났어요.'}</Title>
      <Sub>{isBreak ? '다음 단계는 잠깐의 휴식입니다.' : '같은 Todo로 다음 Focus를 이어갈 수 있어요.'}</Sub>
      <View style={s.nextDial}><Text style={s.nextDialText}>{isBreak ? (next.type === 'long_break' ? 'LONG\nBREAK' : 'BREAK') : 'FOCUS'}</Text></View>
      <Button label={`${typeLabel(next.type)} 시작`} onPress={startNext} />
      <Button label="오늘 화면으로" tone="quiet" onPress={() => router.replace('/')} />
    </View></SafeAreaView>;
  }
  if (!session) return <SafeAreaView style={s.center}><Title>활성 세션이 없습니다.</Title><Button label="돌아가기" onPress={() => router.back()} /></SafeAreaView>;

  const elapsed = elapsedSeconds(session, now);
  const reached = elapsed >= session.targetSeconds;
  const shown = settings.timerMode === 'countdown' ? Math.max(0, session.targetSeconds - elapsed) : elapsed;
  const finish = async (mode: CompletionMode, seconds?: number) => {
    await clearSessionNotification(session.id);
    const focusDone = sessions.filter((value) => value.status === 'completed' && value.type === 'focus').length + (session.type === 'focus' ? 1 : 0);
    const nextType: SessionType = session.type === 'focus' ? (focusDone % 4 === 0 ? 'long_break' : 'short_break') : 'focus';
    await complete(mode, seconds);
    setNext({ type: nextType, todoId: session.todoId, completedLabel: typeLabel(session.type) });
  };
  const dismiss = async () => { await clearSessionNotification(session.id); await discard(); router.back(); };

  return <SafeAreaView style={s.safe}><View style={s.wrap}>
    <View style={s.top}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹ 닫기</Text></Pressable><Text style={s.type}>{typeLabel(session.type).toUpperCase()}</Text></View>
    <View style={s.task}><Label>MISE EN PLACE</Label><Title>{session.todoSnapshot?.title ?? (session.type === 'focus' ? '집중 시간' : '휴식 시간')}</Title><Sub>{session.todoSnapshot?.path.join(' › ') ?? '지금 이 시간에만 집중해 보세요.'}</Sub></View>
    <View style={s.clock}><Dial seconds={shown} mode={settings.timerMode} paused={session.status === 'paused'} /><Text style={s.time}>{String(Math.floor(shown / 60)).padStart(2, '0')}:{String(shown % 60).padStart(2, '0')}</Text><Text style={s.caption}>{session.status === 'paused' ? '일시정지' : settings.timerMode === 'countdown' ? '남은 시간' : '경과 시간'}</Text></View>
    <View style={s.meta}><Text style={s.metaText}>목표 {Math.round(session.targetSeconds / 60)}분</Text><Text style={s.dot}>·</Text><Text style={s.metaText}>{reached ? `+${Math.floor((elapsed - session.targetSeconds) / 60)}분 초과` : `${Math.max(0, Math.ceil((session.targetSeconds - elapsed) / 60))}분 남음`}</Text></View>
    {reached && !session.continuedPastTargetAt && <Card style={s.reached}><Title>목표 시간에 도달했어요</Title><Sub>지금까지의 목표만 저장하거나 계속 기록할 수 있어요.</Sub><View style={s.actions}><Button label="목표 저장" onPress={() => finish('target')} /><Button label="계속 기록" tone="quiet" onPress={continuePastTarget} /></View></Card>}
    {reached && session.continuedPastTargetAt && <Sub>목표 시간을 넘겨 계속 기록 중입니다.</Sub>}
    <View style={s.actions}>{session.status === 'running' ? <Button label="일시정지" tone="quiet" onPress={pause} /> : <Button label="재개" onPress={resume} />}<Button label="완료" onPress={() => elapsed < 60 ? Alert.alert('1분 미만', '기록을 저장할까요?', [{ text: '폐기', style: 'destructive', onPress: dismiss }, { text: '저장', onPress: () => finish('actual') }]) : finish('actual')} /></View>
    <View style={s.utility}><Pressable onPress={() => { setMinutes(String(Math.max(1, Math.round(elapsed / 60)))); setManual(true); }}><Text style={s.utilityText}>시간 직접 수정</Text></Pressable><Pressable onPress={() => Alert.alert('세션 폐기', '기록하지 않고 폐기할까요?', [{ text: '취소', style: 'cancel' }, { text: '폐기', style: 'destructive', onPress: dismiss }])}><Text style={s.utilityText}>폐기</Text></Pressable></View>
    <Modal visible={manual} transparent animationType="slide"><View style={s.overlay}><Card style={s.modal}><Title>실제 기록 시간</Title><Sub>측정 시간은 {formatDuration(elapsed)}입니다. 1분에서 24시간 사이로 수정할 수 있어요.</Sub><Field value={minutes} onChangeText={setMinutes} placeholder="분" /><View style={s.actions}><Button label="취소" tone="quiet" onPress={() => setManual(false)} /><Button label="저장" onPress={() => { const value = Number(minutes); if (!Number.isFinite(value) || value < 1 || value > 1440) return; setManual(false); finish('manual', Math.round(value) * 60); }} /></View></Card></View></Modal>
  </View></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg }, wrap: { flex: 1, padding: 24, gap: 14 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.bg }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { fontSize: 16, color: palette.ink, fontWeight: '700' }, type: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1, color: palette.muted }, task: { gap: 4 }, clock: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 360 }, dial: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, time: { fontSize: 34, letterSpacing: -1.5, fontWeight: '800', color: palette.ink, fontVariant: ['tabular-nums'], marginTop: -4 }, caption: { marginTop: 1, color: palette.muted, fontSize: 13, fontWeight: '700' }, meta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }, metaText: { color: palette.muted, fontSize: 13, fontWeight: '700' }, dot: { color: palette.muted }, actions: { flexDirection: 'row', gap: 10 }, utility: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }, utilityText: { color: palette.muted, fontSize: 13, fontWeight: '700', paddingVertical: 8 }, reached: { gap: 9 }, overlay: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: '#0008' }, modal: { gap: 14 }, completeWrap: { flex: 1, justifyContent: 'center', alignItems: 'stretch', padding: 28, gap: 16 }, nextDial: { width: 210, height: 210, alignSelf: 'center', marginVertical: 18, borderRadius: 105, borderWidth: 20, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' }, nextDialText: { color: palette.ink, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
});
