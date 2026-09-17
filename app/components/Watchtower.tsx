"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  payment_method: string;
  expense_date: string;
  notes?: string | null;
};

type Anomaly = {
  expense: Expense;
  categoryAverage: number;
  categoryMultiplier: number;
  vendorTotal: number;
  categoryTotal: number;
  reasons: string[];
  severity: "high" | "medium";
};

type Props = {
  expenses: Expense[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeVendor(vendor: string) {
  return vendor
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function average(values: number[]) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function detectAnomalies(
  expenses: Expense[]
): Anomaly[] {
  if (expenses.length < 3) {
    return [];
  }

  const anomalies: Anomaly[] = [];

  const categoryGroups = new Map<
    string,
    Expense[]
  >();

  const vendorGroups = new Map<
    string,
    Expense[]
  >();

  for (const expense of expenses) {
    const category =
      expense.category.trim().toLowerCase();

    const vendor = normalizeVendor(expense.vendor);

    const categoryItems =
      categoryGroups.get(category) ?? [];

    categoryItems.push(expense);
    categoryGroups.set(category, categoryItems);

    const vendorItems =
      vendorGroups.get(vendor) ?? [];

    vendorItems.push(expense);
    vendorGroups.set(vendor, vendorItems);
  }

  for (const expense of expenses) {
    const category =
      expense.category.trim().toLowerCase();

    const vendor = normalizeVendor(expense.vendor);

    const categoryItems =
      categoryGroups.get(category) ?? [];

    const categoryPeers = categoryItems.filter(
      (item) => item.id !== expense.id
    );

    if (categoryPeers.length < 1) {
      continue;
    }

    const categoryAverage = average(
      categoryPeers.map((item) =>
        Number(item.amount)
      )
    );

    if (categoryAverage <= 0) {
      continue;
    }

    const amount = Number(expense.amount);

    const categoryMultiplier =
      amount / categoryAverage;

    const vendorItems =
      vendorGroups.get(vendor) ?? [];

    const vendorTotal = vendorItems.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );

    const categoryTotal = categoryItems.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0
    );

    const reasons: string[] = [];

    if (categoryMultiplier >= 3) {
      reasons.push(
        `${categoryMultiplier.toFixed(1)}× your typical ${expense.category} transaction`
      );
    } else if (categoryMultiplier >= 2.5) {
      reasons.push(
        `${categoryMultiplier.toFixed(1)}× your typical ${expense.category} transaction`
      );
    }

    if (
      amount >= categoryAverage &&
      amount / Math.max(categoryTotal, 1) >= 0.5
    ) {
      reasons.push(
        `accounts for a large share of ${expense.category} spending`
      );
    }

    if (
      vendorItems.length >= 2 &&
      amount >
        average(
          vendorItems.map((item) =>
            Number(item.amount)
          )
        ) * 2.5
    ) {
      reasons.push(
        "significantly above your usual vendor amount"
      );
    }

    if (reasons.length === 0) {
      continue;
    }

    const severity =
      categoryMultiplier >= 3 ||
      amount / Math.max(categoryTotal, 1) >= 0.6
        ? "high"
        : "medium";

    anomalies.push({
      expense,
      categoryAverage,
      categoryMultiplier,
      vendorTotal,
      categoryTotal,
      reasons,
      severity,
    });
  }

  return anomalies.sort((a, b) => {
    const severityDifference =
      a.severity === "high" && b.severity !== "high"
        ? -1
        : a.severity !== "high" &&
            b.severity === "high"
          ? 1
          : 0;

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return (
      b.categoryMultiplier -
      a.categoryMultiplier
    );
  });
}

export default function Watchtower({
  expenses,
}: Props) {
  const anomalies = detectAnomalies(expenses);

  return (
    <section className="watchtower-card">
      <div className="watchtower-header">
        <div>
          <div className="watchtower-eyebrow">
            FINANCIAL MONITOR
          </div>

          <h2>Watchtower</h2>

          <p>
            PennyPilot watches your spending patterns
            for unusual transactions.
          </p>
        </div>

        <div
          className={`watchtower-status ${
            anomalies.length
              ? "watchtower-status-alert"
              : "watchtower-status-safe"
          }`}
        >
          {anomalies.length ? (
            <ShieldAlert size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}

          <span>
            {anomalies.length
              ? `${anomalies.length} signal${
                  anomalies.length === 1
                    ? ""
                    : "s"
                }`
              : "All clear"}
          </span>
        </div>
      </div>

      {!anomalies.length ? (
        <div className="watchtower-empty">
          <div className="watchtower-empty-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <strong>
              Nothing unusual detected
            </strong>

            <p>
              Your recorded transactions currently
              fall within the spending patterns PennyPilot
              has observed.
            </p>
          </div>
        </div>
      ) : (
        <div className="watchtower-alerts">
          {anomalies.slice(0, 5).map((anomaly) => (
            <div
              className={`watchtower-alert ${
                anomaly.severity === "high"
                  ? "watchtower-alert-high"
                  : "watchtower-alert-medium"
              }`}
              key={anomaly.expense.id}
            >
              <div className="watchtower-alert-icon">
                <AlertTriangle size={17} />
              </div>

              <div className="watchtower-alert-body">
                <div className="watchtower-alert-top">
                  <div>
                    <strong>
                      Unusual {anomaly.expense.category}{" "}
                      expense
                    </strong>

                    <span>
                      {anomaly.expense.vendor}
                    </span>
                  </div>

                  <strong className="watchtower-alert-amount">
                    {money(
                      Number(anomaly.expense.amount)
                    )}
                  </strong>
                </div>

                <div className="watchtower-reasons">
                  {anomaly.reasons.map(
                    (reason, index) => (
                      <div
                        key={`${reason}-${index}`}
                        className="watchtower-reason"
                      >
                        <TrendingUp size={13} />
                        {reason}
                      </div>
                    )
                  )}
                </div>

                <div className="watchtower-comparison">
                  <span>
                    Typical category transaction
                  </span>

                  <strong>
                    {money(
                      anomaly.categoryAverage
                    )}
                  </strong>

                  <span>
                    · {anomaly.categoryMultiplier.toFixed(1)}
                    × higher
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expenses.length < 3 && (
        <div className="watchtower-data-note">
          Add at least 3 transactions to establish a
          meaningful spending baseline.
        </div>
      )}
    </section>
  );
}