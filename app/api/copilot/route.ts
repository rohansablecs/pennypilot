import { NextResponse } from "next/server";

import {
  calculateCashFlowForecast,
} from "@/lib/cashFlowEngine";

import {
  calculateSpendingVelocity,
  detectRecurringExpenses,
  FinancialExpense,
} from "@/lib/financialEngine";

import {
  analyzeVendors,
  calculateVendorConcentration,
} from "@/lib/vendorEngine";

export const runtime =
  "nodejs";

type Expense = FinancialExpense;

type Message = {
  role:
    | "user"
    | "assistant";
  content: string;
};

type RequestBody = {
  question: string;

  businessName: string;

  monthlyBudget: number;

  expenses: Expense[];

  conversation?: Message[];
};

const HF_URL =
  "https://router.huggingface.co/v1/chat/completions";

const HF_MODEL =
  "openai/gpt-oss-120b:groq";

function cleanToken(
  value: string
) {
  return value
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

function parseDate(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function validAmount(
  value: number | string
) {
  const amount =
    Number(value);

  return Number.isFinite(
    amount
  ) && amount > 0
    ? amount
    : 0;
}

function total(
  expenses: Expense[]
) {
  return expenses.reduce(
    (sum, expense) =>
      sum +
      validAmount(
        expense.amount
      ),
    0
  );
}

function getCurrentMonthExpenses(
  expenses: Expense[],
  referenceDate = new Date()
) {
  return expenses.filter(
    (expense) => {
      const date =
        parseDate(
          expense.expense_date
        );

      if (!date) {
        return false;
      }

      if (date > referenceDate) {
        return false;
      }

      return (
        date.getFullYear() ===
          referenceDate.getFullYear() &&
        date.getMonth() ===
          referenceDate.getMonth()
      );
    }
  );
}

function categories(
  expenses: Expense[]
) {
  const map =
    new Map<
      string,
      number
    >();

  for (const expense of expenses) {
    const category =
      expense.category?.trim() ||
      "Other";

    map.set(
      category,
      (map.get(
        category
      ) ?? 0) +
        validAmount(
          expense.amount
        )
    );
  }

  return [
    ...map.entries(),
  ]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .map(
      ([category, amount]) => ({
        category,
        amount,
      })
    );
}

function buildContext(
  expenses: Expense[],
  monthlyBudget: number
) {
  const referenceDate =
    new Date();

  const current =
    getCurrentMonthExpenses(
      expenses,
      referenceDate
    );

  const velocity =
    calculateSpendingVelocity(
      expenses,
      referenceDate
    );

  const forecast =
    calculateCashFlowForecast(
      expenses,
      monthlyBudget,
      referenceDate
    );

  const recurring =
    detectRecurringExpenses(
      expenses
    );

  const vendors =
    analyzeVendors(
      current.map(
        (expense) => ({
          id: expense.id,
          amount:
            validAmount(
              expense.amount
            ),
          category:
            expense.category,
          vendor:
            expense.vendor,
          expense_date:
            expense.expense_date,
        })
      )
    );

  const concentration =
    calculateVendorConcentration(
      vendors
    );

  const largestExpenses =
    [...current]
      .sort(
        (a, b) =>
          validAmount(
            b.amount
          ) -
          validAmount(
            a.amount
          )
      )
      .slice(0, 8)
      .map(
        (expense) => ({
          vendor:
            expense.vendor,

          category:
            expense.category,

          amount:
            validAmount(
              expense.amount
            ),

          date:
            expense.expense_date,

          paymentMethod:
            expense.payment_method,
        })
      );

  const monthlyRecurringCommitment =
    recurring
      .filter(
        (item) =>
          item.frequency ===
          "Monthly"
      )
      .reduce(
        (sum, item) =>
          sum +
          item.averageAmount,
        0
      );

  return {
    currentMonth:
      `${referenceDate.getFullYear()}-${String(
        referenceDate.getMonth() + 1
      ).padStart(2, "0")}`,

    transactionCount:
      current.length,

    currentSpend:
      velocity.currentTotal,

    previousMonthSpend:
      velocity.previousTotal,

    monthChangePercent:
      velocity.changePercent,

    projectedMonthlySpend:
      velocity.projectedMonthlySpend,

    dailyBurn:
      forecast.dailyBurn,

    projectedMonthEnd:
      forecast.projectedMonthEnd,

    projected30DayOutflow:
      forecast.projected30DayOutflow,

    budget:
      forecast.budget,

    remainingBudget:
      forecast.remainingBudget,

    budgetUtilization:
      forecast.budgetUtilization,

    projectedOverrun:
      forecast.projectedOverrun,

    daysUntilBudgetExhaustion:
      forecast.daysUntilBudgetExhaustion,

    forecastStatus:
      forecast.forecastStatus,

    categories:
      categories(current),

    vendors:
      vendors.slice(0, 10),

    vendorConcentration:
      concentration,

    recurringExpenses:
      recurring.slice(0, 10),

    monthlyRecurringCommitment,

    largestExpenses,
  };
}

function readableHFError(
  value: unknown
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const object =
      value as Record<
        string,
        unknown
      >;

    if (
      typeof object.message ===
      "string"
    ) {
      return object.message;
    }

    if (
      typeof object.error ===
      "string"
    ) {
      return object.error;
    }

    try {
      return JSON.stringify(
        value
      );
    } catch {
      return "Unknown Hugging Face error.";
    }
  }

  return "Unknown Hugging Face error.";
}

function sanitizeAnswer(
  value: string
) {
  return value
    .replace(
      /\\\[/g,
      ""
    )
    .replace(
      /\\\]/g,
      ""
    )
    .replace(
      /\\\(/g,
      ""
    )
    .replace(
      /\\\)/g,
      ""
    )
    .replace(
      /\\frac\{([^}]*)\}\{([^}]*)\}/g,
      "$1 ÷ $2"
    )
    .replace(
      /\\text\{([^}]*)\}/g,
      "$1"
    )
    .replace(
      /\\times/g,
      "×"
    )
    .replace(
      /\\approx/g,
      "≈"
    )
    .replace(
      /\\div/g,
      "÷"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .replace(
      /\b(you'?ll|you will|your business will)\s+be\s+bankrupt\b/gi,
      "your monthly budget will be exhausted"
    )
    .trim();
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const question =
      body.question?.trim();

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Please enter a question.",
        },
        {
          status: 400,
        }
      );
    }

    const rawToken =
      process.env.HF_TOKEN;

    if (!rawToken) {
      return NextResponse.json(
        {
          error:
            "HF_TOKEN is missing from .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const token =
      cleanToken(
        rawToken
      );

    const expenses =
      Array.isArray(
        body.expenses
      )
        ? body.expenses
        : [];

    const monthlyBudget =
      Number(
        body.monthlyBudget || 0
      );

    const financialContext =
      buildContext(
        expenses,
        monthlyBudget
      );

    const systemPrompt = `
You are PennyPilot Copilot.

You are the financial intelligence assistant
inside PennyPilot, a financial analytics platform
for MSMEs.

BUSINESS:
${body.businessName || "Unknown"}

Your job is to explain the supplied financial data
accurately and concisely.

========================
STRICT DATA RULES
========================

1. Use ONLY the supplied financial context.

2. Never invent:
   - revenue
   - profit
   - cash balance
   - bank balance
   - assets
   - liabilities
   - loans
   - income
   - transactions
   - vendors
   - dates
   - amounts

3. Do not claim access to bank accounts.

4. You may calculate arithmetic from supplied values.

5. If data is insufficient, explicitly say so.

6. Never treat a forecast as a guaranteed outcome.

7. Never call the business bankrupt or insolvent
   based only on expense and budget data.

8. Distinguish:
   - actual spending
   - projected spending
   - budget exhaustion
   - financial insolvency

9. Use ₹ for Indian currency.

10. Keep answers concise.

11. Use short paragraphs or bullets.

12. Do not use markdown tables.

13. Do not use LaTeX.

14. If explaining an increase in spending, identify
    the actual categories, vendors, or transactions
    responsible.

15. If discussing recurring expenses, clearly describe
    them as detected patterns rather than guaranteed
    future charges.

16. If discussing Watchtower-style unusual spending,
    call it an unusual spending signal, not fraud.

========================
FORECAST LANGUAGE
========================

Correct:

"At the current spending pace, PennyPilot projects
approximately ₹85,000 in month-end spending."

Correct:

"Your remaining monthly budget would last about
6 days at the current daily burn."

Incorrect:

"You will run out of money in 6 days."

Incorrect:

"You will become bankrupt in 6 days."

The dataset contains expenses and a monthly budget.
It does not establish insolvency.

========================
FINANCIAL CONTEXT
========================

${JSON.stringify(
  financialContext,
  null,
  2
)}
`;

    const history =
      Array.isArray(
        body.conversation
      )
        ? body.conversation
            .slice(-8)
            .filter(
              (message) =>
                message &&
                (
                  message.role ===
                    "user" ||
                  message.role ===
                    "assistant"
                ) &&
                typeof message.content ===
                  "string"
            )
        : [];

    const messages = [
      {
        role: "system" as const,
        content:
          systemPrompt,
      },

      ...history,

      {
        role: "user" as const,
        content:
          question,
      },
    ];

    const response =
      await fetch(
        HF_URL,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            model:
              HF_MODEL,

            messages,

            temperature: 0.2,

            max_tokens: 700,

            stream: false,
          }),

          cache:
            "no-store",
        }
      );

    const raw =
      await response.text();

    let data: any =
      null;

    try {
      data =
        JSON.parse(
          raw
        );
    } catch {
      data = null;
    }

    if (
      !response.ok
    ) {
      console.error(
        "Hugging Face status:",
        response.status
      );

      console.error(
        "Hugging Face body:",
        raw
      );

      return NextResponse.json(
        {
          error:
            `Hugging Face ${response.status}: ${readableHFError(
              data?.error ??
                data?.message ??
                raw
            )}`,
        },
        {
          status: 502,
        }
      );
    }

    let answer =
      data?.choices?.[0]
        ?.message
        ?.content;

    if (
      typeof answer !==
        "string" ||
      !answer.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Hugging Face returned an empty or invalid response.",
        },
        {
          status: 502,
        }
      );
    }

    answer =
      sanitizeAnswer(
        answer
      );

    return NextResponse.json({
      answer,

      model:
        HF_MODEL,

      stats: {
        currentSpend:
          financialContext.currentSpend,

        budget:
          financialContext.budget,

        remainingBudget:
          financialContext.remainingBudget,

        transactionCount:
          financialContext.transactionCount,

        recurringItems:
          financialContext
            .recurringExpenses
            .length,

        forecastStatus:
          financialContext
            .forecastStatus,
      },
    });
  } catch (error) {
    console.error(
      "PennyPilot Copilot error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Copilot failed unexpectedly.",
      },
      {
        status: 500,
      }
    );
  }
}