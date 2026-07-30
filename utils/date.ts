export const daysUntilIncome = (nextIncomeDate: string, fallbackDays: number) => {
  if (!nextIncomeDate) return Math.max(0, Math.floor(fallbackDays));
  const target = new Date(`${nextIncomeDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return Math.max(0, Math.floor(fallbackDays));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
};
