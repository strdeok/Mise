import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { font, size } from '@/constants/layout';
import { palette } from '@/components/mise-ui';
import { MotionPressable } from '@/components/motion';

export type Tab = 'today' | 'todos' | 'schedule' | 'stats' | 'settings';

const tabs: { id: Tab; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'todos', label: '할 일' },
  { id: 'schedule', label: '일정' },
  { id: 'stats', label: '통계' },
  { id: 'settings', label: '설정' },
];

function TabIcon({ id, selected }: { id: Tab; selected: boolean }) {
  const color = selected ? palette.ink : palette.muted;
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {id === 'today' && (selected
      ? <><Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill={color} /><Path d="M9.5 21v-7h5v7" fill={palette.card} stroke={palette.card} /></>
      : <><Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><Path d="M9 21v-7h6v7" /></>)}
    {id === 'todos' && (selected
      ? <><Rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill={color} /><Path d="m7.5 12 3 3 6-6" stroke={palette.card} strokeWidth={2.1} /></>
      : <><Rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><Path d="m7.5 12 3 3 6-6" /></>)}
    {id === 'schedule' && (selected
      ? <><Rect x="3" y="5" width="18" height="16" rx="2" fill={color} /><Path d="M3 10h18" stroke={palette.card} /><Path d="M8 3v4M16 3v4" /><Rect x="7" y="13" width="3" height="3" rx="0.5" fill={palette.card} stroke="none" /></>
      : <><Rect x="3" y="5" width="18" height="16" rx="2" /><Path d="M3 10h18M8 3v4M16 3v4" /></>)}
    {id === 'stats' && (selected
      ? <><Rect x="4.5" y="13" width="3.5" height="6" rx="0.5" fill={color} stroke="none" /><Rect x="10.25" y="7" width="3.5" height="12" rx="0.5" fill={color} stroke="none" /><Rect x="16" y="10" width="3.5" height="9" rx="0.5" fill={color} stroke="none" /><Path d="M3 21h18" /></>
      : <Path d="M3 21h18M5 18v-5h3v5M10.5 18V7h3v11M16 18v-8h3v8" />)}
    {id === 'settings' && (selected
      ? <><Rect x="3" y="4.5" width="18" height="3" rx="1.5" fill={color} stroke="none" /><Rect x="3" y="10.5" width="18" height="3" rx="1.5" fill={color} stroke="none" /><Rect x="3" y="16.5" width="18" height="3" rx="1.5" fill={color} stroke="none" /><Circle cx="9" cy="6" r="2" fill={palette.card} /><Circle cx="16" cy="12" r="2" fill={palette.card} /><Circle cx="10" cy="18" r="2" fill={palette.card} /></>
      : <><Path d="M4 6h16M4 12h16M4 18h16" /><Circle cx="9" cy="6" r="2" fill={palette.card} /><Circle cx="16" cy="12" r="2" fill={palette.card} /><Circle cx="10" cy="18" r="2" fill={palette.card} /></>)}
  </Svg>;
}

export function BottomTabs({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  return <View style={styles.bar} accessibilityRole="tablist">
    {tabs.map(({ id, label }) => {
      const selected = value === id;
      return <MotionPressable key={id} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} pressedScale={0.95} onPress={() => onChange(id)} style={styles.tab}>
        <TabIcon id={id} selected={selected} />
        <Text style={[styles.label, selected && styles.selected]}>{label}</Text>
      </MotionPressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bar: { height: size.tabBar, borderTopWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: 'row' },
  tab: { flex: 1, minHeight: size.touch, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { color: palette.muted, fontWeight: '500', fontSize: font.xs },
  selected: { color: palette.ink, fontWeight: '700' },
});
