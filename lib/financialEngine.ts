export type FinancialExpense = {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  payment_method: string;
  expense_date: string;
  notes?: string | null;
};

export type RecurringExpense = {
  vendor: string;
  category: string;
  averageAmount: number;
  lastAmount: number;
  occurrences: number;
  intervalDays: number;
  frequency: "Weekly" | "Monthly" | "Quarterly" | "Irregular";
  nextExpectedDate: string;
  confidence: number;
  totalSpent: number;
};

function normalizeVendor(vendor: string) {
  return vendor
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function daysBetween(a: string, b: string) {
  const first = new Date(`${a}T00:00:00`).getTime();
  const second = new Date(`${b}T00:00:00`).getTime();

  return Math.round(Math.abs(second - first) / 86400000);
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);

  return result.toISOString().slice(0, 10);
}

function average(values: number[]) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function classifyFrequency(intervalDays: number) {
  if (intervalDays >= 5 && intervalDays <= 9) {
    return "Weekly" as const;
  }

  if (intervalDays >= 25 && intervalDays <= 35) {
    return "Monthly" as const;
  }

  if (intervalDays >= 80 && intervalDays <= 100) {
    return "Quarterly" as const;
  }

  return "Irregular" as const;
}

export function detectRecurringExpenses(
  expenses: FinancialExpense[]
): RecurringExpense[] {
  const groups = new Map<string, FinancialExpense[]>();

  for (const expense of expenses) {
    const vendor = normalizeVendor(expense.vendor);

    if (!vendor) continue;

    const key = `${vendor}::${expense.category}`;

    const existing = groups.get(key) ?? [];
    existing.push(expense);
    groups.set(key, existing);
  }

  const recurring: RecurringExpense[] = [];

  for (const [, group] of groups) {
    if (group.length < 3) continue;

    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.expense_date).getTime() -
        new Date(b.expense_date).getTime()
    );

    const intervals: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      intervals.push(
        daysBetween(
          sorted[i - 1].expense_date,
          sorted[i].expense_date
        )
      );
    }

    if (!intervals.length) continue;

    const interval = average(intervals);

    const frequency = classifyFrequency(interval);

    if (frequency === "Irregular") continue;

    const intervalVariance =
      intervals.reduce(
        (sum, value) =>
          sum + Math.abs(value - interval),
        0
      ) / intervals.length;

    const timingConsistency = Math.max(
      0,
      1 - intervalVariance / Math.max(interval, 1)
    );

    const amounts = sorted.map((expense) =>
      Number(expense.amount)
    );

    const averageAmount = average(amounts);

    const amountVariance =
      amounts.reduce(
        (sum, value) =>
          sum +
          Math.abs(value - averageAmount) /
            Math.max(averageAmount, 1),
        0
      ) / amounts.length;

    const amountConsistency = Math.max(
      0,
      1 - amountVariance
    );

    const confidence = Math.min(
      99,
      Math.round(
        45 +
          timingConsistency * 30 +
          amountConsistency * 20 +
          Math.min(sorted.length, 10)
      )
    );

    const latest = sorted[sorted.length - 1];

    const nextExpectedDate = addDays(
      latest.expense_date,
      Math.round(interval)
    );

    recurring.push({
      vendor: latest.vendor,
      category: latest.category,
      averageAmount: Math.round(averageAmount * 100) / 100,
      lastAmount: Number(latest.amount),
      occurrences: sorted.length,
      intervalDays: Math.round(interval),
      frequency,
      nextExpectedDate,
      confidence,
      totalSpent: Math.round(
        amounts.reduce((sum, value) => sum + value, 0) * 100
      ) / 100,
    });
  }

  return recurring.sort(
    (a, b) => b.averageAmount - a.averageAmount
  );
}

export function calculateSpendingVelocity(
  expenses: FinancialExpense[]
) {
  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const previousMonthExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;

    return (
      date.getMonth() === previousMonth &&
      date.getFullYear() === previousYear
    );
  });

  const currentTotal = currentMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const previousTotal = previousMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const dayOfMonth = now.getDate();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const projectedMonthlySpend =
    dayOfMonth > 0
      ? (currentTotal / dayOfMonth) * daysInMonth
      : currentTotal;

  const changePercent =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  return {
    currentTotal,
    previousTotal,
    projectedMonthlySpend,
    changePercent,
    dayOfMonth,
    daysInMonth,
  };
}