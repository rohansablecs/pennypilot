export type CashFlowExpense = {
  amount: number | string;
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

  transactionCount: number;

  forecastStatus:
    | "healthy"
    | "watch"
    | "over-budget"
    | "no-budget"
    | "insufficient-data";
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

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

function isSameMonth(
  date: Date,
  reference: Date
) {
  return (
    date.getFullYear() ===
      reference.getFullYear() &&
    date.getMonth() ===
      reference.getMonth()
  );
}

export function calculateCashFlowForecast(
  expenses: CashFlowExpense[],
  budget: number,
  referenceDate = new Date()
): CashFlowForecast {
  const monthStart =
    startOfMonth(referenceDate);

  const monthEnd =
    endOfMonth(referenceDate);

  const daysInMonth =
    monthEnd.getDate();

  const daysElapsed = Math.max(
    1,
    Math.min(
      referenceDate.getDate(),
      daysInMonth
    )
  );

  /*
   * Only count valid, non-negative,
   * current-month transactions.
   *
   * Future-dated transactions are deliberately
   * excluded from current spending velocity.
   */
  const monthExpenses =
    expenses.filter((expense) => {
      const date = parseDate(
        expense.expense_date
      );

      if (!date) return false;

      if (date < monthStart) {
        return false;
      }

      if (date > referenceDate) {
        return false;
      }

      return isSameMonth(
        date,
        referenceDate
      );
    });

  const currentSpend =
    monthExpenses.reduce(
      (sum, expense) => {
        const amount =
          Number(expense.amount);

        if (
          !Number.isFinite(amount) ||
          amount < 0
        ) {
          return sum;
        }

        return sum + amount;
      },
      0
    );

  const safeBudget =
    Number.isFinite(budget) &&
    budget > 0
      ? budget
      : 0;

  /*
   * No transactions means we cannot establish
   * a spending velocity.
   */
  if (currentSpend <= 0) {
    return {
      currentSpend: 0,
      dailyBurn: 0,
      projectedMonthEnd: 0,

      budget: safeBudget,
      remainingBudget: safeBudget,
      budgetUtilization: 0,
      projectedOverrun: 0,

      daysUntilBudgetExhaustion: null,

      projected30DayOutflow: 0,

      daysElapsed,
      daysInMonth,

      transactionCount:
        monthExpenses.length,

      forecastStatus:
        "insufficient-data",
    };
  }

  const dailyBurn =
    currentSpend / daysElapsed;

  const projectedMonthEnd =
    dailyBurn * daysInMonth;

  const remainingBudget =
    Math.max(
      0,
      safeBudget - currentSpend
    );

  const budgetUtilization =
    safeBudget > 0
      ? (currentSpend / safeBudget) *
        100
      : 0;

  const projectedOverrun =
    safeBudget > 0
      ? Math.max(
          0,
          projectedMonthEnd -
            safeBudget
        )
      : 0;

  let daysUntilBudgetExhaustion:
    | number
    | null = null;

  if (safeBudget > 0) {
    if (currentSpend >= safeBudget) {
      daysUntilBudgetExhaustion = 0;
    } else if (dailyBurn > 0) {
      daysUntilBudgetExhaustion =
        Math.ceil(
          remainingBudget / dailyBurn
        );
    }
  }

  const projected30DayOutflow =
    dailyBurn * 30;

  let forecastStatus:
    | "healthy"
    | "watch"
    | "over-budget"
    | "no-budget"
    | "insufficient-data";

  if (safeBudget <= 0) {
    forecastStatus = "no-budget";
  } else if (
    projectedMonthEnd >
    safeBudget
  ) {
    forecastStatus = "over-budget";
  } else if (
    projectedMonthEnd >=
    safeBudget * 0.85
  ) {
    forecastStatus = "watch";
  } else {
    forecastStatus = "healthy";
  }

  return {
    currentSpend: round(
      currentSpend
    ),

    dailyBurn: round(
      dailyBurn
    ),

    projectedMonthEnd: round(
      projectedMonthEnd
    ),

    budget: round(
      safeBudget
    ),

    remainingBudget: round(
      remainingBudget
    ),

    budgetUtilization: round(
      budgetUtilization
    ),

    projectedOverrun: round(
      projectedOverrun
    ),

    daysUntilBudgetExhaustion,

    projected30DayOutflow: round(
      projected30DayOutflow
    ),

    daysElapsed,
    daysInMonth,

    transactionCount:
      monthExpenses.length,

    forecastStatus,
  };
}