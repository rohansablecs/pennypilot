"use client";

import {
  CalendarClock,
  Repeat2,
  TrendingUp,
} from "lucide-react";

import {
  detectRecurringExpenses,
  FinancialExpense,
} from "@/lib/financialEngine";

type Props = {
  expenses: FinancialExpense[];
};

function money(value: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(
  date: string
) {
  const parsed =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

export default function RecurringExpenses({
  expenses,
}: Props) {
  const recurring =
    detectRecurringExpenses(
      expenses
    );

  const monthlyCommitment =
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

  const upcomingCount =
    recurring.filter(
      (item) =>
        Boolean(
          item.nextExpectedDate
        )
    ).length;

  if (!recurring.length) {
    return (
      <section className="intelligence-card">
        <div className="intelligence-card-header">
          <div>
            <div className="section-eyebrow">
              FINANCIAL INTELLIGENCE
            </div>

            <h2>
              Recurring expenses
            </h2>

            <p>
              PennyPilot identifies repeated business
              expenses from your transaction history.
            </p>
          </div>

          <div className="intelligence-icon">
            <Repeat2 size={19} />
          </div>
        </div>

        <div className="intelligence-empty">
          <CalendarClock size={20} />

          <div>
            <strong>
              No recurring pattern detected yet.
            </strong>

            <p>
              At least three consistent transactions are
              needed before PennyPilot treats a pattern as
              recurring.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="intelligence-card">
      <div className="intelligence-card-header">
        <div>
          <div className="section-eyebrow">
            FINANCIAL INTELLIGENCE
          </div>

          <h2>
            Recurring expenses
          </h2>

          <p>
            Repeated spending patterns detected from your
            transaction history.
          </p>
        </div>

        <div className="intelligence-icon">
          <Repeat2 size={19} />
        </div>
      </div>

      <div className="recurring-summary">
        <div>
          <span>
            Recurring items
          </span>

          <strong>
            {recurring.length}
          </strong>
        </div>

        <div>
          <span>
            Monthly commitment
          </span>

          <strong>
            {money(
              monthlyCommitment
            )}
          </strong>
        </div>

        <div>
          <span>
            Upcoming
          </span>

          <strong>
            {upcomingCount}
          </strong>
        </div>
      </div>

      <div className="recurring-list">
        {recurring.map(
          (item) => (
            <div
              className="recurring-row"
              key={`${item.vendor}-${item.category}`}
            >
              <div className="recurring-main">
                <div className="recurring-vendor">
                  {item.vendor}
                </div>

                <div className="recurring-meta">
                  {item.category}
                  {" · "}
                  {item.frequency}
                  {" · "}
                  {item.occurrences}
                  {" occurrences"}
                </div>
              </div>

              <div className="recurring-amount">
                <strong>
                  {money(
                    item.averageAmount
                  )}
                </strong>

                <span>
                  {item.nextExpectedDate
                    ? `next ${formatDate(
                        item.nextExpectedDate
                      )}`
                    : "next date unavailable"}
                </span>
              </div>

              <div className="recurring-confidence">
                <TrendingUp size={14} />

                {item.confidence}%
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}