import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Bottom sheets stay above the home indicator and Android gesture bar. */
export function SafeAreaSheet({ children }: PropsWithChildren) {
  return <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0006' },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
});
