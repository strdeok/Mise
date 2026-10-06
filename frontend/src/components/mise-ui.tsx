import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { font, radius, size, space } from '@/constants/layout';

// Mise의 주방 도구처럼 선명한 대비를 위해 색 역할을 무채색으로 제한한다.
export const palette = { bg: '#F5F5F5', card: '#FFFFFF', ink: '#111111', muted: '#6B6B6B', line: '#DCDCDC', green: '#111111', greenSoft: '#EAEAEA', orange: '#3D3D3D', red: '#2A2A2A' };
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ label, onPress, tone = 'primary', disabled = false }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet' | 'danger'; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, tone === 'quiet' && styles.quiet, tone === 'danger' && styles.danger, disabled && styles.disabled]}><Text style={[styles.buttonText, tone === 'quiet' && styles.quietText]}>{label}</Text></Pressable>; }
export function Field({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) { return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8A8A8A" style={styles.field} />; }
export const Label = ({ children }: PropsWithChildren) => <Text style={styles.label}>{children}</Text>;
export const Title = ({ children }: PropsWithChildren) => <Text style={styles.title}>{children}</Text>;
export const Sub = ({ children }: PropsWithChildren) => <Text style={styles.sub}>{children}</Text>;
const styles = StyleSheet.create({
  card: { backgroundColor: palette.card, borderRadius: radius.lg, padding: space[4], borderWidth: 1, borderColor: palette.line, gap: space[2] },
  button: { minHeight: size.touch, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[3], backgroundColor: palette.green },
  quiet: { backgroundColor: palette.greenSoft }, danger: { backgroundColor: palette.red }, disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: font.md }, quietText: { color: palette.green },
  field: { minHeight: size.touchLarge, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, paddingHorizontal: space[3], color: palette.ink, backgroundColor: '#fff' },
  label: { color: palette.green, fontWeight: '700', fontSize: font.sm, letterSpacing: .4 }, title: { fontSize: font.xl, color: palette.ink, fontWeight: '800' }, sub: { color: palette.muted, fontSize: font.md, lineHeight: 20 },
});
