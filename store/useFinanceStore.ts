import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  CollectionItem,
  GoalPriority,
  SavingGoal,
  Transaction,
  TransactionKind,
} from "../types/finance";

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const suggestionForGoal = (amount: number, monthlyFree: number) => {
  const fourMonthPlan = Math.ceil(Math.max(0, amount) / 4);
  return monthlyFree > 0 ? Math.min(amount, Math.max(fourMonthPlan, Math.round(monthlyFree * 0.6))) : fourMonthPlan;
};

const allocateGoalContributions = (goals: SavingGoal[], monthlyIncome: number, fixedExpenses: number) => {
  const available = Math.max(0, monthlyIncome - fixedExpenses);
  const primary = goals.find((goal) => goal.priority === 'primary');
  const ongoing = goals.filter((goal) => goal.priority === 'ongoing');
  const primarySuggestion = primary
    ? suggestionForGoal(Math.max(0, primary.targetAmount - primary.savedAmount), available)
    : 0;
  const ongoingPool = Math.max(0, available - primarySuggestion);
  const ongoingSuggestion = ongoing.length ? Math.floor(ongoingPool / ongoing.length) : 0;

  return goals.map((goal) => {
    const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
    if (goal.priority === 'waiting') return { ...goal, monthlyContribution: 0 };
    if (goal.priority === 'primary') {
      return { ...goal, monthlyContribution: Math.min(remaining, primarySuggestion) };
    }
    const fallback = available <= 0 ? Math.ceil(remaining / 4) : ongoingSuggestion;
    return { ...goal, monthlyContribution: Math.min(remaining, Math.max(0, fallback)) };
  });
};

interface FinanceState {
  userName: string;
  initialBalance: number;
  referenceBalance: number;
  monthlyIncome: number;
  fixedExpenses: number;
  nextIncomeDays: number;
  nextIncomeDate: string;
  phoneNumber: string;
  reminders: {
    dailyRecord: boolean;
    payDay: boolean;
    goalDeposit: boolean;
    weeklyReview: boolean;
    time: string;
  };
  annualSummaryShownYear: number | null;
  onboardingComplete: boolean;
  transactions: Transaction[];
  goals: SavingGoal[];
  collection: CollectionItem[];
  incomeCategories: string[];
  expenseCategories: string[];
  addTransaction: (
    kind: TransactionKind,
    amount: number,
    title: string,
    category: string,
  ) => void;
  updateTransaction: (
    transactionId: string,
    update: Pick<Transaction, "kind" | "amount" | "title" | "category">,
  ) => void;
  deleteTransaction: (transactionId: string) => void;
  addGoal: (title: string, amount: number) => void;
  updateGoal: (
    goalId: string,
    update: Pick<SavingGoal, "title" | "targetAmount" | "priority">,
  ) => void;
  deleteGoal: (goalId: string) => void;
  depositToGoal: (goalId: string, amount: number) => void;
  archiveGoal: (goalId: string, note?: string) => void;
  setPriority: (goalId: string, priority: GoalPriority) => void;
  updateFinanceSettings: (input: {
    name: string;
    currentBalance: number;
    monthlyIncome: number;
    fixedExpenses: number;
    nextIncomeDays: number;
    nextIncomeDate?: string;
  }) => void;
  bindPhone: (phoneNumber: string) => void;
  signOut: () => void;
  updateReminders: (update: Partial<FinanceState["reminders"]>) => void;
  markAnnualSummaryShown: (year: number) => void;
  resetFinancialData: () => void;
  restoreDemoData: () => void;
  addCategory: (kind: TransactionKind, name: string) => void;
  deleteCategory: (kind: TransactionKind, name: string) => void;
  completeOnboarding: (input: {
    name: string;
    balance: number;
    monthlyIncome: number;
    fixedExpenses: number;
    nextIncomeDays: number;
    nextIncomeDate?: string;
    goalTitle?: string;
    goalAmount?: number;
  }) => void;
}

