import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { activeSession } from '@/domain/logic';
import { useMiseStore } from '@/store/use-mise-store';
import { Button, SheetCard, palette, Sub, Title } from './mise-ui';
import { SafeAreaSheet } from './safe-area-sheet';

type TimerSettings = { defaultFocusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; longBreakInterval: number };
const rows: { key: keyof TimerSettings; label: string; unit: string; max: number }[] = [
  { key: 'defaultFocusMinutes', label: '집중', unit: '분', max: 180 },
  { key: 'shortBreakMinutes', label: '짧은 휴식', unit: '분', max: 60 },
  { key: 'longBreakMinutes', label: '긴 휴식', unit: '분', max: 120 },
  { key: 'longBreakInterval', label: '긴 휴식 간격', unit: '회', max: 12 },
];

export function TimerSettingsSheet({ visible, close }: { visible: boolean; close: () => void }) {
  const settings = useMiseStore((state) => state.settings);
  const sessions = useMiseStore((state) => state.sessions);
  const update = useMiseStore((state) => state.updateSettings);
  const [draft, setDraft] = useState<TimerSettings>({ ...settings, longBreakInterval: settings.longBreakInterval ?? 4 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) { setDraft({ ...settings, longBreakInterval: settings.longBreakInterval ?? 4 }); setError(null); }
  }, [visible]);
  const current = activeSession(sessions);
  const save = async () => {
    if (saving) return;
    setSaving(true); setError(null);
    try { await update(draft); close(); }
    catch { setError('설정을 저장하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { if (!saving) close(); }}>
    <SafeAreaSheet><SheetCard style={styles.sheet}>
      <View style={styles.heading}><Title>타이머 설정</Title><Pressable disabled={saving} accessibilityRole="button" accessibilityLabel="타이머 설정 닫기" onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
      <Sub>{current && current.status !== 'ready' ? '시간 변경은 다음 세션부터 적용돼요.' : '설정한 시간으로 집중과 휴식을 이어가세요.'}</Sub>
      {rows.map(({ key, label, unit, max }) => <View key={key} style={styles.row}>
        <View style={styles.label}><Text style={styles.labelText}>{label}</Text>{key === 'longBreakInterval' && <Sub>집중 {draft.longBreakInterval}회 후 긴 휴식</Sub>}</View>
        <View style={styles.stepper}>
          <Pressable disabled={saving || draft[key] <= 1} accessibilityRole="button" accessibilityLabel={`${label} 줄이기`} onPress={() => setDraft((value) => ({ ...value, [key]: Math.max(1, value[key] - 1) }))} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
          <Text style={styles.value}>{draft[key]}{unit}</Text>
          <Pressable disabled={saving || draft[key] >= max} accessibilityRole="button" accessibilityLabel={`${label} 늘리기`} onPress={() => setDraft((value) => ({ ...value, [key]: Math.min(max, value[key] + 1) }))} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
        </View>
      </View>)}
      {error && <Text accessibilityRole="alert" style={styles.labelText}>{error}</Text>}
      <View style={styles.actions}><Button label="취소" tone="quiet" disabled={saving} onPress={close} /><View style={styles.label}><Button label={saving ? '저장 중…' : '설정 저장'} disabled={saving} onPress={save} /></View></View>
    </SheetCard></SafeAreaSheet>
  </Modal>;
}

const styles = StyleSheet.create({
  sheet: { gap: 12 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 28, color: palette.ink },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: palette.line },
  label: { flex: 1, minWidth: 0 }, labelText: { fontSize: 15, fontWeight: '600', color: palette.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 }, step: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.greenSoft, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: palette.ink, fontSize: 22 }, value: { minWidth: 48, textAlign: 'center', color: palette.ink, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 10 },
});
