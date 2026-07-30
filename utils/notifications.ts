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
const webTimers: Array<ReturnType<typeof setTimeout>> = [];

const browserNotification = () =>
  typeof globalThis !== 'undefined' && 'Notification' in globalThis
    ? (globalThis as typeof globalThis & { Notification?: typeof Notification }).Notification
    : undefined;

async function requestWebPermission() {
  const NotificationApi = browserNotification();
  if (!NotificationApi) return false;
  const permission = NotificationApi.permission === 'default'
    ? await NotificationApi.requestPermission()
    : NotificationApi.permission;
  return permission === 'granted';
}

function clearWebTimers() {
  webTimers.splice(0).forEach((timer) => clearTimeout(timer));
}

function scheduleWeb(title: string, body: string, date: Date) {
  const NotificationApi = browserNotification();
  if (!NotificationApi) return;
  const delay = Math.max(0, date.getTime() - Date.now());
  webTimers.push(setTimeout(() => new NotificationApi(title, { body, icon: '/one-lamp-balance-v2/pwa-icon-192.png' }), delay));
}

function nextTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

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
  if (Platform.OS === 'web') {
    if (!(await requestWebPermission())) return 'permission-denied';
    clearWebTimers();
    const { hour, minute } = parseTime(input.time);
    if (input.dailyRecord) scheduleWeb('一盏余额', '今天的钱，要不要记一下？', nextTime(hour, minute));
    if (input.goalDeposit) {
      const date = nextTime(hour, minute);
      date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
      scheduleWeb('给目标留一点', '为正在实现的生活，存下一点吧。', date);
    }
    if (input.weeklyReview) {
      const date = nextTime(hour, minute);
      date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
      scheduleWeb('这一周的光', '看看这周为自己留下了多少。', date);
    }
    if (input.payDay && input.nextIncomeDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + input.nextIncomeDays);
      date.setHours(9, 0, 0, 0);
      scheduleWeb('收入日到了', '收入到账后，记得点亮这盏灯。', date);
    }
    return 'scheduled';
  }

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
  if (Platform.OS === 'web') {
    if (!(await requestWebPermission())) return 'permission-denied';
    const NotificationApi = browserNotification();
    if (!NotificationApi) return 'unsupported';
    new NotificationApi('一盏余额', { body: '这是一条测试提醒。你的灯会陪你看见还剩多少。', icon: '/one-lamp-balance-v2/pwa-icon-192.png' });
    return 'scheduled';
  }
  if (!(await requestPermission())) return 'permission-denied';
  await Notifications.scheduleNotificationAsync({
    content: { title: '一盏余额', body: '这是一条测试提醒。你的灯会陪你看见还剩多少。' },
    trigger: null,
  });
  return 'scheduled';
}
