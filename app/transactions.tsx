import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, money } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';
import { Transaction, TransactionKind } from '../types/finance';

type Filter = 'all' | TransactionKind;

export default function Transactions() {
  const router = useRouter();
  const { transactions, updateTransaction, deleteTransaction, incomeCategories, expenseCategories } = useFinanceStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [category, setCategory] = useState('');

  const visibleTransactions = useMemo(() => transactions.filter((item) => {
    const kindMatches = filter === 'all' || item.kind === filter;
    const categoryMatches = categoryFilter === null || item.category === categoryFilter;
    return kindMatches && categoryMatches;
  }), [transactions, filter, categoryFilter]);

  const visibleCategories = useMemo(() => Array.from(new Set(
    transactions
      .filter((item) => filter === 'all' || item.kind === filter)
      .map((item) => item.category),
  )), [transactions, filter]);

  const editCategories = kind === 'income' ? incomeCategories : expenseCategories;

  const changeFilter = (next: Filter) => {
    setFilter(next);
    setCategoryFilter(null);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setKind(transaction.kind);
    setCategory(transaction.category);
  };

  const closeEdit = () => setEditing(null);

  const save = () => {
    const value = Number(amount);
    if (!editing || !title.trim() || !Number.isFinite(value) || value <= 0 || !category) {
      Alert.alert('还差一点', '请填写名称、金额和分类。');
      return;
    }
    updateTransaction(editing.id, { title: title.trim(), amount: value, kind, category });
    closeEdit();
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert('删除这笔记录？', '删除后，首页余额和灯光会自动重新计算。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => { deleteTransaction(editing.id); closeEdit(); } },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.page}>
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
          <Text style={s.title}>全部记录</Text>
          <View style={s.back} />
        </View>

        <View style={s.filterRow}>
          {([{ id: 'all', label: '全部' }, { id: 'income', label: '收入' }, { id: 'expense', label: '支出' }] as { id: Filter; label: string }[]).map((item) => (
            <Pressable key={item.id} onPress={() => changeFilter(item.id)} style={[s.filter, filter === item.id && s.filterOn]}><Text style={[s.filterText, filter === item.id && s.filterTextOn]}>{item.label}</Text></Pressable>
          ))}
        </View>

        {visibleCategories.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryFilters}>
          <Pressable onPress={() => setCategoryFilter(null)} style={[s.categoryFilter, categoryFilter === null && s.categoryFilterOn]}><Text style={[s.categoryFilterText, categoryFilter === null && s.categoryFilterTextOn]}>全部分类</Text></Pressable>
          {visibleCategories.map((item) => <Pressable key={item} onPress={() => setCategoryFilter(item)} style={[s.categoryFilter, categoryFilter === item && s.categoryFilterOn]}><Text style={[s.categoryFilterText, categoryFilter === item && s.categoryFilterTextOn]}>{item}</Text></Pressable>)}
        </ScrollView>}

        <View style={s.countRow}><Text style={s.countText}>共 {visibleTransactions.length} 笔记录</Text><Text style={s.tipText}>点击记录即可编辑</Text></View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {visibleTransactions.length ? visibleTransactions.map((transaction) => (
            <Pressable key={transaction.id} onPress={() => openEdit(transaction)} style={s.row}>
              <View style={[s.icon, { backgroundColor: transaction.kind === 'income' ? '#DDF2DD' : '#E9E2FF' }]}><Ionicons name={transaction.kind === 'income' ? 'wallet-outline' : expenseIcon(transaction.category)} size={21} color={transaction.kind === 'income' ? colors.green : colors.purple} /></View>
              <View style={{ flex: 1 }}><Text style={s.rowTitle}>{transaction.title}</Text><Text style={s.rowMeta}>{formatDate(transaction.createdAt)} · {transaction.category}</Text></View>
              <Text style={[s.rowAmount, { color: transaction.kind === 'income' ? colors.green : colors.red }]}>{transaction.kind === 'income' ? '+' : '−'}{money(transaction.amount)}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.muted} />
            </Pressable>
          )) : <View style={s.empty}><Ionicons name="receipt-outline" size={44} color={colors.purple} /><Text style={s.emptyTitle}>这里还没有记录</Text><Text style={s.emptyCopy}>先回到首页，记下一笔收入或支出吧。</Text><Pressable style={s.emptyButton} onPress={() => router.back()}><Text style={s.emptyButtonText}>去记一笔</Text></Pressable></View>}
        </ScrollView>
      </View>

      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={closeEdit}>
        <View style={s.modal}><Pressable style={{ flex: 1 }} onPress={closeEdit} /><View style={s.sheet}>
          <View style={s.handle} /><Text style={s.sheetTitle}>编辑记录</Text>
          <View style={s.kindRow}>
            <Pressable onPress={() => { setKind('income'); setCategory(incomeCategories[0] ?? ''); }} style={[s.kindButton, kind === 'income' && s.incomeOn]}><Text style={s.kindText}>收入</Text></Pressable>
            <Pressable onPress={() => { setKind('expense'); setCategory(expenseCategories[0] ?? ''); }} style={[s.kindButton, kind === 'expense' && s.expenseOn]}><Text style={s.kindText}>支出</Text></Pressable>
          </View>
          <Label text="名称" /><TextInput value={title} onChangeText={setTitle} placeholder="例如：午餐" placeholderTextColor={colors.muted} style={s.input} />
          <Label text="金额" /><TextInput value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="¥ 0.00" placeholderTextColor={colors.muted} style={s.input} />
          <Label text="分类" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.editCategories}>{editCategories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[s.editCategory, category === item && (kind === 'income' ? s.editIncomeOn : s.editExpenseOn)]}><Text style={[s.editCategoryText, category === item && s.editCategoryTextOn]}>{item}</Text></Pressable>)}</ScrollView>
          <Pressable style={s.save} onPress={save}><Text style={s.saveText}>保存修改</Text></Pressable>
          <Pressable style={s.delete} onPress={remove}><Text style={s.deleteText}>删除这笔记录</Text></Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) { return <Text style={s.label}>{text}</Text>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '今天' : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }); }
