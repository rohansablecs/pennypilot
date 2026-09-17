"use client";

import {
  BarChart3,
} from "lucide-react";

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Expense = {
  amount: number;
  category: string;
};

type Props = {
  expenses: Expense[];
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const shortMoney = (
  value: number
) => {
  if (value >= 10000000) {
    return `₹${(
      value / 10000000
    ).toFixed(1)}Cr`;
  }

  if (value >= 100000) {
    return `₹${(
      value / 100000
    ).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `₹${(
      value / 1000
    ).toFixed(1)}K`;
  }

  return money(value);
};

export default function SpendingChart({
  expenses,
}: Props) {
  const data = Object.entries(
    expenses.reduce(
      (
        result,
        expense
      ) => {
        result[expense.category] =
          (result[
            expense.category
          ] || 0) +
          Number(expense.amount);

        return result;
      },
      {} as Record<
        string,
        number
      >
    )
  )
    .map(
      ([name, value]) => ({
        name,
        shortName:
          name.length > 13
            ? name.split(" ")[0]
            : name,
        value,
      })
    )
    .sort(
      (a, b) =>
        b.value - a.value
    );

  return (
    <section className="panel">

      <div className="panel-header">
        <div>
          <span className="section-kicker">
            SPENDING MAP
          </span>

          <h2>
            Where your money goes
          </h2>

          <p>
            Actual recorded
            transactions.
          </p>
        </div>

        <BarChart3 size={18} />
      </div>

      {data.length === 0 ? (
        <div className="empty intelligent-empty">
          <div className="empty-icon">
            <BarChart3 size={20} />
          </div>

          <strong>
            No spending data yet
          </strong>

          <p>
            Add transactions to
            see your spending
            distribution.
          </p>
        </div>
      ) : (
        <div className="chart">
          <ResponsiveContainer
            width="100%"
            height={290}
          >
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 5,
                left: 0,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="shortName"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  shortMoney(
                    Number(value)
                  )
                }
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip
                formatter={(value) =>
                  money(
                    Number(value)
                  )
                }
              />

              <Bar
                dataKey="value"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}