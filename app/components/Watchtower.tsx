"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

type Expense = {
  id: string;
  amount: number | string;
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

  vendorAverage: number;

  categoryTotal: number;

  categoryShare: number;

  reasons: string[];

  severity:
    | "high"
    | "medium";
};

type Props = {
  expenses: Expense[];
};

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function normalize(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}

function average(
  values: number[]
) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length
  );
}

function validAmount(
  amount: number | string
) {
  const value =
    Number(amount);

  return Number.isFinite(
    value
  ) && value > 0
    ? value
    : 0;
}

function detectAnomalies(
  expenses: Expense[]
): Anomaly[] {
  const validExpenses =
    expenses.filter(
      (expense) =>
        validAmount(
          expense.amount
        ) > 0 &&
        Boolean(
          expense.category?.trim()
        )
    );

  if (
    validExpenses.length <
    3
  ) {
    return [];
  }

  const categoryGroups =
    new Map<
      string,
      Expense[]
    >();

  const vendorGroups =
    new Map<
      string,
      Expense[]
    >();

  for (const expense of validExpenses) {
    const category =
      normalize(
        expense.category
      );

    const vendor =
      normalize(
        expense.vendor
      );

    const categoryItems =
      categoryGroups.get(
        category
      ) ?? [];

    categoryItems.push(
      expense
    );

    categoryGroups.set(
      category,
      categoryItems
    );

    if (vendor) {
      const vendorItems =
        vendorGroups.get(
          vendor
        ) ?? [];

      vendorItems.push(
        expense
      );

      vendorGroups.set(
        vendor,
        vendorItems
      );
    }
  }

  const anomalies:
    Anomaly[] = [];

  for (const expense of validExpenses) {
    const category =
      normalize(
        expense.category
      );

    const vendor =
      normalize(
        expense.vendor
      );

    const categoryItems =
      categoryGroups.get(
        category
      ) ?? [];

    /*
     * Exclude the transaction itself from the baseline.
     */
    const peers =
      categoryItems.filter(
        (item) =>
          item.id !==
          expense.id
      );

    /*
     * One peer is too weak to establish a useful
     * category baseline.
     */
    if (peers.length < 2) {
      continue;
    }

    const peerAmounts =
      peers.map(
        (item) =>
          validAmount(
            item.amount
          )
      );

    const categoryAverage =
      average(
        peerAmounts
      );

    if (
      categoryAverage <=
      0
    ) {
      continue;
    }

    const amount =
      validAmount(
        expense.amount
      );

    const categoryMultiplier =
      amount /
      categoryAverage;

    const categoryTotal =
      categoryItems.reduce(
        (sum, item) =>
          sum +
          validAmount(
            item.amount
          ),
        0
      );

    const categoryShare =
      categoryTotal > 0
        ? amount /
          categoryTotal
        : 0;

    const vendorItems =
      vendor
        ? vendorGroups.get(
            vendor
          ) ?? []
        : [];

    const vendorPeers =
      vendorItems.filter(
        (item) =>
          item.id !==
          expense.id
      );

    const vendorAverage =
      vendorPeers.length
        ? average(
            vendorPeers.map(
              (item) =>
                validAmount(
                  item.amount
                )
            )
          )
        : 0;

    const reasons:
      string[] = [];

    if (
      categoryMultiplier >=
      3
    ) {
      reasons.push(
        `${categoryMultiplier.toFixed(
          1
        )}× your typical ${expense.category} transaction`
      );
    } else if (
      categoryMultiplier >=
      2.5
    ) {
      reasons.push(
        `${categoryMultiplier.toFixed(
          1
        )}× your typical ${expense.category} transaction`
      );
    }

    if (
      categoryShare >=
      0.5
    ) {
      reasons.push(
        `accounts for ${Math.round(
          categoryShare *
            100
        )}% of recorded ${expense.category} spending`
      );
    }

    if (
      vendorPeers.length >=
        2 &&
      vendorAverage > 0 &&
      amount >
        vendorAverage *
          2.5
    ) {
      reasons.push(
        "significantly above your usual vendor amount"
      );
    }

    if (
      !reasons.length
    ) {
      continue;
    }

    const severity =
      categoryMultiplier >=
        3 ||
      categoryShare >=
        0.6
        ? "high"
        : "medium";

    anomalies.push({
      expense,

      categoryAverage,

      categoryMultiplier,

      vendorAverage,

      categoryTotal,

      categoryShare,

      reasons,

      severity,
    });
  }

  /*
   * One signal per transaction.
   *
   * Sort strongest signals first.
   */
  return anomalies.sort(
    (a, b) => {
      const severityA =
        a.severity === "high"
          ? 2
          : 1;

      const severityB =
        b.severity === "high"
          ? 2
          : 1;

      if (
        severityA !==
        severityB
      ) {
        return (
          severityB -
          severityA
        );
      }

      return (
        b.categoryMultiplier -
        a.categoryMultiplier
      );
    }
  );
}

