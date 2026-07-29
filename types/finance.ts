export type TransactionKind = 'income' | 'expense';
export type GoalPriority = 'primary' | 'ongoing' | 'waiting';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  createdAt: string;
}

export interface SavingGoal {
  id: string;
  title: string;
  subtitle: string;
  targetAmount: number;
  savedAmount: number;
  monthlyContribution: number;
  priority: GoalPriority;
  illustration: 'travel' | 'laptop' | 'concert' | 'camera';
}

export interface CollectionItem {
  id: string;
  title: string;
  amount: number;
  completedAt: string;
  illustration: SavingGoal['illustration'];
  note?: string;
}