const initialGoals: SavingGoal[] = [
  {
    id: "travel",
    title: "旅行基金",
    subtitle: "去看世界，收集美好回忆！",
    targetAmount: 10000,
    savedAmount: 4260,
    monthlyContribution: 1435,
    priority: "primary",
    illustration: "travel",
  },
  {
    id: "laptop",
    title: "新电脑",
    subtitle: "为创作准备更好的设备。",
    targetAmount: 8000,
    savedAmount: 1200,
    monthlyContribution: 680,
    priority: "ongoing",
    illustration: "laptop",
  },
  {
    id: "concert",
    title: "演唱会",
    subtitle: "去现场感受喜欢的音乐。",
    targetAmount: 1500,
    savedAmount: 500,
    monthlyContribution: 200,
    priority: "ongoing",
    illustration: "concert",
  },
  {
    id: "camera",
    title: "相机",
    subtitle: "把喜欢的生活认真记录下来。",
    targetAmount: 6000,
    savedAmount: 0,
    monthlyContribution: 0,
    priority: "waiting",
    illustration: "camera",
  },
];

const demoTransactions: Transaction[] = [
  {
    id: "demo-lunch",
    title: "午餐",
    amount: 23,
    kind: "expense",
    category: "饮食",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-income",
    title: "兼职收入",
    amount: 400,
    kind: "income",
    category: "兼职",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-metro",
    title: "地铁出行",
    amount: 6,
    kind: "expense",
    category: "出行",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const demoCollection: CollectionItem[] = [
  {
    id: "demo-camera",
    title: "第一台相机",
    amount: 5200,
    completedAt: "2026-02-18",
    illustration: "camera",
  },
  {
    id: "demo-travel",
    title: "三亚旅行",
    amount: 3800,
    completedAt: "2026-05-10",
    illustration: "travel",
  },
  {
    id: "demo-concert",
    title: "演唱会门票",
    amount: 1280,
    completedAt: "2026-08-23",
    illustration: "concert",
  },
  {
    id: "demo-books",
    title: "专业书籍",
    amount: 360,
    completedAt: "2026-11-15",
    illustration: "laptop",
  },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      userName: "小满",
      initialBalance: 2909,
      referenceBalance: 5600,
      monthlyIncome: 5600,
      fixedExpenses: 0,
      nextIncomeDays: 18,
      nextIncomeDate: '',
      phoneNumber: "",
      reminders: {
        dailyRecord: true,
        payDay: true,
        goalDeposit: false,
        weeklyReview: true,
        time: "20:30",
      },
      annualSummaryShownYear: null,
      onboardingComplete: false,
      transactions: [
        {
          id: "lunch",
          title: "午餐",
          amount: 23,
          kind: "expense",
          category: "饮食",
          createdAt: new Date().toISOString(),
        },
        {
          id: "freelance",
          title: "兼职收入",
          amount: 400,
          kind: "income",
          category: "兼职",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "metro",
          title: "地铁出行",
          amount: 6,
          kind: "expense",
          category: "出行",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
      goals: initialGoals,
      collection: [
        {
          id: "camera-collection",
          title: "第一台相机",
          amount: 5200,
          completedAt: "2025-11-18",
          illustration: "camera",
          note: "终于有了第一台属于自己的相机。",
        },
        {
          id: "travel-collection",
          title: "三亚旅行",
          amount: 3800,
          completedAt: "2025-08-02",
          illustration: "travel",
        },
      ],
      incomeCategories: ["工资", "兼职", "奖金", "退款", "其他收入"],
      expenseCategories: [
        "饮食",
        "出行",
        "居住",
        "购物",
        "娱乐",
        "学习",
        "其他支出",
      ],
      addTransaction: (kind, amount, title, category) =>
        set((state) => ({
          transactions: [
            {
              id: id(),
              kind,
              amount,
              title,
              category,
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),
      updateTransaction: (transactionId, update) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, ...update }
              : transaction,
          ),
        })),
      deleteTransaction: (transactionId) =>
        set((state) => ({
          transactions: state.transactions.filter(
            (transaction) => transaction.id !== transactionId,
          ),
        })),
      addGoal: (title, amount) =>
        set((state) => {
          const goals: SavingGoal[] = [
            ...state.goals,
            {
              id: id(),
              title,
              subtitle: "慢慢靠近这个想要的生活。",
              targetAmount: amount,
              savedAmount: 0,
              monthlyContribution: 0,
              priority: "waiting",
              illustration: "camera",
            },
          ];
          return { goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses) };
        }),
      updateGoal: (goalId, update) =>
        set((state) => {
          const goals: SavingGoal[] = state.goals.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  ...update,
                  savedAmount: Math.min(goal.savedAmount, update.targetAmount),
                }
              : update.priority === "primary" && goal.priority === "primary"
                ? { ...goal, priority: "ongoing" }
                : goal,
          );
          return { goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses) };
        }),
      deleteGoal: (goalId) =>
        set((state) => {
          const deleted = state.goals.find((goal) => goal.id === goalId);
          const remaining = state.goals.filter((goal) => goal.id !== goalId);
          const goals: SavingGoal[] =
              deleted?.priority === "primary" && remaining.length > 0
                ? remaining.map((goal, index) =>
                    index === 0 ? { ...goal, priority: "primary" } : goal,
                  )
                : remaining;
          return { goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses) };
        }),
      depositToGoal: (goalId, amount) =>
        set((state) => {
          const goal = state.goals.find((item) => item.id === goalId);
          if (!goal || !Number.isFinite(amount) || amount <= 0) return state;

          const income = state.transactions
            .filter((item) => item.kind === "income")
            .reduce((sum, item) => sum + item.amount, 0);
          const expense = state.transactions
            .filter((item) => item.kind === "expense")
            .reduce((sum, item) => sum + item.amount, 0);
          const usableBalance = Math.max(
            0,
            state.initialBalance + income - expense,
          );
          const remainingForGoal = Math.max(
            0,
            goal.targetAmount - goal.savedAmount,
          );
          const depositedAmount = Math.min(
            amount,
            usableBalance,
            remainingForGoal,
          );

          if (depositedAmount <= 0) return state;

          const goals = state.goals.map((item) =>
              item.id === goalId
                ? { ...item, savedAmount: item.savedAmount + depositedAmount }
                : item,
            );
          return {
            goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses),
            initialBalance: state.initialBalance - depositedAmount,
          };
        }),
      archiveGoal: (goalId, note) =>
        set((state) => {
          const completed = state.goals.find((goal) => goal.id === goalId);
          const remaining = state.goals.filter((goal) => goal.id !== goalId);
          if (!completed) return state;
          const goals: SavingGoal[] =
            completed.priority === "primary" && remaining.length > 0
              ? remaining.map((goal, index) =>
                  index === 0
                    ? { ...goal, priority: "primary" as const }
                    : goal,
                )
              : remaining;
          return {
            goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses),
            collection: [
              {
                id: id(),
                title: completed.title,
                amount: completed.targetAmount,
                completedAt: new Date().toISOString(),
                illustration: completed.illustration,
                note,
              },
              ...state.collection,
            ],
          };
        }),
      setPriority: (goalId, priority) =>
        set((state) => {
          const goals: SavingGoal[] = state.goals.map((goal) => ({
            ...goal,
            priority:
              goal.id === goalId
                ? priority
                : priority === "primary" && goal.priority === "primary"
                  ? "ongoing"
                  : goal.priority,
          }));
          return { goals: allocateGoalContributions(goals, state.monthlyIncome, state.fixedExpenses) };
        }),
      updateFinanceSettings: ({
        name,
        currentBalance,
        monthlyIncome,
        fixedExpenses,
        nextIncomeDays,
        nextIncomeDate,
      }) =>
        set((state) => {
          const income = state.transactions
            .filter((transaction) => transaction.kind === "income")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
          const expense = state.transactions
            .filter((transaction) => transaction.kind === "expense")
            .reduce((sum, transaction) => sum + transaction.amount, 0);
          const goals = allocateGoalContributions(state.goals, Math.max(0, monthlyIncome), Math.max(0, fixedExpenses));
          return {
            userName: name.trim() || state.userName,
            // Keep the balance visible on the home page equal to the amount just entered.
            initialBalance: Math.max(0, currentBalance - income + expense),
            referenceBalance: Math.max(currentBalance, monthlyIncome, 1),
            monthlyIncome: Math.max(0, monthlyIncome),
            fixedExpenses: Math.max(0, fixedExpenses),
            nextIncomeDays: Math.max(0, Math.floor(nextIncomeDays)),
            nextIncomeDate: nextIncomeDate ?? state.nextIncomeDate,
            goals,
          };
        }),
      bindPhone: (phoneNumber) => set({ phoneNumber: phoneNumber.trim() }),
      signOut: () => set({ onboardingComplete: false }),
      updateReminders: (update) =>
        set((state) => ({ reminders: { ...state.reminders, ...update } })),
      markAnnualSummaryShown: (year) => set({ annualSummaryShownYear: year }),
      resetFinancialData: () =>
        set({
          initialBalance: 0,
          referenceBalance: 1,
          monthlyIncome: 0,
          fixedExpenses: 0,
          transactions: [],
          goals: [],
          collection: [],
          annualSummaryShownYear: null,
        }),
      restoreDemoData: () =>
        set({
          initialBalance: 2909,
          referenceBalance: 5600,
          monthlyIncome: 5600,
          fixedExpenses: 0,
          nextIncomeDays: 18,
          nextIncomeDate: '',
          transactions: demoTransactions.map((item) => ({ ...item })),
          goals: initialGoals.map((item) => ({ ...item })),
          collection: demoCollection.map((item) => ({ ...item })),
          annualSummaryShownYear: null,
        }),
      addCategory: (kind, name) =>
        set((state) => {
          const value = name.trim();
          if (!value) return state;
          const key =
            kind === "income" ? "incomeCategories" : "expenseCategories";
          if (state[key].includes(value)) return state;
          return { [key]: [...state[key], value] };
        }),
      deleteCategory: (kind, name) =>
        set((state) => {
          const key =
            kind === "income" ? "incomeCategories" : "expenseCategories";
          if (state[key].length <= 1) return state;
          return { [key]: state[key].filter((category) => category !== name) };
        }),
      completeOnboarding: ({
        name,
        balance,
        monthlyIncome,
        fixedExpenses,
        nextIncomeDays,
        nextIncomeDate,
        goalTitle,
        goalAmount,
      }) =>
        set(() => ({
          userName: name.trim() || "小满",
          initialBalance: balance,
          referenceBalance: Math.max(balance, monthlyIncome, 1),
          monthlyIncome,
          fixedExpenses,
          nextIncomeDays,
          transactions: [],
          goals: allocateGoalContributions(
            goalTitle && goalAmount && goalAmount > 0
              ? [
                  {
                    id: id(),
                    title: goalTitle.trim(),
                    subtitle: "慢慢靠近想要的生活。",
                    targetAmount: goalAmount,
                    savedAmount: 0,
                    monthlyContribution: 0,
                    priority: "primary",
                    illustration: "travel",
                  },
                ]
              : [],
            monthlyIncome,
            fixedExpenses,
          ),
          nextIncomeDate: nextIncomeDate ?? '',
          collection: [],
          onboardingComplete: true,
        })),
    }),
    {
      name: "one-lamp-balance-state",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as FinanceState;
        return {
          ...state,
          nextIncomeDate: state.nextIncomeDate ?? '',
          goals: allocateGoalContributions(
            state.goals ?? [],
            state.monthlyIncome ?? 0,
            state.fixedExpenses ?? 0,
          ),
        };
      },
    },
  ),
);
