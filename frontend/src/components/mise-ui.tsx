import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';
import { font, radius, size, space } from '@/constants/layout';
import { MotionPressable } from '@/components/motion';

// 기본은 흑백으로 유지하고, 시간과 상태를 빠르게 읽어야 하는 곳에만 절제된 색을 쓴다.
export const palette = {
  bg: '#FAFAF9', card: '#FFFFFF', ink: '#111111', muted: '#686868', line: '#E4E4E2',
  green: '#111111', greenSoft: '#F0F0EE',
  blue: '#3A3A3A', blueSoft: '#F0F0EE',
  mint: '#555555', mintSoft: '#F0F0EE',
  purple: '#707070', purpleSoft: '#F0F0EE',
  orange: '#707070', orangeSoft: '#F0F0EE',
  red: '#333333', redSoft: '#F0F0EE',
};
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function SheetCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style, styles.sheet]}>{children}</View>; }
export function Button({ label, onPress, tone = 'primary', disabled = false }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet' | 'danger'; disabled?: boolean }) { return <MotionPressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.button, tone === 'quiet' && styles.quiet, tone === 'danger' && styles.danger, disabled && styles.disabled]}><Text style={[styles.buttonText, tone === 'quiet' && styles.quietText]}>{label}</Text></MotionPressable>; }
export function Field({ value, onChangeText, placeholder, keyboardType }: { value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: KeyboardTypeOptions }) { return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8A8A8A" keyboardType={keyboardType} style={styles.field} />; }
export const Label = ({ children }: PropsWithChildren) => <Text style={styles.label}>{children}</Text>;
export const Title = ({ children }: PropsWithChildren) => <Text style={styles.title}>{children}</Text>;
export const Sub = ({ children }: PropsWithChildren) => <Text style={styles.sub}>{children}</Text>;
export const PrepLabel = ({ children }: PropsWithChildren) => <View style={styles.prepLabel}><Text style={styles.prepLabelText}>{children}</Text></View>;
export const TimeValue = ({ children }: PropsWithChildren) => <Text style={styles.timeValue}>{children}</Text>;
const styles = StyleSheet.create({
  card: { backgroundColor: palette.card, borderRadius: radius.surface, padding: space[4], borderWidth: 1, borderColor: palette.line, gap: space[2] },
  sheet: { borderRadius: radius.sheet, borderWidth: 0, padding: 20, width: '100%', maxWidth: 600, alignSelf: 'center', shadowColor: '#000', shadowOpacity: .12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  button: { minHeight: size.touch, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[3], backgroundColor: palette.green },
  quiet: { backgroundColor: palette.greenSoft }, danger: { backgroundColor: palette.red }, disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: font.md }, quietText: { color: palette.green },
  field: { minHeight: size.touchLarge, borderWidth: 1, borderColor: palette.line, borderRadius: radius.control, paddingHorizontal: space[3], color: palette.ink, backgroundColor: '#fff' },
  label: { color: palette.muted, fontWeight: '600', fontSize: font.xs, letterSpacing: .8 }, title: { fontSize: font.xl, color: palette.ink, fontWeight: '600', letterSpacing: -0.5 }, sub: { color: palette.muted, fontSize: font.md, lineHeight: 20 },
  prepLabel: { minHeight: 28, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: space[2], borderRadius: radius.pill, backgroundColor: palette.greenSoft },
  prepLabelText: { color: palette.ink, fontSize: font.sm, fontWeight: '700' },
  timeValue: { color: palette.ink, fontSize: font.lg, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
