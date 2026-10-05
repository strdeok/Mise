import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Session, Settings } from '@/domain/types';
import { activeSession, elapsedSeconds } from '@/domain/logic';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
const channelId = 'mise-timer';
export async function notificationPermission() {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channelId, { name: '타이머', importance: Notifications.AndroidImportance.HIGH });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) return 'granted';
  const next = await Notifications.requestPermissionsAsync(); return next.granted ? 'granted' : 'denied';
}
export async function clearSessionNotification(sessionId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.sessionId === sessionId).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
export async function scheduleSessionNotification(session: Session, enabled: boolean) {
  await clearSessionNotification(session.id); if (!enabled || session.status !== 'running') return;
  const remaining = session.targetSeconds - elapsedSeconds(session); if (remaining <= 0) return;
  await Notifications.scheduleNotificationAsync({ content: { title: session.type === 'focus' ? '집중 시간이 끝났어요' : '휴식 시간이 끝났어요', body: '기록을 완료하거나 계속 이어갈 수 있어요.', data: { sessionId: session.id, url: '/timer' }, sound: true }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, remaining), channelId } });
}
export async function reconcileSessionNotifications(sessions: Session[], settings: Settings) {
  const current = activeSession(sessions);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => typeof item.content.data?.sessionId === 'string').map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  if (!current || current.status !== 'running') return;
  const enabled = current.type === 'focus' ? settings.focusNotificationEnabled : settings.breakNotificationEnabled;
  await scheduleSessionNotification(current, enabled);
}
