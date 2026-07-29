import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Tab = 'home' | 'plan' | 'profile';
type TransactionKind = 'income' | 'expense';
type Priority = 'primary' | 'ongoing' | 'waiting';

type Transaction = {
  id: string;
  title: string;
  amount: number;
  kind: TransactionKind;
  icon: string;
  time: string;
};

type Goal = {
  id: string;
  title: string;
  subtitle: string;
  target: number;
  saved: number;
  monthly: number;
  priority: Priority;
  art: string;
  color: string;
};

const C = {
  canvas: '#F5F1E8', ink: '#17151B', muted: '#7D7780', line: '#D7D0C5',
  paper: '#FFFCF6', purple: '#7655E7', violet: '#A38BFA', yellow: '#FFC735',
  pink: '#FF6B8B', coral: '#F46B68', green: '#4C9A63', mint: '#75CEC4', navy: '#171827', white: '#FFFFFF', red: '#E95D69', palePurple: '#E9E2FF', palePink: '#FFE4EA', paleYellow: '#FFF0B4', paleGreen: '#DAF0DC',
} as const;

const { width } = Dimensions.get('window');
const PAD = 20;
const CARD_WIDTH = width - PAD * 2;
const BASE_BALANCE = 2909;

const seedTransactions: Transaction[] = [
  { id: 't1', title: '午餐', amount: 23, kind: 'expense', icon: '🍜', time: '今天 12:30' },
  { id: 't2', title: '兼职收入', amount: 400, kind: 'income', icon: '✦', time: '昨天 18:20' },
  { id: 't3', title: '地铁出行', amount: 6, kind: 'expense', icon: '🚇', time: '昨天 09:12' },
];

const seedGoals: Goal[] = [
  { id: 'g1', title: '旅行基金', subtitle: '去看世界，收集美好回忆！', target: 10000, saved: 4260, monthly: 1435, priority: 'primary', art: '⛰', color: C.coral },
  { id: 'g2', title: '新电脑', subtitle: '给创作一个更好的工具。', target: 8000, saved: 1200, monthly: 680, priority: 'ongoing', art: '⌘', color: C.purple },
  { id: 'g3', title: '演唱会', subtitle: '去现场见喜欢的音乐。', target: 1500, saved: 500, monthly: 200, priority: 'ongoing', art: '♫', color: C.pink },
  { id: 'g4', title: '相机', subtitle: '认真记录每一个喜欢的瞬间。', target: 6000, saved: 0, monthly: 0, priority: 'waiting', art: '◉', color: C.mint },
];

