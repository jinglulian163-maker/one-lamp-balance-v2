import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, Card, colors, money, Section } from '../../components/ui';
import { useFinanceStore } from '../../store/useFinanceStore';

const collectionArt = [
  require('../../assets/generated-collection/collection-camera-v3-smaller-mobile.png'),
  require('../../assets/generated-collection/collection-trip-v2-mobile.png'),
  require('../../assets/generated-collection/collection-concert-v2-mobile.png'),
  require('../../assets/generated-collection/collection-books-v2-mobile.png'),
] as const;
const settingArt = [
  require('../../assets/extracted-settings-cards-hd/setting-calendar-card-hd.png'),
  require('../../assets/extracted-settings-cards-hd/setting-categories-card-hd.png'),
  require('../../assets/extracted-settings-cards-hd/setting-reminders-card-hd.png'),
  require('../../assets/extracted-settings-cards-hd/setting-data-card-hd.png'),
  require('../../assets/extracted-settings-cards-hd/setting-help-card-hd.png'),
] as const;

const settingRows = [
  { label: '收入周期', href: '/income-cycle' },
  { label: '分类管理', href: '/categories' },
  { label: '提醒设置', href: '/reminders' },
  { label: '数据管理', href: '/data-management' },
  { label: '帮助与反馈', href: null },
] as const;

export default function Profile() {
  const router = useRouter();
  const userName = useFinanceStore((state) => state.userName);
  const goals = useFinanceStore((state) => state.goals);
  const collection = useFinanceStore((state) => state.collection);
  const annualSummaryShownYear = useFinanceStore((state) => state.annualSummaryShownYear);
  const saved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const year = new Date().getFullYear();
  const isYearEnd = new Date().getMonth() === 11;

  useEffect(() => {
    if (isYearEnd && annualSummaryShownYear !== year) router.push('/annual-summary');
  }, [annualSummaryShownYear, isYearEnd, router, year]);

  const openAnnual = () => {
    if (isYearEnd) return router.push('/annual-summary');
    Alert.alert('年度总结将在年末出现', '12 月到来时，这棵成果树会带着今年完成的目标自动出现。');
  };
  const openSetting = (href: string | null, label: string) => {
    if (href) return router.push(href as never);
    Alert.alert(label, '这个入口会保留在这里，后续可以继续完善。');
  };

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <View style={s.head}><Text style={s.title}>我的</Text><Pressable style={s.setting} onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={26} color={colors.ink} /></Pressable></View>

      <View style={s.profile}>
        <View style={s.profileTop}><View style={s.avatar}><Text style={s.avatarText}>小</Text></View><View><Text style={s.name}>{userName}</Text><Text style={s.tag}>小步前进，也会到达。</Text></View></View>
        <View style={s.profileLine} />
        <View style={s.stats}><Stat label="累计存入" value={money(saved)} highlight /><Stat label="完成目标" value={String(collection.length)} /><Stat label="点亮天数" value="72" /><Stat label="记录天数" value="14 天" /></View>
      </View>

      <Section title="我的图鉴" action="查看全部" onAction={() => router.push('/collection')}>
        <Card style={s.collectionCard}><View style={s.collectionRow}>{collectionArt.map((source, index) => {
          const item = collection[index];
          return <Pressable key={index} disabled={!item} style={s.collectionItem} onPress={() => item && router.push(`/collection/${item.id}`)}>
            <Image source={source} style={s.collectionArt} /><Text numberOfLines={1} style={s.collectionName}>{item?.title ?? ['相机', '旅行', '演唱会', '书籍'][index]}</Text><Text style={s.collectionDate}>{item ? item.completedAt.slice(0, 10).replace(/-/g, '.') : '等待收集'}</Text>
          </Pressable>;
        })}</View></Card>
      </Section>

      <Pressable style={s.monthly} onPress={() => router.push('/monthly-review')}>
        <View style={s.monthlyIcon}><Ionicons name="calendar-outline" size={23} color={colors.purple} /></View>
        <View style={{ flex: 1 }}><Text style={s.monthlyTitle}>本月回顾</Text><Text style={s.monthlySub}>看看这一个月，钱去了哪里。</Text></View>
        <Ionicons name="chevron-forward" size={22} color={colors.ink} />
      </Pressable>

      <Pressable style={s.year} onPress={openAnnual}>
        <View><Text style={s.yearTitle}>年度总结</Text><Text style={s.yearSub}>年末一起看看，你收获了几颗果实。</Text></View><Text style={s.tree}>🌳</Text><Ionicons name="chevron-forward" size={23} color={colors.ink} /></Pressable>

      <Card style={s.settings}>{settingRows.map((row, index) => <Pressable key={row.label} style={s.row} onPress={() => openSetting(row.href, row.label)}><Image source={settingArt[index]} style={s.rowIcon} /><Text style={s.rowText}>{row.label}</Text><Ionicons name="chevron-forward" size={20} color={colors.ink} /></Pressable>)}</Card>
    </ScrollView>
    <BottomNav />
  </SafeAreaView>;
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <View style={s.stat}><Text style={s.statLabel}>{label}</Text><Text numberOfLines={1} style={[s.statValue, highlight && { color: colors.yellow }]}>{value}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20, paddingBottom: 104, gap: 16 },
  head: { height: 62, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.3 }, setting: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  profile: { height: 174, backgroundColor: colors.green, borderRadius: 22, padding: 16 }, profileTop: { height: 67, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#6A48E1', borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFF', fontSize: 24, fontWeight: '900' }, name: { color: '#FFF', fontSize: 23, fontWeight: '800' }, tag: { color: '#FFF', fontSize: 12, marginTop: 3 }, profileLine: { height: 1, backgroundColor: '#8AB196', marginTop: 13 }, stats: { flexDirection: 'row', marginTop: 13 }, stat: { flex: 1, minWidth: 0, paddingHorizontal: 2 }, statLabel: { color: '#FFF', fontSize: 10 }, statValue: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 5, fontVariant: ['tabular-nums'] },
  collectionCard: { height: 173, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 20 }, collectionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 }, collectionItem: { width: 68, alignItems: 'center' }, collectionArt: { height: 87, width: 68, resizeMode: 'cover', borderRadius: 12 }, collectionName: { color: colors.ink, fontSize: 10, fontWeight: '800', marginTop: 6 }, collectionDate: { color: colors.ink, fontSize: 8, marginTop: 3 },
  monthly: { minHeight: 78, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#E9E2FF', flexDirection: 'row', alignItems: 'center', gap: 12 }, monthlyIcon: { height: 43, width: 43, borderRadius: 15, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, monthlyTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' }, monthlySub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  year: { height: 86, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', gap: 8 }, yearTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' }, yearSub: { color: colors.ink, fontSize: 12, marginTop: 7 }, tree: { marginLeft: 'auto', fontSize: 42 },
  settings: { paddingVertical: 4, borderRadius: 20 }, row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#EEE9E1', paddingHorizontal: 2 }, rowIcon: { width: 24, height: 24, resizeMode: 'contain' }, rowText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
});
