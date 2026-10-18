import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { palette } from '@/components/mise-ui';
import { useMiseStore } from '@/store/use-mise-store';

export default function RootLayout() {
  const hydrated = useMiseStore((state) => state.hydrated);
  const error = useMiseStore((state) => state.error);
  const hydrate = useMiseStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    const openTimer = (response: Notifications.NotificationResponse | null) => {
      if (response?.notification.request.content.data?.url === '/timer') router.navigate('/timer');
    };
    Notifications.getLastNotificationResponseAsync().then(openTimer).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(openTimer);
    return () => subscription.remove();
  }, [hydrated]);
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><StatusBar style="dark" />{!hydrated ? <View style={styles.loading}><ActivityIndicator color={palette.ink} /><Text style={styles.message}>{error ?? '저장된 데이터를 불러오고 있어요.'}</Text>{error && <Pressable accessibilityRole="button" onPress={() => void hydrate()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable>}</View> : <Stack screenOptions={{ headerShown: false, animation: 'fade' }}><Stack.Screen name="index" /><Stack.Screen name="timer" options={{ presentation: 'card', animation: 'slide_from_right' }} /><Stack.Screen name="todo-form" options={{ presentation: 'card', animation: 'slide_from_right' }} /></Stack>}</SafeAreaProvider></GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: palette.bg },
  message: { color: palette.ink, fontSize: 16, textAlign: 'center' },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: palette.ink, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
