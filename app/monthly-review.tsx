import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, money } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';

const monthName = new Intl.DateTimeFormat('zh-CN', { month: 'long' });

export default function MonthlyReview() {
  const router = useRouter();
  const transactions = useFinanceStore((state) => state.transactions);
  const goals = useFinanceStore((state) => state.goals);
  const userName = useFinanceStore((state) => state.userName);
  const now = new Date();
  const currentMonthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const income = currentMonthTransactions.filter((transaction) => transaction.kind === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = currentMonthTransactions.filter((transaction) => transaction.kind === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryTotals = currentMonthTransactions.filter((transaction) => transaction.kind === 'expense').reduce<Record<string, number>>((result, transaction) => {
    result[transaction.category] = (result[transaction.category] ?? 0) + transaction.amount;
    return result;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const goalsSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const primaryGoal = goals.find((goal) => goal.priority === 'primary');
  const net = income - expense;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={s.kicker}>{now.getFullYear()} · {monthName.format(now)}</Text>
        </View>

        <Text style={s.title}>本月回顾</Text>
        <Text style={s.subtitle}>这一个月，你认真照顾了自己的生活。</Text>

        <View style={s.hero}>
          <View>
            <Text style={s.heroLabel}>这个月的自由余量</Text>
            <Text style={s.heroValue}>{money(net)}</Text>
            <Text style={s.heroHint}>{net >= 0 ? '收入覆盖了这个月的支出' : '下个月可以重新调整节奏'}</Text>
          </View>
          <View style={s.heroIcon}>
            <Ionicons name={net >= 0 ? 'sunny-outline' : 'moon-outline'} size={40} color={colors.yellow} />
          </View>
        </View>

        <View style={s.metricRow}>
          <Metric icon="arrow-down-outline" label="本月收入" value={money(income)} color={colors.green} />
          <Metric icon="arrow-up-outline" label="本月支出" value={money(expense)} color={colors.pink} />
          <Metric icon="receipt-outline" label="记录笔数" value={`${currentMonthTransactions.length} 笔`} color={colors.purple} />
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>这一月的去向</Text>
            <Ionicons name="pie-chart-outline" size={20} color={colors.purple} />
          </View>
          {topCategory ? (
            <View style={s.categoryLine}>
              <View style={s.categoryIcon}><Ionicons name="basket-outline" size={21} color={colors.purple} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.categoryTitle}>最常出现的支出：{topCategory[0]}</Text>
                <Text style={s.categoryHint}>给喜欢的生活留一点预算，也是一种安排。</Text>
              </View>
              <Text style={s.categoryValue}>{money(topCategory[1])}</Text>
            </View>
          ) : (
            <Text style={s.empty}>这个月还没有支出记录，随时可以从一笔小记录开始。</Text>
          )}
        </View>

        <View style={[s.card, s.goalCard]}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>正在慢慢靠近</Text>
            <Ionicons name="sparkles-outline" size={20} color={colors.yellow} />
          </View>
          <Text style={s.goalNumber}>{money(goalsSaved)}</Text>
          <Text style={s.goalCopy}>
            {primaryGoal ? `目前正优先靠近「${primaryGoal.title}」。` : '创建一个目标后，它会在这里陪你慢慢长大。'}
          </Text>
        </View>

        <View style={s.message}>
          <Text style={s.messageLamp}>💡</Text>
          <Text style={s.messageText}>{userName}，每一笔记录，都在让生活变得更清楚一点。</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return <View style={s.metric}><Ionicons name={icon} size={18} color={color} /><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={1} style={[s.metricValue, { color }]}>{value}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 42, gap: 16 },
  header: { height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { height: 44, width: 44, borderRadius: 16, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.purple, fontSize: 12, fontWeight: '900', letterSpacing: .6 },
  title: { color: colors.ink, fontSize: 33, fontWeight: '900', marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: -8 },
  hero: { minHeight: 156, backgroundColor: colors.purple, borderWidth: 1.3, borderColor: colors.ink, borderRadius: 27, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: '#EAE4FF', fontSize: 13, fontWeight: '700' },
  heroValue: { color: '#FFF', fontSize: 39, fontWeight: '900', marginTop: 5 },
  heroHint: { color: '#EAE4FF', fontSize: 12, marginTop: 8 },
  heroIcon: { height: 65, width: 65, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  metricRow: { flexDirection: 'row', backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 22, paddingVertical: 15 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  metricValue: { fontSize: 14, fontWeight: '900' },
  card: { backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 22, padding: 17 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 15 },
  categoryIcon: { height: 43, width: 43, borderRadius: 15, backgroundColor: '#E9E2FF', alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  categoryHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  categoryValue: { color: colors.pink, fontWeight: '900', fontSize: 16 },
  empty: { color: colors.muted, textAlign: 'center', lineHeight: 20, paddingVertical: 23 },
  goalCard: { backgroundColor: '#FFF4C6' },
  goalNumber: { color: colors.ink, fontSize: 34, fontWeight: '900', marginTop: 13 },
  goalCopy: { color: '#786132', fontSize: 13, marginTop: 4 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, marginTop: 4 },
  messageLamp: { fontSize: 33 },
  messageText: { color: colors.ink, flex: 1, fontSize: 16, lineHeight: 23, fontWeight: '800' },
});
