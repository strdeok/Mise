import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

export const palette = { bg: '#F7F7F2', card: '#FFFFFF', ink: '#1E2922', muted: '#708075', line: '#E2E7E1', green: '#376B4E', greenSoft: '#E6F0E8', orange: '#DD7A3F', red: '#B95050' };
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ label, onPress, tone = 'primary', disabled = false }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet' | 'danger'; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, tone === 'quiet' && styles.quiet, tone === 'danger' && styles.danger, disabled && styles.disabled]}><Text style={[styles.buttonText, tone === 'quiet' && styles.quietText]}>{label}</Text></Pressable>; }
export function Field({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) { return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#91A097" style={styles.field} />; }
export const Label = ({ children }: PropsWithChildren) => <Text style={styles.label}>{children}</Text>;
export const Title = ({ children }: PropsWithChildren) => <Text style={styles.title}>{children}</Text>;
export const Sub = ({ children }: PropsWithChildren) => <Text style={styles.sub}>{children}</Text>;
const styles = StyleSheet.create({
  card: { backgroundColor: palette.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: palette.line, gap: 10 },
  button: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: palette.green },
  quiet: { backgroundColor: palette.greenSoft }, danger: { backgroundColor: palette.red }, disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 }, quietText: { color: palette.green },
  field: { minHeight: 46, borderWidth: 1, borderColor: palette.line, borderRadius: 12, paddingHorizontal: 12, color: palette.ink, backgroundColor: '#fff' },
  label: { color: palette.green, fontWeight: '700', fontSize: 12, letterSpacing: .4 }, title: { fontSize: 22, color: palette.ink, fontWeight: '800' }, sub: { color: palette.muted, fontSize: 14, lineHeight: 20 },
});
