import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Expense = {
  id: string;
  amount: number | string;
  category: string;
  vendor: string;
  payment_method: string;
  expense_date: string;
  notes?: string | null;
};

type Message = {
  role: "user" | "assistant";
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

function cleanToken(value: string) {
  return value
    .trim()
    .replace(/^["']|["']$/g, "");
}

function total(expenses: Expense[]) {
  return expenses.reduce(
    (sum, expense) =>
      sum + Number(expense.amount || 0),
    0
  );
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function getMonth(offset = 0) {
  const date = new Date();

  date.setMonth(
    date.getMonth() + offset
  );

  return date.toISOString().slice(0, 7);
}

function categories(expenses: Expense[]) {
  const map = new Map<string, number>();

  for (const expense of expenses) {
    const name =
      expense.category?.trim() || "Other";

    map.set(
      name,
      (map.get(name) || 0) +
        Number(expense.amount || 0)
    );
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
    }));
}

function vendors(expenses: Expense[]) {
  const map = new Map<
    string,
    {
      amount: number;
      count: number;
    }
  >();

  for (const expense of expenses) {
    const name =
      expense.vendor?.trim() || "Unknown";

    const existing = map.get(name);

    if (existing) {
      existing.amount += Number(
        expense.amount || 0
      );

      existing.count += 1;
    } else {
      map.set(name, {
        amount: Number(
          expense.amount || 0
        ),
        count: 1,
      });
    }
  }

  return [...map.entries()]
    .sort(
      (a, b) =>
        b[1].amount - a[1].amount
    )
    .map(([vendor, data]) => ({
      vendor,
      amount: data.amount,
      count: data.count,
    }));
}

function buildContext(
  expenses: Expense[],
  monthlyBudget: number
) {
  const currentMonth = getMonth(0);
  const previousMonth = getMonth(-1);

  const current = expenses.filter(
    (expense) =>
      monthKey(expense.expense_date) ===
      currentMonth
  );

  const previous = expenses.filter(
    (expense) =>
      monthKey(expense.expense_date) ===
      previousMonth
  );

  const currentSpend = total(current);
  const previousSpend = total(previous);

  const budget =
    Number(monthlyBudget) || 0;

  const remaining =
    budget - currentSpend;

  const budgetUsage =
    budget > 0
      ? (currentSpend / budget) * 100
      : null;

  const monthChange =
    previousSpend > 0
      ? ((currentSpend - previousSpend) /
          previousSpend) *
        100
      : null;

  const now = new Date();

  const day = now.getDate();

  const daysInMonth =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

  const dailyBurn =
    day > 0
      ? currentSpend / day
      : 0;

  const projected =
    dailyBurn * daysInMonth;

  const daysUntilBudgetExhaustion =
    dailyBurn > 0 && remaining > 0
      ? remaining / dailyBurn
      : null;

  const largest = [...current]
    .sort(
      (a, b) =>
        Number(b.amount) -
        Number(a.amount)
    )
    .slice(0, 10)
    .map((expense) => ({
      vendor: expense.vendor,
      category: expense.category,
      amount: Number(expense.amount),
      date: expense.expense_date,
      paymentMethod:
        expense.payment_method,
    }));

  return {
    currentMonth,
    previousMonth,

    transactionCount: current.length,

    currentSpend,
    previousSpend,

    monthChange,

    budget,

    remainingBudget: remaining,

    budgetUsage,

    dailyBurn,

    projectedMonthEnd: projected,

    daysUntilBudgetExhaustion,

    categories: categories(current),

    vendors: vendors(current),

    largestExpenses: largest,
  };
}

function readableHFError(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object"
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
      return JSON.stringify(value);
    } catch {
      return "Unknown Hugging Face error.";
    }
  }

  return "Unknown Hugging Face error.";
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
      cleanToken(rawToken);

    const expenses =
      Array.isArray(body.expenses)
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

You are an AI financial analyst inside PennyPilot,
a financial intelligence platform for MSMEs.

BUSINESS:
${body.businessName || "Unknown"}

Your job is to answer the user's question using ONLY
the supplied financial data.

========================
CORE RULES
========================

1. Never invent financial facts.

2. Never invent amounts, vendors, transactions,
   dates, balances, income, revenue, assets,
   liabilities, loans, or bank information.

3. Never claim access to a bank account.

4. You may perform arithmetic using the supplied data.

5. If the available data is insufficient, clearly say so.

6. Answer the user's actual question first.

7. Use Indian Rupees with the ₹ symbol.

8. Keep answers concise and easy to read.

9. Use short paragraphs or simple bullet points.

10. Do NOT use LaTeX.

11. Do NOT use mathematical notation such as:
    \$begin:math:display$
    \\\\frac\{\}
    \\$end:math:display$
    or other LaTeX commands.

12. Do NOT create markdown tables.

13. Do NOT wrap calculations in code blocks.

14. Write calculations as normal text.
    Example:
    ₹125,000 ÷ ₹22,058.82 ≈ 5.7 days

15. Do NOT call a business "bankrupt" merely because
    its monthly budget has been exhausted.

16. The supplied data represents EXPENSES and a
    MONTHLY BUDGET. It does NOT establish bankruptcy,
    insolvency, cash balance, assets, liabilities,
    revenue, profit, or actual bank balance.

17. If the user asks "when will I be bankrupt",
    explain that bankruptcy cannot be determined
    from this dataset.

18. If useful, provide the measurable alternative:
    "At the current spending rate, your monthly
    budget would be exhausted in approximately X days."

19. Distinguish clearly between:
    - budget exhaustion
    - projected spending
    - actual financial insolvency

20. Never present a budget forecast as a prediction
    of legal bankruptcy or business failure.

21. If the user asks why spending increased,
    identify the actual categories, vendors, and
    transactions responsible.

22. If comparing months, explicitly name both months.

========================
ANSWER STYLE
========================

Sound like a professional financial copilot.

Good:

"Your current monthly budget is ₹5,00,000 and
you've spent ₹3,75,000.

At your current daily burn of about ₹22,059,
the remaining ₹1,25,000 budget would last
approximately 5.7 days.

This does not mean the business will become
bankrupt in 6 days. We only have expense and
budget data, not cash balance, revenue,
assets, or liabilities."

Bad:

"\$begin:math:display$
\\\\frac\{125000\}\{22058\.82\}
\\\\approx 5\.7
\\$end:math:display$"

Bad:

"You will be bankrupt in 6 days."

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
                  message.role === "user" ||
                  message.role === "assistant"
                ) &&
                typeof message.content ===
                  "string"
            )
        : [];

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },

      ...history,

      {
        role: "user" as const,
        content: question,
      },
    ];

    console.log(
      "PennyPilot Copilot → Hugging Face"
    );

    console.log(
      "Model:",
      HF_MODEL
    );

    const response =
      await fetch(HF_URL, {
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
          model: HF_MODEL,

          messages,

          temperature: 0.2,

          max_tokens: 600,

          stream: false,
        }),

        cache: "no-store",
      });

    const raw =
      await response.text();

    let data: any = null;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error(
        "HF STATUS:",
        response.status
      );

      console.error(
        "HF BODY:",
        raw
      );

      const detail =
        readableHFError(
          data?.error ??
            data?.message ??
            raw
        );

      return NextResponse.json(
        {
          error:
            `Hugging Face ${response.status}: ${detail}`,
        },
        {
          status: 502,
        }
      );
    }

    let answer =
      data?.choices?.[0]
        ?.message?.content;

    if (
      typeof answer !== "string" ||
      !answer.trim()
    ) {
      console.error(
        "HF returned invalid response:",
        raw
      );

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

    /*
     * Safety cleanup.
     *
     * The model is instructed not to use LaTeX,
     * but this prevents ugly raw LaTeX from ever
     * reaching the UI if the model ignores that rule.
     */

    answer = answer
      .replace(/\\\[/g, "")
      .replace(/\\\]/g, "")
      .replace(/\\\(/g, "")
      .replace(/\\\)/g, "")
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 ÷ $2")
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\times/g, "×")
      .replace(/\\approx/g, "≈")
      .replace(/\\div/g, "÷")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    /*
     * Prevent the AI from presenting budget exhaustion
     * as confirmed bankruptcy.
     */
    answer = answer.replace(
      /\b(you'?ll|you will|your business will)\s+be\s+bankrupt\b/gi,
      "your monthly budget will be exhausted"
    );

    return NextResponse.json({
      answer,

      model: HF_MODEL,

      stats: {
        currentSpend:
          financialContext.currentSpend,

        budget:
          financialContext.budget,

        remainingBudget:
          financialContext.remainingBudget,

        transactionCount:
          financialContext.transactionCount,
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