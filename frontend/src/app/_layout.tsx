import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  useEffect(() => {
    const openTimer = (response: Notifications.NotificationResponse | null) => {
      if (response?.notification.request.content.data?.url === '/timer') router.navigate('/timer');
    };
    Notifications.getLastNotificationResponseAsync().then(openTimer).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(openTimer);
    return () => subscription.remove();
  }, []);
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'fade' }}><Stack.Screen name="index" /><Stack.Screen name="timer" options={{ presentation: 'modal' }} /></Stack></>;
}
