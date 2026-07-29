import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';

export default function SettingsScreen() {
  const router = useRouter();
  const userName = useFinanceStore((state) => state.userName);
  const phoneNumber = useFinanceStore((state) => state.phoneNumber);
  const bindPhone = useFinanceStore((state) => state.bindPhone);
  const signOut = useFinanceStore((state) => state.signOut);
  const [bindOpen, setBindOpen] = useState(false);
  const [phone, setPhone] = useState(phoneNumber);

  const savePhone = () => {
    if (!/^1\d{10}$/.test(phone)) { Alert.alert('号码格式不正确', '请输入 11 位手机号。'); return; }
    bindPhone(phone); setBindOpen(false); Alert.alert('已绑定', '手机号已保存在这台设备上。');
  };
  const leave = (mode: 'switch' | 'signout') => Alert.alert(
    mode === 'switch' ? '切换账号' : '退出登录',
    mode === 'switch' ? '切换后会回到欢迎页面。' : '确认退出当前本地账号吗？',
    [{ text: '取消', style: 'cancel' }, { text: mode === 'switch' ? '继续切换' : '退出登录', style: 'destructive', onPress: () => { signOut(); router.replace('/onboarding'); } }],
  );

  const phoneValue = phoneNumber ? `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}` : '未绑定';

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <View style={s.head}><Pressable accessibilityLabel="返回" style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={s.title}>设置</Text><View style={s.blank} /></View>
    <View style={s.profile}><View style={s.avatar}><Text style={s.avatarText}>👩🏻</Text></View><View style={{ flex: 1 }}><Text style={s.name}>{userName}</Text><Text style={s.sub}>一盏余额 · 本地账户</Text></View><Ionicons name="shield-checkmark-outline" size={25} color="#DDF3E2" /></View>
    <Group title="账号与安全"><Row icon="phone-portrait-outline" label="手机号绑定" value={phoneValue} onPress={() => { setPhone(phoneNumber); setBindOpen(true); }} /><Row icon="key-outline" label="登录方式" value="本地登录" onPress={() => Alert.alert('本地账户', '当前版本的数据默认只保存在这台设备中。手机号绑定入口已预留给后续同步与找回。')} /><Row icon="lock-closed-outline" label="隐私与本机数据" value="仅本机保存" onPress={() => router.push('/data-management')} /></Group>
    <Group title="账户操作"><Row icon="swap-horizontal-outline" label="切换账号" onPress={() => leave('switch')} /><Row icon="log-out-outline" label="退出登录" danger onPress={() => leave('signout')} /></Group>
    <Text style={s.version}>一盏余额 v1.0.0</Text>
  </ScrollView><Modal transparent visible={bindOpen} animationType="slide"><View style={s.modal}><Pressable style={{ flex: 1 }} onPress={() => setBindOpen(false)} /><View style={s.sheet}><View style={s.handle} /><Text style={s.sheetTitle}>绑定手机号</Text><Text style={s.sheetCopy}>手机号会保存在这台设备上，用于未来的数据同步与账号找回。</Text><Text style={s.label}>手机号</Text><TextInput value={phone} onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 11))} keyboardType="phone-pad" placeholder="请输入 11 位手机号" placeholderTextColor={colors.muted} style={s.input} /><Pressable style={s.save} onPress={savePhone}><Text style={s.saveText}>确认绑定</Text></Pressable></View></View></Modal></SafeAreaView>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) { return <View style={s.groupWrap}><Text style={s.groupTitle}>{title}</Text><View style={s.group}>{children}</View></View>; }
function Row({ icon, label, value, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; danger?: boolean; onPress: () => void }) { return <Pressable style={s.row} onPress={onPress}><View style={[s.rowIcon, { backgroundColor: danger ? '#FFE2EA' : '#E9E2FF' }]}><Ionicons name={icon} size={19} color={danger ? colors.red : colors.purple} /></View><Text style={[s.rowText, danger && { color: colors.red }]}>{label}</Text>{value ? <Text style={s.rowValue}>{value}</Text> : null}<Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 40, gap: 15 }, head: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { height: 44, width: 44, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, blank: { width: 44 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  profile: { minHeight: 100, borderRadius: 25, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.green, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { height: 62, width: 62, borderRadius: 31, backgroundColor: '#E4E0FF', borderWidth: 1.2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 30 }, name: { color: '#FFF', fontSize: 22, fontWeight: '900' }, sub: { color: '#DDF3E2', fontSize: 13, marginTop: 5 },
  groupWrap: { gap: 8 }, groupTitle: { color: colors.muted, fontSize: 13, fontWeight: '900', marginLeft: 4 }, group: { backgroundColor: colors.paper, borderRadius: 21, borderWidth: 1.2, borderColor: colors.border, paddingHorizontal: 14 }, row: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#EEE9E0' }, rowIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, rowText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '800' }, rowValue: { color: colors.muted, fontSize: 13, marginRight: 3 }, version: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 5 },
  modal: { flex: 1, backgroundColor: 'rgba(21,21,27,.28)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34 }, handle: { height: 5, width: 44, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 15 }, sheetTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' }, sheetCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 }, label: { color: colors.muted, fontWeight: '800', fontSize: 13, marginTop: 19, marginBottom: 7 }, input: { height: 54, borderRadius: 16, borderWidth: 1.2, borderColor: colors.border, paddingHorizontal: 14, backgroundColor: '#FFF', color: colors.ink, fontSize: 16, fontWeight: '700' }, save: { height: 55, borderRadius: 17, backgroundColor: colors.yellow, borderWidth: 1.2, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center', marginTop: 22 }, saveText: { color: colors.ink, fontSize: 16, fontWeight: '900' },
});