function expenseIcon(category: string): keyof typeof Ionicons.glyphMap { if (category.includes('饮食')) return 'restaurant-outline'; if (category.includes('出行')) return 'train-outline'; if (category.includes('购物')) return 'bag-outline'; if (category.includes('娱乐')) return 'game-controller-outline'; return 'receipt-outline'; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { flex: 1, padding: 20, paddingBottom: 24 }, header: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { height: 42, width: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  filterRow: { flexDirection: 'row', gap: 9, marginTop: 12 }, filter: { height: 39, paddingHorizontal: 18, borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }, filterOn: { backgroundColor: colors.purple, borderColor: colors.ink }, filterText: { color: colors.muted, fontWeight: '800' }, filterTextOn: { color: '#FFF' },
  categoryFilters: { gap: 8, paddingVertical: 12 }, categoryFilter: { height: 32, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, justifyContent: 'center' }, categoryFilterOn: { backgroundColor: '#E9E2FF', borderColor: colors.purple }, categoryFilterText: { color: colors.muted, fontSize: 12, fontWeight: '800' }, categoryFilterTextOn: { color: colors.ink },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 3, marginBottom: 9 }, countText: { color: colors.ink, fontSize: 13, fontWeight: '900' }, tipText: { color: colors.muted, fontSize: 12 }, list: { backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 13, overflow: 'hidden', flexGrow: 1 }, row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#ECE7DE' }, icon: { height: 40, width: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 }, rowMeta: { color: colors.muted, fontSize: 11, marginTop: 4 }, rowAmount: { fontWeight: '900', fontSize: 15 },
  empty: { minHeight: 270, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 12 }, emptyCopy: { color: colors.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }, emptyButton: { minHeight: 42, paddingHorizontal: 20, borderRadius: 15, backgroundColor: colors.yellow, borderWidth: 1.2, borderColor: colors.ink, justifyContent: 'center', marginTop: 18 }, emptyButtonText: { color: colors.ink, fontWeight: '900' },
  modal: { flex: 1, backgroundColor: 'rgba(21,21,27,.25)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 }, handle: { height: 5, width: 44, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 15 }, sheetTitle: { color: colors.ink, fontSize: 24, fontWeight: '900' }, kindRow: { flexDirection: 'row', gap: 9, marginTop: 18 }, kindButton: { flex: 1, height: 46, borderRadius: 15, borderWidth: 1.2, borderColor: colors.border, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }, incomeOn: { backgroundColor: '#DDF2DD', borderColor: colors.green }, expenseOn: { backgroundColor: '#FFE2EA', borderColor: colors.pink }, kindText: { color: colors.ink, fontWeight: '900' }, label: { color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 6 }, input: { height: 54, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1.2, borderColor: colors.border, paddingHorizontal: 14, color: colors.ink, fontSize: 16, fontWeight: '700' }, editCategories: { gap: 8, paddingVertical: 2 }, editCategory: { minHeight: 37, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF', justifyContent: 'center' }, editIncomeOn: { backgroundColor: '#DDF2DD', borderColor: colors.green }, editExpenseOn: { backgroundColor: '#FFE2EA', borderColor: colors.pink }, editCategoryText: { color: colors.muted, fontSize: 13, fontWeight: '800' }, editCategoryTextOn: { color: colors.ink }, save: { height: 55, borderRadius: 17, backgroundColor: colors.yellow, borderWidth: 1.2, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center', marginTop: 22 }, saveText: { color: colors.ink, fontWeight: '900', fontSize: 16 }, delete: { height: 42, justifyContent: 'center', alignItems: 'center', marginTop: 6 }, deleteText: { color: colors.red, fontWeight: '900' },
});
