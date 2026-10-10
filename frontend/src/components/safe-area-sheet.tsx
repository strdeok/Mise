import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Bottom sheets stay above the home indicator and Android gesture bar. */
export function SafeAreaSheet({ children }: PropsWithChildren) {
  return <SafeAreaView edges={['top', 'bottom']} style={styles.overlay}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008' },
  content: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
});
