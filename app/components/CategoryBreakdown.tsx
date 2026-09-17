"use client";

import {
  ArrowUpRight,
  ChevronRight,
  PieChart,
} from "lucide-react";

type Expense = {
  amount: number;
  category: string;
};

type Props = {
  expenses: Expense[];
  limit?: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CategoryBreakdown({
  expenses,
  limit = 6,
}: Props) {
  const total =
    expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount),
      0
    );

  const categories =
    Object.entries(
      expenses.reduce(
        (
          result,
          expense
        ) => {
          result[
            expense.category
          ] =
            (result[
              expense.category
            ] || 0) +
            Number(
              expense.amount
            );

          return result;
        },
        {} as Record<
          string,
          number
        >
      )
    )
      .map(
        ([name, amount]) => ({
          name,
          amount,
          percentage:
            total > 0
              ? Math.round(
                  (amount /
                    total) *
                    100
                )
              : 0,
        })
      )
      .sort(
        (a, b) =>
          b.amount -
          a.amount
      )
      .slice(0, limit);

  return (
    <section className="panel">

      <div className="panel-header">

        <div>
          <span className="section-kicker">
            CATEGORY INTELLIGENCE
          </span>

          <h2>
            Spending breakdown
          </h2>

          <p>
            Your biggest expense
            categories.
          </p>
        </div>

        <PieChart size={18} />

      </div>

      {categories.length === 0 ? (
        <div className="empty intelligent-empty">

          <div className="empty-icon">
            <PieChart size={20} />
          </div>

          <strong>
            No categories yet
          </strong>

          <p>
            Category intelligence
            appears after you add
            expenses.
          </p>

        </div>
      ) : (
        <div className="category-breakdown">

          {categories.map(
            (category) => (
              <div
                className="category-row"
                key={category.name}
              >

                <div className="category-row-top">

                  <div>
                    <strong>
                      {category.name}
                    </strong>

                    <span>
                      {category.percentage}%
                      {" "}of spending
                    </span>
                  </div>

                  <strong>
                    {money(
                      category.amount
                    )}
                  </strong>

                </div>

                <div className="mini-track">

                  <div
                    style={{
                      width: `${category.percentage}%`,
                    }}
                  />

                </div>

              </div>
            )
          )}

          {categories.length > 0 && (
            <div className="category-total">

              <span>
                Total recorded
              </span>

              <strong>
                {money(total)}
              </strong>

            </div>
          )}

        </div>
      )}

    </section>
  );
}