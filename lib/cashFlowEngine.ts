export type CashFlowExpense = {
  amount: number;
  expense_date: string;
};

export type CashFlowForecast = {
  currentSpend: number;
  dailyBurn: number;
  projectedMonthEnd: number;
  budget: number;
  remainingBudget: number;
  budgetUtilization: number;
  projectedOverrun: number;
  daysUntilBudgetExhaustion: number | null;
  projected30DayOutflow: number;
  daysElapsed: number;
  daysInMonth: number;
  forecastStatus:
    | "healthy"
    | "watch"
    | "over-budget"
    | "insufficient-data";
};

function startOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function sameMonth(date: Date, reference: Date) {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function calculateCashFlowForecast(
  expenses: CashFlowExpense[],
  budget: number,
  referenceDate = new Date()
): CashFlowForecast {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const daysInMonth = monthEnd.getDate();

  const daysElapsed = Math.max(
    1,
    Math.min(
      referenceDate.getDate(),
      daysInMonth
    )
  );

  const monthExpenses = expenses.filter((expense) => {
    const date = new Date(
      `${expense.expense_date}T00:00:00`
    );

    return sameMonth(date, referenceDate);
  });

  const currentSpend = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const dailyBurn = currentSpend / daysElapsed;

  const projectedMonthEnd =
    dailyBurn * daysInMonth;

  const remainingBudget = Math.max(
    0,
    budget - currentSpend
  );

  const budgetUtilization =
    budget > 0
      ? (currentSpend / budget) * 100
      : 0;

  const projectedOverrun = Math.max(
    0,
    projectedMonthEnd - budget
  );

  let daysUntilBudgetExhaustion:
    | number
    | null = null;

  if (dailyBurn > 0 && budget > currentSpend) {
    daysUntilBudgetExhaustion =
      Math.ceil(remainingBudget / dailyBurn);
  } else if (
    dailyBurn > 0 &&
    currentSpend >= budget
  ) {
    daysUntilBudgetExhaustion = 0;
  }

  const projected30DayOutflow =
    dailyBurn * 30;

  let forecastStatus:
    | "healthy"
    | "watch"
    | "over-budget"
    | "insufficient-data";

  if (currentSpend === 0) {
    forecastStatus = "insufficient-data";
  } else if (budget > 0 && projectedMonthEnd > budget) {
    forecastStatus = "over-budget";
  } else if (
    budget > 0 &&
    projectedMonthEnd >= budget * 0.85
  ) {
    forecastStatus = "watch";
  } else {
    forecastStatus = "healthy";
  }

  return {
    currentSpend,
    dailyBurn,
    projectedMonthEnd,
    budget,
    remainingBudget,
    budgetUtilization,
    projectedOverrun,
    daysUntilBudgetExhaustion,
    projected30DayOutflow,
    daysElapsed,
    daysInMonth,
    forecastStatus,
  };
}