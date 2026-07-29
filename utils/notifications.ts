import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ReminderPreferences = {
  dailyRecord: boolean;
  payDay: boolean;
  goalDeposit: boolean;
  weeklyReview: boolean;
  time: string;
};

type SyncRemindersInput = ReminderPreferences & { nextIncomeDays: number };

export type ReminderSyncResult = 'scheduled' | 'permission-denied' | 'unsupported';

const channelId = 'one-lamp-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
    ? { hour, minute }
    : { hour: 20, minute: 30 };
}

function androidChannel() {
  return Platform.OS === 'android' ? { channelId } : {};
}

async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.status === 'granted'
    ? current.status
    : (await Notifications.requestPermissionsAsync()).status;
  return finalStatus === 'granted';
}

async function schedule(title: string, body: string, trigger: Notifications.SchedulableNotificationTriggerInput): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { source: 'one-lamp-balance' } },
    trigger,
  });
}

export async function syncReminderNotifications(input: SyncRemindersInput): Promise<ReminderSyncResult> {
  if (Platform.OS === 'web') return 'unsupported';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: '一盏余额提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0],
      sound: undefined,
    });
  }

  if (!(await requestPermission())) return 'permission-denied';

  await Notifications.cancelAllScheduledNotificationsAsync();
  const { hour, minute } = parseTime(input.time);
  const channel = androidChannel();

  if (input.dailyRecord) {
    await schedule('留一盏', '今天的钱，要不要记一下？', {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...channel,
    });
  }

  if (input.goalDeposit) {
    await schedule('给目标留一点', '为正在实现的生活，存下一点吧。', {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour,
      minute,
      ...channel,
    });
  }

  if (input.weeklyReview) {
    await schedule('这一周的光', '看看这周为自己留下了多少。', {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour,
      minute,
      ...channel,
    });
  }

  if (input.payDay && input.nextIncomeDays > 0) {
    const payDay = new Date();
    payDay.setDate(payDay.getDate() + input.nextIncomeDays);
    payDay.setHours(9, 0, 0, 0);
    await schedule('收入日到了', '收入到账后，记得点亮这盏灯。', {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: payDay,
      ...channel,
    });
  }

  return 'scheduled';
}

export async function sendReminderTest(): Promise<ReminderSyncResult> {
  if (Platform.OS === 'web') return 'unsupported';
  if (!(await requestPermission())) return 'permission-denied';
  await Notifications.scheduleNotificationAsync({
    content: { title: '一盏余额', body: '这是一条测试提醒。你的灯会陪你看见还剩多少。' },
    trigger: null,
  });
  return 'scheduled';
}
