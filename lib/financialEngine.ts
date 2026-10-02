export type FinancialExpense = {
  id: string;
  amount: number | string;
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

export type SpendingVelocity = {
  currentTotal: number;
  previousTotal: number;
  projectedMonthlySpend: number;
  changePercent: number | null;
  dayOfMonth: number;
  daysInMonth: number;
  currentTransactionCount: number;
  previousTransactionCount: number;
};

function normalizeVendor(vendor: string) {
  return vendor
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function parseAmount(value: number | string) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0
    ? amount
    : 0;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a: string, b: string) {
  const first = parseDate(a);
  const second = parseDate(b);

  if (!first || !second) return 0;

  return Math.round(
    Math.abs(second.getTime() - first.getTime()) / 86400000
  );
}

function addDays(date: string, days: number) {
  const result = parseDate(date);

  if (!result) return date;

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

function median(values: number[]) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
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

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

/* =========================================================
   RECURRING EXPENSE DETECTION
   ========================================================= */

export function detectRecurringExpenses(
  expenses: FinancialExpense[]
): RecurringExpense[] {
  const groups = new Map<string, FinancialExpense[]>();

  for (const expense of expenses) {
    const amount = parseAmount(expense.amount);
    const vendor = normalizeVendor(expense.vendor);
    const date = parseDate(expense.expense_date);

    if (!vendor || !date || amount <= 0) {
      continue;
    }

    const category = expense.category?.trim() || "Uncategorized";

    const key = `${vendor}::${category}`;

    const existing = groups.get(key) ?? [];

    existing.push({
      ...expense,
      amount,
    });

    groups.set(key, existing);
  }

  const recurring: RecurringExpense[] = [];

  for (const group of groups.values()) {
    /*
     * Three observations are the minimum needed to identify
     * a meaningful repeating pattern.
     */
    if (group.length < 3) {
      continue;
    }

    const sorted = [...group].sort(
      (a, b) =>
        new Date(`${a.expense_date}T00:00:00`).getTime() -
        new Date(`${b.expense_date}T00:00:00`).getTime()
    );

    const intervals: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const interval = daysBetween(
        sorted[i - 1].expense_date,
        sorted[i].expense_date
      );

      if (interval > 0) {
        intervals.push(interval);
      }
    }

    /*
     * Need at least two valid intervals.
     */
    if (intervals.length < 2) {
      continue;
    }

    /*
     * Median is more robust than average because one delayed
     * payment should not completely distort the recurring pattern.
     */
    const interval = median(intervals);

    const frequency = classifyFrequency(interval);

    if (frequency === "Irregular") {
      continue;
    }

    /*
     * Timing consistency.
     *
     * Example:
     * 30, 31, 30 days -> highly consistent
     * 30, 45, 12 days -> poor consistency
     */
    const intervalDeviation = intervals.map(
      (value) => Math.abs(value - interval)
    );

    const averageDeviation = average(intervalDeviation);

    const timingConsistency = Math.max(
      0,
      1 - averageDeviation / Math.max(interval, 1)
    );

    const amounts = sorted
      .map((expense) => parseAmount(expense.amount))
      .filter((amount) => amount > 0);

    if (!amounts.length) {
      continue;
    }

    const averageAmount = average(amounts);

    /*
     * Amount consistency is deliberately conservative.
     * A subscription that jumps from ₹1,000 to ₹10,000
     * should not be treated as a highly reliable recurring cost.
     */
    const relativeAmountDeviation =
      amounts.reduce(
        (sum, value) =>
          sum +
          Math.abs(value - averageAmount) /
            Math.max(averageAmount, 1),
        0
      ) / amounts.length;

    const amountConsistency = Math.max(
      0,
      1 - relativeAmountDeviation
    );

    /*
     * Confidence combines:
     * - timing consistency
     * - amount consistency
     * - number of observations
     *
     * The score is intentionally conservative.
     */
    const observationScore = Math.min(
      15,
      Math.max(0, sorted.length - 2) * 3
    );

    const confidence = Math.min(
      99,
      Math.max(
        0,
        Math.round(
          35 +
            timingConsistency * 30 +
            amountConsistency * 20 +
            observationScore
        )
      )
    );

    /*
     * Don't surface extremely weak patterns.
     */
    if (confidence < 60) {
      continue;
    }

    const latest = sorted[sorted.length - 1];

    const lastAmount = parseAmount(latest.amount);

    const nextExpectedDate = addDays(
      latest.expense_date,
      Math.round(interval)
    );

    recurring.push({
      vendor: latest.vendor,
      category:
        latest.category?.trim() || "Uncategorized",

      averageAmount: round(averageAmount),

      lastAmount: round(lastAmount),

      occurrences: sorted.length,

      intervalDays: Math.round(interval),

      frequency,

      nextExpectedDate,

      confidence,

      totalSpent: round(
        amounts.reduce(
          (sum, value) => sum + value,
          0
        )
      ),
    });
  }

  return recurring.sort(
    (a, b) => b.averageAmount - a.averageAmount
  );
}

/* =========================================================
   SPENDING VELOCITY
   ========================================================= */

export function calculateSpendingVelocity(
  expenses: FinancialExpense[],
  referenceDate = new Date()
): SpendingVelocity {
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();

  const previousMonth =
    currentMonth === 0
      ? 11
      : currentMonth - 1;

  const previousYear =
    currentMonth === 0
      ? currentYear - 1
      : currentYear;

  const currentMonthExpenses =
    expenses.filter((expense) => {
      const date = parseDate(expense.expense_date);
      const amount = parseAmount(expense.amount);

      if (!date || amount <= 0) {
        return false;
      }

      /*
       * Prevent future-dated transactions from affecting
       * current spending velocity.
       */
      if (date > referenceDate) {
        return false;
      }

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

  const previousMonthExpenses =
    expenses.filter((expense) => {
      const date = parseDate(expense.expense_date);
      const amount = parseAmount(expense.amount);

      if (!date || amount <= 0) {
        return false;
      }

      return (
        date.getMonth() === previousMonth &&
        date.getFullYear() === previousYear
      );
    });

  const currentTotal =
    currentMonthExpenses.reduce(
      (sum, expense) =>
        sum + parseAmount(expense.amount),
      0
    );

  const previousTotal =
    previousMonthExpenses.reduce(
      (sum, expense) =>
        sum + parseAmount(expense.amount),
      0
    );

  const dayOfMonth = referenceDate.getDate();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const projectedMonthlySpend =
    dayOfMonth > 0
      ? (currentTotal / dayOfMonth) *
        daysInMonth
      : currentTotal;

  /*
   * If there is no previous-month baseline,
   * percentage growth is undefined rather than 0.
   */
  const changePercent =
    previousTotal > 0
      ? ((currentTotal - previousTotal) /
          previousTotal) *
        100
      : null;

  return {
    currentTotal: round(currentTotal),

    previousTotal: round(previousTotal),

    projectedMonthlySpend: round(
      projectedMonthlySpend
    ),

    changePercent:
      changePercent === null
        ? null
        : round(changePercent),

    dayOfMonth,

    daysInMonth,

    currentTransactionCount:
      currentMonthExpenses.length,

    previousTransactionCount:
      previousMonthExpenses.length,
  };
}