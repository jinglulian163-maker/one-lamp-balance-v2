import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';
import { sendReminderTest, syncReminderNotifications } from '../utils/notifications';
import { daysUntilIncome } from '../utils/date';

export default function RemindersScreen() {
  const router = useRouter();
  const reminders = useFinanceStore((state) => state.reminders);
  const nextIncomeDays = useFinanceStore((state) => state.nextIncomeDays);
  const nextIncomeDate = useFinanceStore((state) => state.nextIncomeDate);
  const updateReminders = useFinanceStore((state) => state.updateReminders);
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(reminders.time);

  const sync = async (next = reminders, showResult = false) => {
    const result = await syncReminderNotifications({ ...next, nextIncomeDays: daysUntilIncome(nextIncomeDate, nextIncomeDays) });
    if (!showResult) return;
    if (result === 'scheduled') Alert.alert('提醒已更新', `已按 ${next.time} 安排你的提醒。`);
    if (result === 'permission-denied') Alert.alert('需要通知权限', '请在手机系统设置中允许“一盏余额”发送通知。');
    if (result === 'unsupported') Alert.alert('请在手机上验证', '浏览器预览不会显示手机系统通知；请用 Expo Go 或安装后的 App 测试。');
  };

  const setReminder = async (key: keyof typeof reminders, value: boolean | string) => {
    const next = { ...reminders, [key]: value } as typeof reminders;
    updateReminders({ [key]: value } as Partial<typeof reminders>);
    await sync(next);
  };

  const saveReminderTime = async () => {
    if (!validTime) {
      Alert.alert('时间格式不正确', '请使用 24 小时制，例如 20:30。');
      return;
    }
    await sync(reminders, true);
  };

  const testNotification = async () => {
    const result = await sendReminderTest();
    if (result === 'scheduled') Alert.alert('测试提醒已发送', '请查看手机的通知中心。');
    if (result === 'permission-denied') Alert.alert('需要通知权限', '请在手机系统设置中允许“一盏余额”发送通知。');
    if (result === 'unsupported') Alert.alert('请在手机上验证', '浏览器预览不会显示手机系统通知；请用 Expo Go 或安装后的 App 测试。');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.head}>
          <Pressable style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
          <Text style={s.title}>提醒设置</Text>
          <View style={s.blank} />
        </View>

        <View style={s.hero}>
          <View style={s.heroIcon}><Ionicons name="notifications-outline" size={29} color={colors.purple} /></View>
          <View style={{ flex: 1 }}><Text style={s.heroTitle}>轻轻提醒，不催促</Text><Text style={s.heroCopy}>你可以决定什么时候收到提醒；关闭后不会打扰你。</Text></View>
        </View>

        <Text style={s.groupTitle}>日常提醒</Text>
        <View style={s.group}>
          <Toggle icon="create-outline" label="每日记录" copy="记下今天的钱去了哪里" value={reminders.dailyRecord} onValueChange={(value) => { void setReminder('dailyRecord', value); }} />
          <Toggle icon="wallet-outline" label="发薪日提醒" copy="收入到账时，记得点亮这盏灯" value={reminders.payDay} onValueChange={(value) => { void setReminder('payDay', value); }} last />
        </View>

        <View style={s.timeCard}>
          <View style={{ flex: 1 }}><Text style={s.timeTitle}>每日提醒时间</Text><Text style={s.timeCopy}>仅在开启每日记录时生效</Text></View>
          <TextInput value={reminders.time} onChangeText={(value) => { void setReminder('time', value.replace(/[^0-9:]/g, '').slice(0, 5)); }} placeholder="20:30" placeholderTextColor={colors.muted} style={s.timeInput} />
          <Pressable style={s.timeSave} onPress={() => { void saveReminderTime(); }}><Text style={s.timeSaveText}>保存</Text></Pressable>
        </View>

        <Text style={s.groupTitle}>计划陪伴</Text>
        <View style={s.group}>
          <Toggle icon="flag-outline" label="目标存入提醒" copy="为当前优先目标留下一点" value={reminders.goalDeposit} onValueChange={(value) => { void setReminder('goalDeposit', value); }} />
          <Toggle icon="sparkles-outline" label="每周回顾" copy="看看这周为自己留下了多少" value={reminders.weeklyReview} onValueChange={(value) => { void setReminder('weeklyReview', value); }} last />
        </View>

        <Pressable style={s.testButton} onPress={() => { void testNotification(); }}><Ionicons name="paper-plane-outline" size={18} color={colors.ink} /><Text style={s.testButtonText}>发送一条测试提醒</Text></Pressable>
        <View style={s.note}><Ionicons name="information-circle-outline" size={18} color="#806014" /><Text style={s.noteText}>手机上保存或切换提醒后会更新系统通知。浏览器预览只显示页面，不能弹出手机通知。</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Toggle({ icon, label, copy, value, onValueChange, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; copy: string; value: boolean; onValueChange: (value: boolean) => void; last?: boolean }) {
  return <View style={[s.row, last && { borderBottomWidth: 0 }]}><View style={s.rowIcon}><Ionicons name={icon} size={19} color={colors.purple} /></View><View style={{ flex: 1 }}><Text style={s.rowTitle}>{label}</Text><Text style={s.rowCopy}>{copy}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#D7D2C7', true: '#B6E08C' }} thumbColor={value ? colors.green : '#FFF'} /></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 38, gap: 15 },
  head: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { height: 44, width: 44, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center' }, blank: { width: 44 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  hero: { borderRadius: 23, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: '#E9E2FF', padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13 }, heroIcon: { height: 54, width: 54, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center' }, heroTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, heroCopy: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  groupTitle: { color: colors.muted, fontSize: 13, fontWeight: '900', marginLeft: 4, marginTop: 4 }, group: { backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 21, paddingHorizontal: 14 }, row: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEE9E0' }, rowIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#E9E2FF', justifyContent: 'center', alignItems: 'center' }, rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, rowCopy: { color: colors.muted, fontSize: 11, marginTop: 4 },
  timeCard: { backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 21, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }, timeTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' }, timeCopy: { color: colors.muted, fontSize: 11, marginTop: 4 }, timeInput: { height: 41, width: 62, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, color: colors.ink, fontWeight: '900', textAlign: 'center' }, timeSave: { height: 41, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.yellow, justifyContent: 'center' }, timeSaveText: { color: colors.ink, fontWeight: '900', fontSize: 13 },
  testButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#E9E2FF', borderWidth: 1.2, borderColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, testButtonText: { color: colors.ink, fontWeight: '900', fontSize: 14 }, note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 13, backgroundColor: '#FFF1B7', borderRadius: 15 }, noteText: { flex: 1, color: '#6F5512', fontSize: 12, lineHeight: 18 },
});
