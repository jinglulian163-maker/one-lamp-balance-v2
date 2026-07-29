import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';
import { exportFinanceBackup } from '../utils/dataExport';

export default function DataManagement() {
  const router = useRouter();
  const store = useFinanceStore();

  const exportData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: '一盏余额',
      transactions: store.transactions,
      goals: store.goals,
      collection: store.collection,
      categories: { income: store.incomeCategories, expense: store.expenseCategories },
    };
    try {
      const result = await exportFinanceBackup(payload);
      Alert.alert(
        result === 'downloaded' ? '备份已下载' : '备份已准备好',
        result === 'downloaded' ? 'JSON 文件已保存到浏览器下载目录。' : '请在系统分享面板中选择安全的位置保存。',
      );
    } catch {
      Alert.alert('暂时无法导出', '请稍后再试。');
    }
  };

  const restore = () => Alert.alert('恢复示例数据', '这会替换当前的收支、目标和图鉴，仅用于体验功能。', [
    { text: '取消', style: 'cancel' },
    { text: '恢复', onPress: () => { store.restoreDemoData(); Alert.alert('已恢复', '示例数据已重新载入。'); } },
  ]);

  const clear = () => Alert.alert('清除财务记录', '这会清空收支、目标和图鉴，但保留账号与提醒设置。此操作无法撤销。', [
    { text: '取消', style: 'cancel' },
    { text: '清除', style: 'destructive', onPress: () => { store.resetFinancialData(); Alert.alert('已清除', '财务记录已清空。'); } },
  ]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <View style={s.head}><Pressable accessibilityLabel="返回" style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={s.title}>数据管理</Text><View style={s.blank} /></View>
    <View style={s.hero}><View style={s.heroIcon}><Ionicons name="shield-checkmark-outline" size={30} color={colors.green} /></View><View style={{ flex: 1 }}><Text style={s.heroTitle}>你的记录，只属于你</Text><Text style={s.heroCopy}>数据目前只保存在这台设备中。需要保留时，随时导出一份备份。</Text></View></View>
    <Group title="数据备份"><Row icon="download-outline" label="导出数据备份" copy="网页下载 JSON 文件；手机打开系统分享面板" onPress={exportData} /></Group>
    <Group title="数据维护"><Row icon="refresh-outline" label="恢复示例数据" copy="重新载入演示用的收支与目标" onPress={restore} /><Row icon="trash-outline" label="清除财务记录" copy="清空收支、目标与图鉴" danger onPress={clear} /></Group>
    <View style={s.note}><Ionicons name="information-circle-outline" size={18} color="#806014" /><Text style={s.noteText}>导出文件包含财务信息。请仅保存到自己信任的位置，不要发送给陌生人。</Text></View>
  </ScrollView></SafeAreaView>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) { return <View style={s.groupWrap}><Text style={s.groupTitle}>{title}</Text><View style={s.group}>{children}</View></View>; }
function Row({ icon, label, copy, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; copy: string; danger?: boolean; onPress: () => void }) { return <Pressable style={s.row} onPress={onPress}><View style={[s.rowIcon, { backgroundColor: danger ? '#FFE2EA' : '#E9E2FF' }]}><Ionicons name={icon} size={19} color={danger ? colors.red : colors.purple} /></View><View style={{ flex: 1 }}><Text style={[s.rowTitle, danger && { color: colors.red }]}>{label}</Text><Text style={s.rowCopy}>{copy}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>; }
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 38, gap: 16 },
  head: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, borderRadius: 16, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, blank: { width: 44 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  hero: { backgroundColor: '#DDF2DD', borderWidth: 1.2, borderColor: colors.ink, borderRadius: 23, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13 }, heroIcon: { width: 55, height: 55, borderRadius: 19, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center' }, heroTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, heroCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  groupWrap: { gap: 8 }, groupTitle: { color: colors.muted, fontSize: 13, fontWeight: '900', marginLeft: 4 }, group: { backgroundColor: colors.paper, borderRadius: 21, borderWidth: 1.2, borderColor: colors.border, paddingHorizontal: 14 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EEE9E0' }, rowIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' }, rowCopy: { color: colors.muted, fontSize: 11, marginTop: 4 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 13, backgroundColor: '#FFF1B7', borderRadius: 15 }, noteText: { flex: 1, color: '#6F5512', fontSize: 12, lineHeight: 18 },
});
