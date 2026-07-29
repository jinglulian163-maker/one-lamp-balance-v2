import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomNav, Card, colors, Lamp, money, Section } from '../../components/ui';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TransactionKind } from '../../types/finance';

export default function Home() {
  const { userName, initialBalance, referenceBalance, nextIncomeDays, transactions, addTransaction, incomeCategories, expenseCategories } = useFinanceStore();
  const [kind, setKind] = useState<TransactionKind | null>(null);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const income = useMemo(() => transactions.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const expense = useMemo(() => transactions.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const balance = Math.max(0, initialBalance + income - expense);
  const ratio = balance / Math.max(referenceBalance, 1);
  const level: 1 | 2 | 3 | 4 = ratio >= .75 ? 4 : ratio >= .5 ? 3 : ratio >= .25 ? 2 : 1;
  const categories = kind === 'income' ? incomeCategories : expenseCategories;
  const openRecord = (nextKind: TransactionKind) => {
    setKind(nextKind);
    setCategory(nextKind === 'income' ? incomeCategories[0] ?? '' : expenseCategories[0] ?? '');
  };
  const save = () => {
    const value = Number(amount);
    if (!kind || !Number.isFinite(value) || value <= 0) return;
    addTransaction(kind, value, title.trim() || (kind === 'income' ? '新增收入' : '新增支出'), category || (kind === 'income' ? '其他收入' : '其他支出'));
    setAmount(''); setTitle(''); setCategory(''); setKind(null);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <View style={s.avatar}><Text style={s.avatarText}>小</Text></View>
          <Text style={s.hello}>你好，{userName} 👋</Text>
          <View style={s.headSpacer} />
          <Pressable accessibilityLabel="通知" style={s.bell}>
            <Ionicons name="notifications-outline" size={27} color={colors.ink} />
            <View style={s.dot} />
          </Pressable>
        </View>

        <View style={s.balance}>
          <Text style={s.balanceLabel}>当前余额</Text>
          <Text style={s.balanceMoney}>{money(balance, 2)}</Text>
          <View style={s.levelBadge}><Text style={s.levelBadgeText}>余额亮度 · {level} 档</Text></View>
          <View style={s.lamp}><Lamp level={level} /></View>
        </View>

        <Card style={s.stats}>
          <Stat title="本月收入" value={money(income, 2)} color={colors.green} />
          <View style={s.sep} />
          <Stat title="本月支出" value={money(expense, 2)} color={colors.red} />
          <View style={s.sep} />
          <Stat title="距下次收入" value={`${nextIncomeDays} 天`} color={colors.purple} />
        </Card>

        <View style={s.actions}>
          <Pressable style={[s.action, { backgroundColor: colors.yellow }]} onPress={() => openRecord('income')}>
            <Ionicons name="add" size={27} color={colors.ink} /><Text style={s.actionText}>记收入</Text>
          </Pressable>
          <Pressable style={[s.action, { backgroundColor: colors.pink }]} onPress={() => openRecord('expense')}>
            <Ionicons name="remove" size={27} color={colors.ink} /><Text style={s.actionText}>记支出</Text>
          </Pressable>
        </View>

        <Section title="最近记录" action="查看全部">
          <Card style={s.records}>
            {transactions.length ? transactions.slice(0, 3).map((item) => (
              <View style={s.record} key={item.id}>
                <View style={[s.recordIcon, { backgroundColor: item.kind === 'income' ? '#DCEFD8' : '#E9E2FF' }]}>
                  <Ionicons name={item.kind === 'income' ? 'wallet-outline' : 'restaurant-outline'} size={21} color={item.kind === 'income' ? colors.green : colors.purple} />
                </View>
                <View style={s.recordCopy}><Text style={s.recordTitle}>{item.title}</Text><Text style={s.recordMeta}>{item.category}</Text></View>
                <Text style={[s.recordMoney, { color: item.kind === 'income' ? colors.green : colors.red }]}>{item.kind === 'income' ? '+' : '−'}{money(item.amount)}</Text>
              </View>
            )) : <Text style={s.empty}>今天还没有记录，先记下一笔收入或支出吧。</Text>}
          </Card>
        </Section>
      </ScrollView>

      <BottomNav />
      <RecordSheet kind={kind} amount={amount} title={title} category={category} categories={categories} onAmount={setAmount} onTitle={setTitle} onCategory={setCategory} onClose={() => setKind(null)} onSave={save} />
    </SafeAreaView>
  );
}

function Stat({ title, value, color }: { title: string; value: string; color: string }) {
  return <View style={s.stat}><Text style={s.statTitle}>{title}</Text><Text numberOfLines={1} style={[s.statValue, { color }]}>{value}</Text></View>;
}

function RecordSheet({ kind, amount, title, category, categories, onAmount, onTitle, onCategory, onClose, onSave }: {
  kind: TransactionKind | null; amount: string; title: string; category: string; categories: string[];
  onAmount: (value: string) => void; onTitle: (value: string) => void; onCategory: (value: string) => void; onClose: () => void; onSave: () => void;
}) {
  return <Modal transparent visible={kind !== null} animationType="slide" onRequestClose={onClose}>
    <View style={s.modal}><Pressable style={s.dismiss} onPress={onClose} /><View style={s.sheet}>
      <View style={s.handle} /><Text style={s.sheetTitle}>{kind === 'income' ? '记一笔收入' : '记一笔支出'}</Text>
      <Text style={s.field}>金额</Text><TextInput value={amount} onChangeText={(value) => onAmount(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="¥ 0.00" placeholderTextColor={colors.muted} style={s.input} />
      <Text style={s.field}>名称</Text><TextInput value={title} onChangeText={onTitle} placeholder={kind === 'income' ? '例如：兼职收入' : '例如：午餐'} placeholderTextColor={colors.muted} style={s.input} />
      <Text style={s.field}>分类</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>{categories.map((item) => <Pressable key={item} onPress={() => onCategory(item)} style={[s.category, category === item && (kind === 'income' ? s.categoryIncome : s.categoryExpense)]}><Text style={[s.categoryText, category === item && s.categoryTextOn]}>{item}</Text></Pressable>)}</ScrollView>
      <Pressable style={[s.save, { backgroundColor: kind === 'income' ? colors.yellow : colors.pink }]} onPress={onSave}><Text style={s.actionText}>保存记录</Text></Pressable>
    </View></View>
  </Modal>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 20, paddingBottom: 104, gap: 16 },
  head: { height: 62, flexDirection: 'row', alignItems: 'center', gap: 11 }, avatar: { height: 52, width: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.ink, backgroundColor: '#E6E0FF', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.purple, fontWeight: '900', fontSize: 20 }, hello: { color: colors.ink, fontSize: 21, fontWeight: '900' }, headSpacer: { flex: 1 }, bell: { height: 44, width: 44, justifyContent: 'center', alignItems: 'center' }, dot: { position: 'absolute', top: 6, right: 5, height: 7, width: 7, borderRadius: 4, backgroundColor: colors.red },
  balance: { height: 212, borderRadius: 22, backgroundColor: colors.purple, padding: 21, overflow: 'hidden' }, balanceLabel: { color: '#EFEFEF', fontWeight: '600', fontSize: 13, letterSpacing: .6 }, balanceMoney: { color: '#FFF', fontSize: 31, fontWeight: '800', marginTop: 10, fontVariant: ['tabular-nums'] }, levelBadge: { height: 29, paddingHorizontal: 16, borderRadius: 99, justifyContent: 'center', alignSelf: 'flex-start', backgroundColor: '#FDC504', marginTop: 12 }, levelBadgeText: { color: colors.ink, fontWeight: '800', fontSize: 11 }, lamp: { position: 'absolute', right: 3, bottom: -9, transform: [{ scale: .78 }] },
  stats: { height: 72, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 20 }, stat: { flex: 1, minWidth: 0, alignItems: 'center' }, statTitle: { color: colors.ink, fontSize: 10, fontWeight: '700' }, statValue: { fontSize: 15, fontWeight: '900', marginTop: 6, fontVariant: ['tabular-nums'] }, sep: { width: 1, height: 43, backgroundColor: colors.border },
  actions: { flexDirection: 'row', gap: 12 }, action: { flex: 1, height: 66, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 9 }, actionText: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  records: { paddingVertical: 3, borderRadius: 20 }, record: { minHeight: 61, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ECE7DE', gap: 10, paddingHorizontal: 3 }, recordIcon: { height: 35, width: 35, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }, recordCopy: { flex: 1 }, recordTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 }, recordMeta: { color: colors.muted, fontSize: 10, marginTop: 3 }, recordMoney: { fontWeight: '900', fontSize: 14 }, empty: { color: colors.muted, textAlign: 'center', paddingVertical: 26 },
  modal: { flex: 1, backgroundColor: 'rgba(18,18,26,.24)', justifyContent: 'flex-end' }, dismiss: { flex: 1 }, sheet: { backgroundColor: colors.paper, padding: 20, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, handle: { height: 5, width: 44, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 15 }, sheetTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' }, field: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 }, input: { height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF', color: colors.ink, paddingHorizontal: 14, fontSize: 16 }, categoryRow: { gap: 8, paddingVertical: 2 }, category: { height: 36, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF', justifyContent: 'center' }, categoryIncome: { backgroundColor: '#DDF2DD', borderColor: colors.green }, categoryExpense: { backgroundColor: '#FFE2EA', borderColor: colors.pink }, categoryText: { color: colors.muted, fontSize: 13, fontWeight: '800' }, categoryTextOn: { color: colors.ink }, save: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 22 },
});