export default function Watchtower({
  expenses,
}: Props) {
  const anomalies =
    detectAnomalies(
      expenses
    );

  const hasEnoughData =
    expenses.length >=
    5;

  return (
    <section className="watchtower-card">
      <div className="watchtower-header">
        <div>
          <div className="watchtower-eyebrow">
            FINANCIAL MONITOR
          </div>

          <h2>
            Watchtower
          </h2>

          <p>
            PennyPilot monitors recorded spending for
            unusual transaction patterns.
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
            <ShieldAlert
              size={17}
            />
          ) : (
            <CheckCircle2
              size={17}
            />
          )}

          <span>
            {anomalies.length
              ? `${anomalies.length} signal${
                  anomalies.length ===
                  1
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
            <CheckCircle2
              size={22}
            />
          </div>

          <div>
            <strong>
              Nothing unusual detected
            </strong>

            <p>
              Your recorded transactions currently fall
              within the patterns PennyPilot has observed.
            </p>
          </div>
        </div>
      ) : (
        <div className="watchtower-alerts">
          {anomalies
            .slice(0, 5)
            .map(
              (anomaly) => (
                <div
                  className={`watchtower-alert ${
                    anomaly.severity ===
                    "high"
                      ? "watchtower-alert-high"
                      : "watchtower-alert-medium"
                  }`}
                  key={
                    anomaly.expense
                      .id
                  }
                >
                  <div className="watchtower-alert-icon">
                    <AlertTriangle
                      size={17}
                    />
                  </div>

                  <div className="watchtower-alert-body">
                    <div className="watchtower-alert-top">
                      <div>
                        <strong>
                          Unusual{" "}
                          {
                            anomaly
                              .expense
                              .category
                          }{" "}
                          expense
                        </strong>

                        <span>
                          {
                            anomaly
                              .expense
                              .vendor
                          }
                        </span>
                      </div>

                      <strong className="watchtower-alert-amount">
                        {money(
                          validAmount(
                            anomaly
                              .expense
                              .amount
                          )
                        )}
                      </strong>
                    </div>

                    <div className="watchtower-reasons">
                      {anomaly.reasons.map(
                        (
                          reason,
                          index
                        ) => (
                          <div
                            key={`${reason}-${index}`}
                            className="watchtower-reason"
                          >
                            <TrendingUp
                              size={13}
                            />

                            {reason}
                          </div>
                        )
                      )}
                    </div>

                    <div className="watchtower-comparison">
                      <span>
                        Typical category
                        transaction
                      </span>

                      <strong>
                        {money(
                          anomaly.categoryAverage
                        )}
                      </strong>

                      <span>
                        ·{" "}
                        {anomaly.categoryMultiplier.toFixed(
                          1
                        )}
                        × higher
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
        </div>
      )}

      {!hasEnoughData && (
        <div className="watchtower-data-note">
          Add more transactions to establish a stronger
          spending baseline. Signals are intentionally
          conservative with limited history.
        </div>
      )}
    </section>
  );
}