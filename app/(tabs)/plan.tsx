import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { BottomNav, Card, colors, money, Section } from "../../components/ui";
import { useFinanceStore } from "../../store/useFinanceStore";
import { SavingGoal } from "../../types/finance";

const pad = 20;
export default function Plan() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, 480) - pad * 2;
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    archiveGoal,
    setPriority,
    initialBalance,
    transactions,
  } = useFinanceStore();
  const [index, setIndex] = useState(0);
  const [create, setCreate] = useState(false);
  const [deposit, setDeposit] = useState(false);
  const [manage, setManage] = useState(false);
  const [goalList, setGoalList] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [completeGoal, setCompleteGoal] = useState<SavingGoal | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPriority, setEditPriority] =
    useState<SavingGoal["priority"]>("waiting");
  const goal = goals[index] ?? goals[0];
  const editingGoal = goals.find((item) => item.id === editingGoalId) ?? goal;
  const primary = goals.find((g) => g.priority === "primary");
  const updateCarouselIndex = (offset: number) =>
    setIndex(
      Math.max(0, Math.min(goals.length - 1, Math.round(offset / cardWidth))),
    );
  const newGoal = () => {
    const v = Number(amount);
    if (title && v > 0) {
      addGoal(title, v);
      setTitle("");
      setAmount("");
      setCreate(false);
    }
  };
  const recordedIncome = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const recordedExpense = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const usableBalance = Math.max(
    0,
    initialBalance + recordedIncome - recordedExpense,
  );
  const openDeposit = () => {
    setAmount("");
    setDeposit(true);
  };
  const saveDeposit = () => {
    const value = Number(amount);
    if (!goal || !Number.isFinite(value) || value <= 0) {
      Alert.alert("请输入金额", "存入金额需要大于 0。");
      return;
    }
    if (value > usableBalance) {
      Alert.alert(
        "可用余额不足",
        `当前还可使用 ${money(usableBalance)}，请调整存入金额。`,
      );
      return;
    }
    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
    if (value > remaining) {
      Alert.alert(
        "超过目标金额",
        `这个目标还差 ${money(remaining)}，请存入不超过该金额的数目。`,
      );
      return;
    }
    const reachedTarget = goal.savedAmount + value >= goal.targetAmount;
    depositToGoal(goal.id, value);
    setAmount("");
    setDeposit(false);
    if (reachedTarget) {
      setCompleteGoal({ ...goal, savedAmount: goal.targetAmount });
      setCompletionNote("");
    }
  };
  const finishGoal = () => {
    if (!completeGoal) return;
    archiveGoal(completeGoal.id, completionNote);
    setCompleteGoal(null);
    setIndex(0);
  };
  const openManage = (target: SavingGoal = goal) => {
    if (!target) return;
    setEditingGoalId(target.id);
    setEditTitle(target.title);
    setEditAmount(String(target.targetAmount));
    setEditPriority(target.priority);
    setManage(true);
  };
  const saveManage = () => {
    const value = Number(editAmount);
    if (editingGoal && editTitle.trim() && value > 0) {
      updateGoal(editingGoal.id, {
        title: editTitle.trim(),
        targetAmount: value,
        priority: editPriority,
      });
      setManage(false);
    }
  };
  const removeGoal = () => {
    if (!editingGoal) return;
    Alert.alert(
      "删除目标？",
      `将删除「${editingGoal.title}」，此操作无法恢复。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            deleteGoal(editingGoal.id);
            setIndex(0);
            setManage(false);
          },
        },
      ],
    );
  };
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.head}>
          <Text style={s.title}>计划</Text>
          <View style={m.headActions}>
            <Pressable style={m.manageButton} onPress={() => setGoalList(true)}>
              <Text style={m.manageText}>管理</Text>
            </Pressable>
            <Pressable style={s.add} onPress={() => setCreate(true)}>
              <Text style={s.addText}>＋ 添加目标</Text>
            </Pressable>
          </View>
        </View>
        {goal ? (
          <>
            <FlatList
              style={{ width: cardWidth }}
              data={goals}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(g) => g.id}
              snapToInterval={cardWidth}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={(e) =>
                updateCarouselIndex(e.nativeEvent.contentOffset.x)
              }
              onMomentumScrollEnd={(e) =>
                updateCarouselIndex(e.nativeEvent.contentOffset.x)
              }
              renderItem={({ item, index: i }) => (
                <GoalHero
                  goal={item}
                  number={i + 1}
                  total={goals.length}
                  cardWidth={cardWidth}
                />
              )}
            />
            <View style={s.dots}>
              {goals.map((g, i) => (
                <View key={g.id} style={[s.dot, i === index && s.dotOn]} />
              ))}
            </View>
            {goal.priority === "primary" ? (
              <Primary goal={goal} onDeposit={() => setDeposit(true)} />
            ) : goal.priority === "ongoing" ? (
              <Ongoing
                goal={goal}
                primary={primary?.title ?? "旅行基金"}
                onMakePrimary={() => setPriority(goal.id, "primary")}
              />
            ) : (
              <Waiting
                onMakePrimary={() => setPriority(goal.id, "primary")}
                onOngoing={() => setPriority(goal.id, "ongoing")}
              />
            )}
          </>
        ) : (
          <Card style={m.empty}>
            <Ionicons name="sparkles-outline" size={42} color={colors.purple} />
            <Text style={m.emptyTitle}>还没有存钱目标</Text>
            <Text style={m.emptyCopy}>
              从一个想实现的小目标开始，让每一笔钱都有去处。
            </Text>
            <Pressable style={s.yellowBtn} onPress={() => setCreate(true)}>
              <Text style={s.btnText}>＋ 创建第一个目标</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
      <BottomNav />
      <GoalListModal
        visible={goalList}
        goals={goals}
        onClose={() => setGoalList(false)}
        onSelect={(item, itemIndex) => {
          setGoalList(false);
          setIndex(itemIndex);
          openManage(item);
        }}
        onAdd={() => {
          setGoalList(false);
          setCreate(true);
        }}
      />
      <ModalShell
        visible={create}
        title="添加目标"
        onClose={() => setCreate(false)}
      >
        <Field
          label="目标名称"
          value={title}
          onChange={setTitle}
          placeholder="例如：新耳机"
        />
        <Field
          label="目标金额"
          value={amount}
          onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
          placeholder="¥ 0"
          keyboard="decimal-pad"
        />
        <Pressable style={s.yellowBtn} onPress={newGoal}>
          <Text style={s.btnText}>创建目标</Text>
        </Pressable>
      </ModalShell>
      <ModalShell
        visible={deposit}
        title={`存入「${goal?.title ?? ""}」`}
        onClose={() => setDeposit(false)}
      >
        <Field
          label="存入金额"
          value={amount}
          onChange={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
          placeholder="¥ 0"
          keyboard="decimal-pad"
        />
        <Pressable style={s.yellowBtn} onPress={saveDeposit}>
          <Text style={s.btnText}>确认存入</Text>
        </Pressable>
      </ModalShell>
      <ModalShell
        visible={manage}
        title="管理目标"
        onClose={() => setManage(false)}
      >
        <Field
          label="目标名称"
          value={editTitle}
          onChange={setEditTitle}
          placeholder="例如：旅行基金"
        />
        <Field
          label="目标金额"
          value={editAmount}
          onChange={(v) => setEditAmount(v.replace(/[^0-9.]/g, ""))}
          placeholder="¥ 0"
          keyboard="decimal-pad"
        />
        <Text style={s.field}>目标状态</Text>
        <View style={m.priorityRow}>
          {(["primary", "ongoing", "waiting"] as SavingGoal["priority"][]).map(
            (priority) => (
              <Pressable
                key={priority}
                style={[
                  m.priorityButton,
                  editPriority === priority && m.priorityButtonOn,
                ]}
                onPress={() => setEditPriority(priority)}
              >
                <Text
                  style={[
                    m.priorityText,
                    editPriority === priority && m.priorityTextOn,
                  ]}
                >
                  {priority === "primary"
                    ? "当前优先"
                    : priority === "ongoing"
                      ? "持续进行"
                      : "暂时等待"}
                </Text>
              </Pressable>
            ),
          )}
        </View>
        <Pressable style={s.yellowBtn} onPress={saveManage}>
          <Text style={s.btnText}>保存修改</Text>
        </Pressable>
        <Pressable style={m.deleteButton} onPress={removeGoal}>
          <Text style={m.deleteText}>删除这个目标</Text>
        </Pressable>
      </ModalShell>
      <CompletionModal
        goal={completeGoal}
        note={completionNote}
        onNote={setCompletionNote}
        onConfirm={finishGoal}
        onClose={() => setCompleteGoal(null)}
      />
    </SafeAreaView>
  );
}
const m = StyleSheet.create({
  headActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  manageButton: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: colors.ink,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.paper,
  },
  manageText: { color: colors.ink, fontWeight: "900", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 22 },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyCopy: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  priorityRow: { flexDirection: "row", gap: 7, marginBottom: 18 },
  priorityButton: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  priorityButtonOn: { borderColor: colors.ink, backgroundColor: "#FFF0B7" },
  priorityText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  priorityTextOn: { color: colors.ink },
  deleteButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
  },
  deleteText: { color: colors.red, fontWeight: "900", fontSize: 14 },
  goalListHint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 12 },
  goalList: { maxHeight: 330 },
  goalListContent: { gap: 9, paddingBottom: 4 },
  goalRow: { minHeight: 70, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFF", borderRadius: 17, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  goalMarker: { width: 11, height: 42, borderRadius: 8 },
  goalRowCopy: { flex: 1 },
  goalRowTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  goalRowMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  goalStatus: { color: colors.purple, fontSize: 11, fontWeight: "900" },
  completionBackdrop: {
    flex: 1,
    backgroundColor: "rgba(21,21,27,.32)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  completionCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.paper,
    borderRadius: 27,
    borderWidth: 1.3,
    borderColor: colors.ink,
    padding: 23,
    alignItems: "center",
  },
  completionIcon: {
    height: 72,
    width: 72,
    borderRadius: 25,
    backgroundColor: "#FFE2EA",
    borderWidth: 1.2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 15,
  },
  completionCopy: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 4,
  },
  laterButton: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  laterText: { color: colors.muted, fontWeight: "800", fontSize: 13 },
});
function goalHeroColor(index: number) {
  return [colors.coral, colors.purple, "#2F3E93", "#168B89"][(index - 1) % 4];
}
function GoalHero({
  goal,
  number,
  total,
  cardWidth,
}: {
  goal: SavingGoal;
  number: number;
  total: number;
  cardWidth: number;
}) {
  const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
  return (
    <View
      style={[
        s.hero,
        { width: cardWidth, backgroundColor: goalHeroColor(number) },
      ]}
    >
      <View style={s.heroTop}>
        <Text style={s.pill}>
          {goal.priority === "primary"
            ? "当前优先"
            : goal.priority === "ongoing"
              ? "持续进行"
              : "暂时等待"}
        </Text>
        <Text style={s.counter}>
          {number} / {total}
        </Text>
      </View>
      <View style={s.heroMid}>
        <View style={{ flex: 1 }}>
          <Text style={s.goalTitle}>{goal.title}</Text>
          <Text style={s.goalSub}>{goal.subtitle}</Text>
          <Text style={s.goalLabel}>目标金额</Text>
          <Text style={s.goalAmount}>{money(goal.targetAmount)}</Text>
        </View>
        <View style={s.art}>
          <Ionicons
            name={
              goal.illustration === "travel"
                ? "sunny-outline"
                : goal.illustration === "laptop"
                  ? "laptop-outline"
                  : goal.illustration === "concert"
                    ? "musical-notes-outline"
                    : "camera-outline"
            }
            size={78}
            color="#FFF"
          />
        </View>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct}%` }]} />
      </View>
      <View style={s.progressLabel}>
        <Text style={{ color: "#FFF", fontWeight: "700" }}>
          已存 {money(goal.savedAmount)}
        </Text>
        <Text style={{ color: colors.yellow, fontSize: 19, fontWeight: "900" }}>
          {pct}%
        </Text>
      </View>
    </View>
  );
}
function Primary({
  goal,
  onDeposit,
}: {
  goal: SavingGoal;
  onDeposit: () => void;
}) {
  const { initialBalance, nextIncomeDays, transactions } = useFinanceStore();
  const income = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const current = Math.max(0, initialBalance + income - expense);
  const usable = Math.max(0, current - goal.monthlyContribution);
  const days = Math.max(1, nextIncomeDays);
  const daily = Math.floor(usable / days);
  const breakfast = Math.floor(daily * 0.14);
  const lunch = Math.floor(daily * 0.25);
  const dinner = Math.floor(daily * 0.25);
  const transport = Math.floor(daily * 0.11);
  const fun = Math.max(0, daily - breakfast - lunch - dinner - transport);
  const budgetIcons = [
    require("../../assets/icon-toast-hd.png"),
    require("../../assets/icon-salad-hd.png"),
    require("../../assets/icon-noodles-hd.png"),
    require("../../assets/icon-transit-mobile.png"),
    require("../../assets/icon-smile-hd.png"),
  ];
  const items = [
    ["🍞", "早餐", breakfast],
    ["🥗", "午餐", lunch],
    ["🍲", "晚餐", dinner],
    ["🚌", "出行", transport],
    ["☺", "娱乐", fun],
  ];
  return (
    <>
      <Section title="目标进度" action="管理 ›">
        <Card>
          <View style={s.metrics}>
            <Metric label="目标金额" value={money(goal.targetAmount)} />
            <Metric label="已存金额" value={money(goal.savedAmount)} />
            <Metric
              label="剩余金额"
              value={money(goal.targetAmount - goal.savedAmount)}
            />
          </View>
          <View style={s.line} />
          <View style={s.metrics}>
            <Metric label="预计完成" value="4 个月后" />
            <Metric label="每月需存" value={money(goal.monthlyContribution)} />
          </View>
          <Pressable style={s.deposit} onPress={onDeposit}>
            <Text style={s.btnText}>＋ 存入目标</Text>
          </Pressable>
        </Card>
      </Section>
      <Section title="每日消费建议" action={money(daily)}>
        <Card>
          <Text style={s.hint}>
            当前可自由使用 {money(usable)} · 距下次收入 {days} 天
          </Text>
          <View style={s.budgets}>
            {items.map((item, iconIndex) => (
              <View key={item[1]} style={s.budget}>
                <Image
                  source={budgetIcons[iconIndex]}
                  style={[s.budgetImage, iconIndex === 3 && s.transitBudgetImage]}
                  accessibilityLabel={String(item[1])}
                />
                <Text style={s.budgetLabel}>{item[1]}</Text>
                <Text style={s.budgetVal}>{money(item[2] as number)}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>
    </>
  );
}
function Ongoing({
  goal,
  primary,
  onMakePrimary,
}: {
  goal: SavingGoal;
  primary: string;
  onMakePrimary: () => void;
}) {
  return (
    <Section title={goal.title}>
      <Card>
        <Text style={s.protect}>优先保障：{primary}</Text>
        <Text style={s.copy}>扣除当前优先计划后，可以为这个目标慢慢留下：</Text>
        <Text style={s.month}>
          {money(goal.monthlyContribution)}
          <Text style={s.monthSmall}> / 月</Text>
        </Text>
        <Text style={s.week}>
          约 {money(Math.ceil(goal.monthlyContribution / 4.33))} / 周
        </Text>
        <Pressable style={s.outline} onPress={onMakePrimary}>
          <Text style={s.outlineText}>设为当前优先</Text>
        </Pressable>
      </Card>
    </Section>
  );
}
function Waiting({
  onMakePrimary,
  onOngoing,
}: {
  onMakePrimary: () => void;
  onOngoing: () => void;
}) {
  return (
    <Card style={s.wait}>
      <Text style={{ fontSize: 42 }}>☾</Text>
      <Text style={s.waitTitle}>这个目标正在等待</Text>
      <Text style={s.waitCopy}>
        目前没有固定资金分配，可以先把它设为优先或持续进行。
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
        }}
      >
        <Pressable style={s.yellowBtn} onPress={onMakePrimary}>
          <Text style={s.btnText}>设为优先</Text>
        </Pressable>
        <Pressable
          style={[s.outline, { height: 46, marginTop: 0 }]}
          onPress={onOngoing}
        >
          <Text style={s.outlineText}>持续进行</Text>
        </Pressable>
      </View>
    </Card>
  );
}
function GoalListModal({
  visible,
  goals,
  onClose,
  onSelect,
  onAdd,
}: {
  visible: boolean;
  goals: SavingGoal[];
  onClose: () => void;
  onSelect: (goal: SavingGoal, index: number) => void;
  onAdd: () => void;
}) {
  return (
    <ModalShell visible={visible} title="我的目标" onClose={onClose}>
      <Text style={m.goalListHint}>选择一个目标，即可编辑金额、优先级或删除它。</Text>
      <ScrollView style={m.goalList} contentContainerStyle={m.goalListContent}>
        {goals.map((goal, index) => {
          const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
          return (
            <Pressable key={goal.id} style={m.goalRow} onPress={() => onSelect(goal, index)}>
              <View style={[m.goalMarker, { backgroundColor: goalHeroColor(index + 1) }]} />
              <View style={m.goalRowCopy}>
                <Text style={m.goalRowTitle}>{goal.title}</Text>
                <Text style={m.goalRowMeta}>
                  已存 {money(goal.savedAmount)} · {progress}%
                </Text>
              </View>
              <Text style={m.goalStatus}>
                {goal.priority === "primary" ? "当前优先" : goal.priority === "ongoing" ? "持续进行" : "暂时等待"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={s.addGoalInList} onPress={onAdd}>
        <Text style={s.addText}>＋ 添加新目标</Text>
      </Pressable>
    </ModalShell>
  );
}

function CompletionModal({
  goal,
  note,
  onNote,
  onConfirm,
  onClose,
}: {
  goal: SavingGoal | null;
  note: string;
  onNote: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={goal !== null} animationType="fade">
      <View style={m.completionBackdrop}>
        <View style={m.completionCard}>
          <View style={m.completionIcon}>
            <Ionicons name="sparkles" size={36} color={colors.pink} />
          </View>
          <Text style={m.completionTitle}>目标完成！</Text>
          <Text style={m.completionCopy}>
            你已经为「{goal?.title ?? ""}」存够了{" "}
            {goal ? money(goal.targetAmount) : ""}。
          </Text>
          <Text style={s.field}>留下一句纪念（可选）</Text>
          <TextInput
            value={note}
            onChangeText={onNote}
            placeholder="例如：终于可以出发了！"
            placeholderTextColor={colors.muted}
            multiline
            style={[s.input, { height: 80, paddingTop: 14 }]}
          />
          <Pressable style={s.yellowBtn} onPress={onConfirm}>
            <Text style={s.btnText}>收入我的图鉴</Text>
          </Pressable>
          <Pressable style={m.laterButton} onPress={onClose}>
            <Text style={m.laterText}>稍后再说</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.metricL}>{label}</Text>
      <Text numberOfLines={1} style={s.metricV}>
        {value}
      </Text>
    </View>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: "decimal-pad";
}) {
  return (
    <>
      <Text style={s.field}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboard}
        style={s.input}
      />
    </>
  );
}
function ModalShell({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modal}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { width: "100%", maxWidth: 480, alignSelf: "center", padding: 20, paddingBottom: 104, gap: 16 },
  head: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 23, fontWeight: "900", color: colors.ink, letterSpacing: -0.3 },
  add: {
    backgroundColor: colors.purple,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 13,
  },
  addText: { color: "#FFF", fontWeight: "900" },
  hero: {
    height: 266,
    padding: 19,
    borderRadius: 20,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between" },
  pill: {
    backgroundColor: colors.yellow,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    fontWeight: "900",
    fontSize: 12,
  },
  counter: { color: "#FFF", fontWeight: "900" },
  heroMid: { flex: 1, flexDirection: "row", alignItems: "center" },
  goalTitle: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  goalSub: { color: "#FFF0F3", fontSize: 13, marginTop: 5, lineHeight: 18 },
  goalLabel: { color: "#FFE9ED", fontSize: 11, marginTop: 14 },
  goalAmount: { color: "#FFF", fontSize: 22, fontWeight: "900", marginTop: 3 },
  art: { width: 115, alignItems: "center" },
  track: {
    height: 12,
    backgroundColor: "#261C27",
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 8, backgroundColor: colors.yellow },
  progressLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
    marginTop: -6,
  },
  dot: { height: 9, width: 9, borderRadius: 5, backgroundColor: "#DEDEDD" },
  dotOn: { width: 22, backgroundColor: colors.yellow },
  metrics: { flexDirection: "row", gap: 8 },
  metricL: { color: colors.muted, fontSize: 11 },
  metricV: { color: colors.ink, fontWeight: "900", marginTop: 6 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 15 },
  deposit: {
    marginTop: 16,
    height: 47,
    backgroundColor: colors.yellow,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  btnText: { color: colors.ink, fontWeight: "900" },
  hint: { color: colors.muted, fontSize: 12 },
  budgets: { flexDirection: "row", marginTop: 16 },
  budget: { flex: 1, alignItems: "center" },
  budgetImage: { height: 35, width: 35, resizeMode: "contain" },
  transitBudgetImage: { height: 44, width: 44, marginLeft: -5, marginBottom: -1 },
  budgetLabel: { color: colors.muted, fontSize: 10, marginTop: 5 },
  budgetVal: {
    color: colors.ink,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 4,
  },
  protect: { color: colors.green, fontWeight: "900" },
  copy: { color: colors.muted, marginTop: 12, lineHeight: 21 },
  month: { color: colors.ink, fontWeight: "900", fontSize: 38, marginTop: 17 },
  monthSmall: { color: colors.muted, fontSize: 14 },
  week: { color: colors.purple, fontWeight: "900", marginTop: 3 },
  outline: {
    borderWidth: 1.2,
    borderColor: colors.ink,
    height: 44,
    paddingHorizontal: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  outlineText: { color: colors.ink, fontWeight: "900" },
  wait: { alignItems: "center", paddingVertical: 27 },
  waitTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8,
  },
  waitCopy: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
  },
  yellowBtn: {
    backgroundColor: colors.yellow,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  addGoalInList: {
    backgroundColor: colors.purple,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    padding: 20,
    paddingBottom: 34,
  },
  sheetTitle: { fontSize: 24, fontWeight: "900", color: colors.ink },
  field: {
    color: colors.muted,
    marginTop: 18,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 53,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    color: colors.ink,
  },
});
