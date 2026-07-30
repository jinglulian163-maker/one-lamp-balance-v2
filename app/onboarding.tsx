import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, Lamp, money } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';

const STEP_COUNT = 4;

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useFinanceStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [income, setIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [nextIncomeDate, setNextIncomeDate] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const nextIncomeDays = useMemo(() => {
    if (!nextIncomeDate) return 18;
    const target = new Date(`${nextIncomeDate}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 18;
    return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86400000));
  }, [nextIncomeDate]);

  const finish = (withGoal: boolean) => {
    completeOnboarding({
      name,
      balance: Number(balance) || 0,
      monthlyIncome: Number(income) || 0,
      fixedExpenses: Number(fixedExpenses) || 0,
      nextIncomeDays,
      nextIncomeDate,
      goalTitle: withGoal ? goalTitle : undefined,
      goalAmount: withGoal ? Number(goalAmount) || undefined : undefined,
    });
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step === 3) { finish(true); return; }
    setStep((current) => current + 1);
  };

  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.page}><View style={s.progress}>{Array.from({ length: STEP_COUNT }, (_, index) => <View key={index} style={[s.progressDot, index <= step && s.progressOn]} />)}</View><View style={s.content}>{step === 0 ? <Welcome name={name} onName={setName} /> : null}{step === 1 ? <Balance balance={balance} onBalance={setBalance} /> : null}{step === 2 ? <Income income={income} fixedExpenses={fixedExpenses} date={nextIncomeDate} onIncome={setIncome} onFixedExpenses={setFixedExpenses} onDate={setNextIncomeDate} /> : null}{step === 3 ? <FirstGoal title={goalTitle} amount={goalAmount} onTitle={setGoalTitle} onAmount={setGoalAmount} /> : null}</View><View style={s.footer}>{step > 0 ? <Pressable style={s.back} onPress={() => setStep((current) => current - 1)}><Ionicons name="arrow-back" color={colors.ink} size={21} /></Pressable> : <View style={s.backPlaceholder} />}{step === 3 ? <Pressable style={s.skip} onPress={() => finish(false)}><Text style={s.skipText}>暂时跳过</Text></Pressable> : null}<Pressable style={s.next} onPress={next}><Text style={s.nextText}>{step === 0 ? '开始设置' : step === 3 ? '完成并进入首页' : '下一步'}</Text><Ionicons name="arrow-forward" color={colors.ink} size={20} /></Pressable></View></View></KeyboardAvoidingView></SafeAreaView>;
}

function Welcome({ name, onName }: { name: string; onName: (value: string) => void }) { return <><View style={s.hero}><Lamp level={4} /></View><Text style={s.kicker}>一盏余额</Text><Text style={s.title}>用一盏灯，{`\n`}看见还剩多少。</Text><Text style={s.copy}>不需要复杂记账，从看见今天还能自由使用多少钱开始。</Text><Field label="怎么称呼你？" value={name} onChange={onName} placeholder="例如：小满" /></>; }
function Balance({ balance, onBalance }: { balance: string; onBalance: (value: string) => void }) { return <><View style={[s.iconCircle, { backgroundColor: '#E9E2FF' }]}><Ionicons name="wallet-outline" size={35} color={colors.purple} /></View><Text style={s.title}>现在还可以{`\n`}自由使用多少钱？</Text><Text style={s.copy}>这笔钱会点亮首页的第一盏灯，不包含已经存进目标的钱。</Text><Field label="当前可用余额" value={balance} onChange={onBalance} placeholder="¥ 0.00" keyboard="decimal-pad" /></>; }
function Income({ income, fixedExpenses, date, onIncome, onFixedExpenses, onDate }: { income: string; fixedExpenses: string; date: string; onIncome: (value: string) => void; onFixedExpenses: (value: string) => void; onDate: (value: string) => void }) { return <><View style={[s.iconCircle, { backgroundColor: '#FFF1B7' }]}><Ionicons name="calendar-outline" size={35} color="#A46A00" /></View><Text style={s.title}>安排下一次{`\n`}收入周期。</Text><Text style={s.copy}>这些信息会帮助你计算距离下次收入的天数，以及后续的消费建议。现在不确定也可以先留空。</Text><Field label="下次收入日期（YYYY-MM-DD）" value={date} onChange={onDate} placeholder="例如：2026-08-10" /><Field label="每月预计收入（可选）" value={income} onChange={onIncome} placeholder="¥ 0" keyboard="decimal-pad" /><Field label="固定必要开销（可选）" value={fixedExpenses} onChange={onFixedExpenses} placeholder="¥ 0" keyboard="decimal-pad" /></>; }
function FirstGoal({ title, amount, onTitle, onAmount }: { title: string; amount: string; onTitle: (value: string) => void; onAmount: (value: string) => void }) { return <><View style={[s.iconCircle, { backgroundColor: '#FFE2EA' }]}><Ionicons name="sparkles-outline" size={35} color={colors.pink} /></View><Text style={s.title}>想先为哪件事{`\n`}留一点？</Text><Text style={s.copy}>创建后，它会成为你的当前优先目标。你也可以稍后再添加。</Text><Field label="目标名称" value={title} onChange={onTitle} placeholder="例如：旅行基金" /><Field label="目标金额" value={amount} onChange={onAmount} placeholder="¥ 0" keyboard="decimal-pad" /><View style={s.tip}><Ionicons name="bulb-outline" size={17} color="#8A6200" /><Text style={s.tipText}>例如：{money(10000)} 的旅行基金</Text></View></>; }
function Field({ label, value, onChange, placeholder, keyboard }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; keyboard?: 'decimal-pad' }) { return <View style={s.fieldWrap}><Text style={s.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboard} style={s.input} /></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { flex: 1, padding: 24, paddingBottom: 28 }, progress: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 12 }, progressDot: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#D7D2C7' }, progressOn: { width: 25, backgroundColor: colors.yellow }, content: { flex: 1, justifyContent: 'center', maxWidth: 460, width: '100%', alignSelf: 'center' }, hero: { height: 220, backgroundColor: colors.purple, borderRadius: 32, borderWidth: 1.3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 26, overflow: 'hidden' }, kicker: { color: colors.purple, fontSize: 14, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.ink, fontSize: 34, lineHeight: 42, fontWeight: '900', marginTop: 10 }, copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13, maxWidth: 390 }, iconCircle: { height: 72, width: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: colors.ink, marginBottom: 17 }, fieldWrap: { marginTop: 21 }, fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 7 }, input: { height: 56, backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 16, color: colors.ink, fontSize: 16, fontWeight: '700' }, footer: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 460, width: '100%', alignSelf: 'center' }, back: { height: 54, width: 54, borderRadius: 17, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, backPlaceholder: { width: 0 }, skip: { paddingHorizontal: 8, height: 54, alignItems: 'center', justifyContent: 'center' }, skipText: { color: colors.muted, fontWeight: '800' }, next: { flex: 1, height: 54, borderRadius: 17, backgroundColor: colors.yellow, borderWidth: 1.2, borderColor: colors.ink, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, nextText: { color: colors.ink, fontSize: 16, fontWeight: '900' }, tip: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#FFF1BD', borderRadius: 14, padding: 12, marginTop: 17 }, tipText: { color: '#6F5512', fontWeight: '700', fontSize: 13 },
});