function money(value: number, digits = 0) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [goals, setGoals] = useState<Goal[]>(seedGoals);
  const [goalIndex, setGoalIndex] = useState(0);
  const [recordType, setRecordType] = useState<TransactionKind | null>(null);

  const income = useMemo(() => transactions.filter(t => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const expense = useMemo(() => transactions.filter(t => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const balance = Math.max(0, BASE_BALANCE + income - expense);
  const lamp = balance >= 4200 ? 4 : balance >= 2800 ? 3 : balance >= 1400 ? 2 : 1;
  const activeGoal = goals[goalIndex] ?? goals[0];
  const primaryGoal = goals.find(goal => goal.priority === 'primary');

  function addRecord(kind: TransactionKind, title: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('金额需要大于 0');
      return;
    }
    setTransactions(current => [{ id: `${Date.now()}`, title: title.trim() || (kind === 'income' ? '新增收入' : '新增支出'), amount, kind, icon: kind === 'income' ? '✦' : '•', time: '刚刚' }, ...current]);
    setRecordType(null);
  }

  function makePrimary(id: string) {
    setGoals(current => current.map(goal => ({ ...goal, priority: goal.id === id ? 'primary' : goal.priority === 'primary' ? 'ongoing' : goal.priority })));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {tab === 'home' && <Home balance={balance} lamp={lamp} income={income} expense={expense} transactions={transactions} onIncome={() => setRecordType('income')} onExpense={() => setRecordType('expense')} />}
      {tab === 'plan' && <Plan goals={goals} selected={goalIndex} setSelected={setGoalIndex} goal={activeGoal} primary={primaryGoal} onMakePrimary={() => makePrimary(activeGoal.id)} />}
      {tab === 'profile' && <Profile goals={goals} />}
      <Navigation active={tab} onChange={setTab} />
      <RecordModal kind={recordType} onClose={() => setRecordType(null)} onSave={addRecord} />
    </SafeAreaView>
  );
}

function Home({ balance, lamp, income, expense, transactions, onIncome, onExpense }: { balance: number; lamp: 1 | 2 | 3 | 4; income: number; expense: number; transactions: Transaction[]; onIncome: () => void; onExpense: () => void }) {
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <View style={styles.hello}><View style={styles.avatar}><Text>🌙</Text></View><View style={styles.helloText}><Text style={styles.eyebrow}>早上好，小满</Text><Text style={styles.helloTitle}>今天也留一点给自己</Text></View><Pressable style={styles.notice}><Text>♧</Text><View style={styles.noticeDot} /></Pressable></View>
    <View style={styles.balanceCard}>
      <Text style={styles.balanceOverline}>当前可用余额</Text><Text style={styles.balanceNumber}>{money(balance, 2)}</Text>
      <View style={styles.lampArea}><Lamp level={lamp} /><View style={styles.levels}>{[4, 3, 2, 1].map(level => <View key={level} style={[styles.levelDot, lamp === level && styles.levelActive]} />)}</View></View>
      <View style={styles.balanceHint}><Text>余额会随着每笔收入与支出轻轻变化</Text><Text>→</Text></View>
    </View>
    <View style={styles.statCard}><Stat label="本月收入" value={money(income)} tone={C.green} /><View style={styles.statDivider} /><Stat label="本月支出" value={money(expense)} tone={C.pink} /><View style={styles.statDivider} /><Stat label="距离收入" value="18 天" tone={C.purple} /></View>
    <View style={styles.actionRow}><Pressable onPress={onIncome} style={[styles.action, { backgroundColor: C.yellow }]}><Text style={styles.actionIcon}>＋</Text><Text style={styles.actionText}>记收入</Text></Pressable><Pressable onPress={onExpense} style={[styles.action, { backgroundColor: C.pink }]}><Text style={styles.actionIcon}>−</Text><Text style={styles.actionText}>记支出</Text></Pressable></View>
    <Section title="最近记录" action="查看全部"><View style={styles.listCard}>{transactions.slice(0, 4).map(t => <TransactionItem key={t.id} item={t} />)}</View></Section>
  </ScrollView>;
}

function Plan({ goals, selected, setSelected, goal, primary, onMakePrimary }: { goals: Goal[]; selected: number; setSelected: (v: number) => void; goal: Goal; primary?: Goal; onMakePrimary: () => void }) {
  const list = useRef<FlatList<Goal>>(null);
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <View style={styles.titleRow}><Text style={styles.pageTitle}>计划</Text><Pressable style={styles.addGoal} onPress={() => Alert.alert('添加目标', '下一步可在这里加入完整创建表单。')}><Text style={styles.addGoalText}>＋ 添加目标</Text></Pressable></View>
    <FlatList ref={list} data={goals} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={g => g.id} onMomentumScrollEnd={e => setSelected(Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH))} renderItem={({ item, index }) => <GoalHero goal={item} index={index} total={goals.length} />} />
    <View style={styles.pagination}>{goals.map((g, index) => <View key={g.id} style={[styles.paginationDot, index === selected && styles.paginationOn]} />)}</View>
    {goal.priority === 'primary' ? <PrimaryDetail goal={goal} /> : goal.priority === 'ongoing' ? <OngoingDetail goal={goal} primary={primary} /> : <WaitingDetail onMakePrimary={onMakePrimary} />}
    <Section title="本月目标分配" action="可分配 ¥1,800"><View style={styles.allocationCard}>{goals.map(g => <View key={g.id} style={styles.allocation}><View style={styles.allocationName}><View style={[styles.miniDot, g.priority === 'primary' && { backgroundColor: C.yellow }, g.priority === 'ongoing' && { backgroundColor: C.purple }]} /><Text>{g.title}</Text></View><Text style={g.priority === 'waiting' ? styles.disabled : styles.allocationMoney}>{g.priority === 'waiting' ? '暂未分配' : money(g.monthly)}</Text></View>)}</View></Section>
  </ScrollView>;
}

function Profile({ goals }: { goals: Goal[] }) {
  const saved = goals.reduce((sum, g) => sum + g.saved, 0);
  const collection = [{ emoji: '📷', title: '第一台相机', color: C.purple }, { emoji: '🏝', title: '三亚旅行', color: C.mint }, { emoji: '♫', title: '演唱会', color: '#314471' }, { emoji: '📚', title: '专业书籍', color: C.yellow }];
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <View style={styles.titleRow}><Text style={styles.pageTitle}>我的</Text><Pressable style={styles.settings}><Text>⚙</Text></Pressable></View>
    <View style={styles.profileCard}><View style={styles.profileHead}><View style={styles.bigAvatar}><Text>🌙</Text></View><View><Text style={styles.profileName}>小满</Text><Text style={styles.profileSub}>把生活过成自己喜欢的样子</Text></View></View><View style={styles.profileLine} /><View style={styles.profileStats}><Stat label="累计存入" value={money(saved)} tone={C.yellow} /><Stat label="完成目标" value="4" tone={C.white} /><Stat label="点亮天数" value="72" tone={C.white} /><Stat label="记录天数" value="86" tone={C.white} /></View></View>
    <Section title="我的图鉴" action="查看全部"><View style={styles.collectionCard}><View style={styles.collectionRow}>{collection.map(i => <View key={i.title} style={[styles.collectItem, { backgroundColor: i.color }]}><Text style={styles.collectEmoji}>{i.emoji}</Text><Text numberOfLines={1} style={styles.collectTitle}>{i.title}</Text><Text style={styles.collectDate}>2025 · 解锁</Text></View>)}</View></View></Section>
    <Pressable style={styles.yearCard} onPress={() => Alert.alert('年度总结', '这一年，你为喜欢的生活留住了更多可能。')}><View><Text style={styles.yearKicker}>2026 · YEAR IN REVIEW</Text><Text style={styles.yearTitle}>年度总结</Text><Text style={styles.yearCopy}>看看这一年点亮的生活</Text></View><Text style={styles.star}>✦</Text></Pressable>
    <View style={styles.settingsCard}>{['账户与设置', '收入周期', '分类管理', '提醒设置', '数据管理', '帮助与反馈'].map((name, index) => <Pressable key={name} style={styles.settingRow} onPress={() => Alert.alert(name, '此入口将在下一步连接完整设置页面。')}><View style={[styles.settingIcon, { backgroundColor: [C.palePurple, C.paleYellow, C.palePink, C.paleGreen, '#D9F4F4', '#EAE6DE'][index] }]}><Text>{['♙', '◷', '▦', '♧', '↥', '?'][index]}</Text></View><Text style={styles.settingName}>{name}</Text><Text style={styles.chevron}>›</Text></Pressable>)}</View>
  </ScrollView>;
}

function Lamp({ level }: { level: 1 | 2 | 3 | 4 }) {
  const shades = ['#9F967B', '#BDB75C', '#E2D44A', '#FFF16B'];
  const glow = [0.12, 0.22, 0.38, 0.58];
  return <View style={styles.lamp}><View style={[styles.lampGlow, { opacity: glow[level - 1] }]} /><View style={[styles.shade, { backgroundColor: shades[level - 1] }]}><View style={styles.face}><View style={styles.eye} /><View style={styles.smile} /><View style={styles.eye} /></View></View><View style={[styles.cone, { opacity: glow[level - 1] }]} /><View style={styles.stem} /><View style={styles.base} /></View>;
}

function GoalHero({ goal, index, total }: { goal: Goal; index: number; total: number }) {
  const progress = Math.round(goal.saved / goal.target * 100);
  return <View style={[styles.goalHero, { width: CARD_WIDTH, backgroundColor: goal.color }]}><View style={styles.goalTop}><Text style={styles.priorityPill}>{goal.priority === 'primary' ? '当前优先' : goal.priority === 'ongoing' ? '持续进行' : '暂时等待'}</Text><Text style={styles.goalCount}>{index + 1} / {total}</Text></View><View style={styles.goalMiddle}><View style={styles.goalWords}><Text style={styles.goalTitle}>{goal.title}</Text><Text style={styles.goalSub}>{goal.subtitle}</Text><Text style={styles.goalLabel}>目标金额</Text><Text style={styles.goalAmount}>{money(goal.target)}</Text></View><View style={styles.goalArt}><Text style={styles.goalSun}>●</Text><Text style={styles.goalMount}>{goal.art}</Text></View></View><View style={styles.progressTrack}><View style={[styles.progress, { width: `${progress}%` }]} /></View><View style={styles.goalFooter}><Text style={styles.goalSavedLabel}>已存 {money(goal.saved)}</Text><Text style={styles.goalPercent}>{progress}%</Text></View></View>;
}

function PrimaryDetail({ goal }: { goal: Goal }) {
  const budgets = [['🍞', '早餐', 10], ['🥗', '午餐', 20], ['🍲', '晚餐', 20], ['🚌', '出行', 8], ['☺', '自由', 18]];
  return <><Section title="目标进度"><View style={styles.detailCard}><View style={styles.metricRow}><Metric label="目标金额" value={money(goal.target)} /><Metric label="已存金额" value={money(goal.saved)} /><Metric label="剩余金额" value={money(goal.target - goal.saved)} /></View><View style={styles.detailLine} /><View style={styles.metricRow}><Metric label="预计完成" value="4 个月后" /><Metric label="每月需存" value={money(goal.monthly)} /></View></View></Section><Section title="每日消费建议" action={money(76)}><View style={styles.detailCard}><Text style={styles.budgetHint}>基于当前优先目标生成</Text><View style={styles.budgetGrid}>{budgets.map(([icon, label, amount]) => <View key={label as string} style={styles.budget}><Text style={styles.budgetIcon}>{icon}</Text><Text style={styles.budgetLabel}>{label}</Text><Text style={styles.budgetMoney}>{money(amount as number)}</Text></View>)}</View></View></Section></>;
}

function OngoingDetail({ goal, primary }: { goal: Goal; primary?: Goal }) {
  return <Section title={goal.title}><View style={styles.detailCard}><Text style={styles.protection}>优先保障：{primary?.title ?? '当前主目标'}</Text><Text style={styles.ongoingCopy}>扣除当前优先计划后，可以为这个目标慢慢留下：</Text><Text style={styles.monthly}>{money(goal.monthly)}<Text style={styles.monthUnit}> / 月</Text></Text><Text style={styles.weekly}>约 {money(Math.ceil(goal.monthly / 4.33))} / 周</Text></View></Section>;
}

function WaitingDetail({ onMakePrimary }: { onMakePrimary: () => void }) {
  return <View style={[styles.detailCard, styles.waiting]}><Text style={styles.waitMoon}>☾</Text><Text style={styles.waitTitle}>这个目标正在等待</Text><Text style={styles.waitCopy}>它目前没有固定资金分配。完成当前优先目标后，或现在把它设为优先。</Text><Pressable style={styles.waitButton} onPress={onMakePrimary}><Text style={styles.actionText}>设为当前优先</Text></Pressable></View>;
}

function Section({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{action && <Text style={styles.sectionAction}>{action}</Text>}</View>{children}</View>; }
function Stat({ label, value, tone }: { label: string; value: string; tone: string }) { return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text numberOfLines={1} style={[styles.statValue, { color: tone }]}>{value}</Text></View>; }
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text numberOfLines={1} style={styles.metricValue}>{value}</Text></View>; }
function TransactionItem({ item }: { item: Transaction }) { return <View style={styles.transaction}><View style={[styles.transactionIcon, { backgroundColor: item.kind === 'income' ? C.paleGreen : C.palePurple }]}><Text>{item.icon}</Text></View><View style={styles.transactionWords}><Text style={styles.transactionTitle}>{item.title}</Text><Text style={styles.transactionTime}>{item.time}</Text></View><Text style={[styles.transactionMoney, { color: item.kind === 'income' ? C.green : C.red }]}>{item.kind === 'income' ? '+' : '−'}{money(item.amount)}</Text></View>; }

function Navigation({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) { const tabs: { id: Tab; icon: string; label: string }[] = [{ id: 'home', icon: '⌂', label: '首页' }, { id: 'plan', icon: '◫', label: '计划' }, { id: 'profile', icon: '☺', label: '我的' }]; return <View style={styles.nav}>{tabs.map(item => <Pressable key={item.id} onPress={() => onChange(item.id)} style={styles.navItem}><View style={[styles.navCircle, active === item.id && styles.navCurrent]}><Text style={[styles.navIcon, active === item.id && styles.navCurrentIcon]}>{item.icon}</Text></View></Pressable>)}</View>; }

function RecordModal({ kind, onClose, onSave }: { kind: TransactionKind | null; onClose: () => void; onSave: (kind: TransactionKind, title: string, amount: number) => void }) { const [title, setTitle] = useState(''); const [amount, setAmount] = useState(''); const close = () => { setTitle(''); setAmount(''); onClose(); }; return <Modal visible={kind !== null} transparent animationType="slide" onRequestClose={close}><View style={styles.modalBackdrop}><Pressable style={styles.modalBlank} onPress={close} /><View style={styles.sheet}><View style={styles.handle} /><View style={styles.sheetTitleRow}><Text style={styles.sheetTitle}>{kind === 'income' ? '记一笔收入' : '记一笔支出'}</Text><Pressable onPress={close}><Text style={styles.close}>×</Text></Pressable></View><Text style={styles.inputLabel}>金额</Text><View style={styles.amountInputRow}><Text style={styles.currency}>¥</Text><TextInput autoFocus keyboardType="decimal-pad" value={amount} onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ''))} placeholder="0.00" placeholderTextColor={C.muted} style={styles.amountInput} /></View><Text style={styles.inputLabel}>名称</Text><TextInput value={title} onChangeText={setTitle} placeholder={kind === 'income' ? '例如：工资、兼职收入' : '例如：午餐、购物'} placeholderTextColor={C.muted} style={styles.input} /><Pressable style={[styles.save, { backgroundColor: kind === 'income' ? C.yellow : C.pink }]} onPress={() => kind && onSave(kind, title, Number(amount))}><Text style={styles.actionText}>保存记录</Text></Pressable></View></View></Modal>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas }, page: { paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 120, gap: 18 },
  hello: { flexDirection: 'row', alignItems: 'center', minHeight: 64 }, avatar: { height: 46, width: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: C.palePurple, borderWidth: 1.5, borderColor: C.ink }, helloText: { flex: 1, marginLeft: 11 }, eyebrow: { color: C.muted, fontSize: 13 }, helloTitle: { color: C.ink, fontSize: 17, fontWeight: '700', marginTop: 2 }, notice: { height: 44, width: 44, borderRadius: 22, backgroundColor: C.paper, borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' }, noticeDot: { position: 'absolute', top: 6, right: 8, height: 7, width: 7, borderRadius: 4, backgroundColor: C.pink },
  balanceCard: { backgroundColor: C.purple, borderRadius: 28, borderWidth: 1.6, borderColor: C.ink, padding: 20, overflow: 'hidden' }, balanceOverline: { color: '#EDE9FF', fontSize: 13, fontWeight: '600' }, balanceNumber: { color: C.white, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 4 }, lampArea: { height: 216, marginTop: -2, alignItems: 'center', justifyContent: 'flex-end' }, balanceHint: { borderTopWidth: 1, borderColor: '#A99AF0', paddingTop: 11, flexDirection: 'row', justifyContent: 'space-between', color: C.white },
  lamp: { width: 190, height: 190, alignItems: 'center', justifyContent: 'flex-end' }, lampGlow: { position: 'absolute', bottom: 6, width: 184, height: 50, borderRadius: 100, backgroundColor: C.yellow }, shade: { width: 150, height: 92, borderTopLeftRadius: 38, borderTopRightRadius: 38, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderWidth: 2.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', zIndex: 3 }, face: { flexDirection: 'row', gap: 13, alignItems: 'center', marginTop: 15 }, eye: { height: 7, width: 7, borderRadius: 4, backgroundColor: C.ink }, smile: { height: 9, width: 18, borderBottomWidth: 2, borderColor: C.ink, borderRadius: 10 }, cone: { position: 'absolute', bottom: 28, height: 65, width: 110, backgroundColor: C.yellow, borderRadius: 50 }, stem: { height: 44, width: 25, backgroundColor: C.yellow, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderColor: C.ink, zIndex: 2 }, base: { width: 118, height: 29, backgroundColor: '#E7D742', borderWidth: 2.5, borderColor: C.ink, borderRadius: 18, zIndex: 3 }, levels: { position: 'absolute', right: 12, top: 73, gap: 13 }, levelDot: { height: 11, width: 11, borderRadius: 6, backgroundColor: '#B8ADF0', opacity: 0.5 }, levelActive: { backgroundColor: C.yellow, opacity: 1, transform: [{ scale: 1.25 }], borderWidth: 1, borderColor: C.ink },
  statCard: { flexDirection: 'row', backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, paddingVertical: 15 }, stat: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 }, statLabel: { color: C.muted, fontSize: 11 }, statValue: { fontSize: 16, fontWeight: '800', marginTop: 6 }, statDivider: { width: 1, backgroundColor: C.line, marginVertical: 2 },
  actionRow: { flexDirection: 'row', gap: 12 }, action: { flex: 1, height: 62, borderRadius: 20, borderWidth: 1.6, borderColor: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, actionIcon: { color: C.ink, fontSize: 22, fontWeight: '700' }, actionText: { color: C.ink, fontSize: 16, fontWeight: '800' },
  section: { gap: 9 }, sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: C.ink, fontSize: 20, fontWeight: '800' }, sectionAction: { color: C.muted, fontSize: 13, fontWeight: '600' }, listCard: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, paddingHorizontal: 14 }, transaction: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E9E3D9' }, transactionIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, transactionWords: { flex: 1, marginLeft: 10 }, transactionTitle: { color: C.ink, fontSize: 15, fontWeight: '700' }, transactionTime: { color: C.muted, fontSize: 11, marginTop: 2 }, transactionMoney: { fontSize: 15, fontWeight: '800' },
  titleRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pageTitle: { color: C.ink, fontSize: 32, fontWeight: '800', letterSpacing: -1 }, addGoal: { backgroundColor: C.purple, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1.2, borderColor: C.ink }, addGoalText: { color: C.white, fontWeight: '800', fontSize: 13 },
  goalHero: { minHeight: 315, borderRadius: 27, borderWidth: 1.6, borderColor: C.ink, padding: 19 }, goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, priorityPill: { overflow: 'hidden', backgroundColor: C.yellow, color: C.ink, fontSize: 12, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }, goalCount: { color: C.white, fontWeight: '800' }, goalMiddle: { flex: 1, flexDirection: 'row', alignItems: 'center' }, goalWords: { flex: 1 }, goalTitle: { color: C.white, fontSize: 29, fontWeight: '800' }, goalSub: { color: '#FFECEF', fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 170 }, goalLabel: { color: '#FFECEF', fontSize: 11, marginTop: 19 }, goalAmount: { color: C.white, fontSize: 22, fontWeight: '800', marginTop: 2 }, goalArt: { width: 120, alignItems: 'center', justifyContent: 'center' }, goalMount: { color: C.white, fontSize: 76, fontWeight: '900' }, goalSun: { alignSelf: 'flex-end', color: C.yellow, fontSize: 26, marginBottom: -12, marginRight: 18 }, progressTrack: { height: 12, borderRadius: 10, backgroundColor: 'rgba(23,21,27,0.38)', overflow: 'hidden' }, progress: { height: '100%', backgroundColor: C.yellow, borderRadius: 10 }, goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, goalSavedLabel: { color: C.white }, goalPercent: { color: C.yellow, fontWeight: '900', fontSize: 18 }, pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: -9 }, paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CFC7BA' }, paginationOn: { width: 22, backgroundColor: C.purple },
  detailCard: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, padding: 16 }, metricRow: { flexDirection: 'row' }, metric: { flex: 1, minWidth: 0 }, metricLabel: { color: C.muted, fontSize: 11 }, metricValue: { color: C.ink, fontSize: 15, fontWeight: '800', marginTop: 6 }, detailLine: { height: 1, backgroundColor: C.line, marginVertical: 15 }, budgetHint: { color: C.muted, fontSize: 12, marginTop: 4 }, budgetGrid: { flexDirection: 'row', marginTop: 18 }, budget: { flex: 1, alignItems: 'center' }, budgetIcon: { fontSize: 24 }, budgetLabel: { color: C.muted, fontSize: 10, marginTop: 5 }, budgetMoney: { color: C.ink, fontSize: 13, fontWeight: '800', marginTop: 4 }, protection: { color: C.green, fontWeight: '800', fontSize: 14 }, ongoingCopy: { color: C.muted, lineHeight: 21, fontSize: 14, marginTop: 13 }, monthly: { color: C.ink, fontSize: 37, fontWeight: '900', marginTop: 17 }, monthUnit: { color: C.muted, fontSize: 15 }, weekly: { color: C.purple, fontSize: 16, fontWeight: '800', marginTop: 3 }, waiting: { alignItems: 'center', paddingVertical: 28 }, waitMoon: { fontSize: 50, color: C.purple }, waitTitle: { color: C.ink, fontWeight: '800', fontSize: 21, marginTop: 8 }, waitCopy: { color: C.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }, waitButton: { marginTop: 18, backgroundColor: C.yellow, paddingHorizontal: 20, height: 48, borderRadius: 17, borderWidth: 1.2, borderColor: C.ink, justifyContent: 'center' },
  allocationCard: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, paddingHorizontal: 15 }, allocation: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: '#E9E3D9', borderBottomWidth: 1 }, allocationName: { flexDirection: 'row', alignItems: 'center', gap: 8 }, miniDot: { height: 9, width: 9, borderRadius: 5, backgroundColor: '#CFC7BA' }, allocationMoney: { color: C.ink, fontWeight: '800' }, disabled: { color: C.muted, fontSize: 12 },
  settings: { width: 42, height: 42, borderWidth: 1.3, borderColor: C.ink, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, profileCard: { backgroundColor: C.green, borderRadius: 27, borderWidth: 1.6, borderColor: C.ink, padding: 18 }, profileHead: { flexDirection: 'row', alignItems: 'center' }, bigAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.paleGreen, borderWidth: 1.3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, profileName: { color: C.white, fontSize: 25, fontWeight: '800' }, profileSub: { color: '#DCF1DD', fontSize: 13, marginTop: 4 }, profileLine: { height: 1, backgroundColor: '#87BF94', marginVertical: 18 }, profileStats: { flexDirection: 'row' }, collectionCard: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, padding: 11 }, collectionRow: { flexDirection: 'row', gap: 7 }, collectItem: { flex: 1, minWidth: 0, height: 125, borderRadius: 15, padding: 8, justifyContent: 'flex-end', borderWidth: 1.2, borderColor: C.ink }, collectEmoji: { flex: 1, textAlign: 'center', fontSize: 31 }, collectTitle: { color: C.white, fontSize: 11, fontWeight: '800' }, collectDate: { color: 'rgba(255,255,255,0.8)', fontSize: 8, marginTop: 2 }, yearCard: { backgroundColor: C.paper, minHeight: 125, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, yearKicker: { color: C.pink, fontSize: 10, fontWeight: '800' }, yearTitle: { color: C.ink, fontSize: 25, fontWeight: '800', marginTop: 5 }, yearCopy: { color: C.muted, fontSize: 13, marginTop: 5 }, star: { height: 68, width: 68, borderRadius: 34, backgroundColor: C.palePink, color: C.pink, fontSize: 42, textAlign: 'center', textAlignVertical: 'center' }, settingsCard: { backgroundColor: C.paper, borderRadius: 22, borderWidth: 1.3, borderColor: C.line, paddingHorizontal: 14 }, settingRow: { height: 57, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E9E3D9' }, settingIcon: { height: 31, width: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, settingName: { flex: 1, color: C.ink, fontSize: 15, fontWeight: '600', marginLeft: 11 }, chevron: { color: C.muted, fontSize: 25 },
  nav: { position: 'absolute', left: 28, right: 28, bottom: 16, height: 66, borderRadius: 33, backgroundColor: C.navy, borderWidth: 1.2, borderColor: C.ink, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, navItem: { width: 64, height: 56, alignItems: 'center', justifyContent: 'center' }, navCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, navCurrent: { backgroundColor: C.white }, navIcon: { color: '#DDD9E3', fontSize: 26, fontWeight: '800' }, navCurrentIcon: { color: C.ink },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(23,21,27,0.36)', justifyContent: 'flex-end' }, modalBlank: { flex: 1 }, sheet: { backgroundColor: C.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 35 }, handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: 'center', marginTop: 9, marginBottom: 16 }, sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sheetTitle: { fontSize: 24, fontWeight: '800', color: C.ink }, close: { fontSize: 31, color: C.ink }, inputLabel: { color: C.muted, marginTop: 18, marginBottom: 7, fontSize: 13, fontWeight: '600' }, amountInputRow: { height: 65, borderRadius: 17, borderWidth: 1.3, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 15 }, currency: { color: C.ink, fontSize: 27, fontWeight: '800', marginRight: 7 }, amountInput: { flex: 1, color: C.ink, fontSize: 28, fontWeight: '800' }, input: { height: 54, borderRadius: 17, borderWidth: 1.3, borderColor: C.line, backgroundColor: C.white, color: C.ink, paddingHorizontal: 15, fontSize: 16 }, save: { height: 56, borderRadius: 18, borderWidth: 1.3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
});
