export type VendorExpense = {
  id: string;
  amount: number | string;
  category: string;
  vendor: string;
  expense_date: string;
};

export type VendorInsight = {
  vendor: string;

  totalSpend: number;
  transactionCount: number;
  averageTransaction: number;

  spendingShare: number;

  dominantCategory: string;
  categorySpend: number;

  latestDate: string;

  largestTransaction: number;

  isHighConcentration: boolean;
};

function normalizeVendor(
  vendor: string
) {
  return vendor
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function displayVendor(
  vendor: string
) {
  return vendor
    .trim()
    .replace(/\s+/g, " ");
}

function round(value: number) {
  return (
    Math.round(value * 100) /
    100
  );
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

export function analyzeVendors(
  expenses: VendorExpense[]
): VendorInsight[] {
  const validExpenses =
    expenses.filter(
      (expense) =>
        normalizeVendor(
          expense.vendor
        ).length > 0 &&
        validAmount(
          expense.amount
        ) > 0
    );

  const totalBusinessSpend =
    validExpenses.reduce(
      (sum, expense) =>
        sum +
        validAmount(
          expense.amount
        ),
      0
    );

  if (
    !validExpenses.length ||
    totalBusinessSpend <= 0
  ) {
    return [];
  }

  const vendorMap =
    new Map<
      string,
      VendorExpense[]
    >();

  for (const expense of validExpenses) {
    const key =
      normalizeVendor(
        expense.vendor
      );

    const existing =
      vendorMap.get(key) ?? [];

    existing.push(expense);

    vendorMap.set(
      key,
      existing
    );
  }

  const insights:
    VendorInsight[] = [];

  for (const vendorExpenses of vendorMap.values()) {
    const sorted =
      [...vendorExpenses].sort(
        (a, b) =>
          new Date(
            `${b.expense_date}T00:00:00`
          ).getTime() -
          new Date(
            `${a.expense_date}T00:00:00`
          ).getTime()
      );

    const totalSpend =
      vendorExpenses.reduce(
        (sum, expense) =>
          sum +
          validAmount(
            expense.amount
          ),
        0
      );

    const transactionCount =
      vendorExpenses.length;

    const averageTransaction =
      totalSpend /
      Math.max(
        transactionCount,
        1
      );

    const categoryMap =
      new Map<
        string,
        number
      >();

    for (const expense of vendorExpenses) {
      const category =
        expense.category?.trim() ||
        "Other";

      categoryMap.set(
        category,
        (categoryMap.get(
          category
        ) ?? 0) +
          validAmount(
            expense.amount
          )
      );
    }

    const categoryEntries =
      [...categoryMap.entries()]
        .sort(
          (a, b) =>
            b[1] - a[1]
        );

    const dominantCategory =
      categoryEntries[0]?.[0] ??
      "Other";

    const categorySpend =
      categoryEntries[0]?.[1] ??
      0;

    const spendingShare =
      (totalSpend /
        totalBusinessSpend) *
      100;

    const largestTransaction =
      Math.max(
        ...vendorExpenses.map(
          (expense) =>
            validAmount(
              expense.amount
            )
        )
      );

    insights.push({
      vendor: displayVendor(
        sorted[0]?.vendor ??
          "Unknown"
      ),

      totalSpend:
        round(totalSpend),

      transactionCount,

      averageTransaction:
        round(
          averageTransaction
        ),

      spendingShare:
        round(
          spendingShare
        ),

      dominantCategory,

      categorySpend:
        round(categorySpend),

      latestDate:
        sorted[0]
          ?.expense_date ?? "",

      largestTransaction:
        round(
          largestTransaction
        ),

      isHighConcentration:
        spendingShare >= 25,
    });
  }

  return insights.sort(
    (a, b) =>
      b.totalSpend -
      a.totalSpend
  );
}

export function calculateVendorConcentration(
  vendors: VendorInsight[]
) {
  if (!vendors.length) {
    return {
      topVendorShare: 0,
      topThreeShare: 0,
      concentratedVendors: 0,
    };
  }

  const topVendorShare =
    vendors[0]
      ?.spendingShare ?? 0;

  const topThreeShare =
    vendors
      .slice(0, 3)
      .reduce(
        (sum, vendor) =>
          sum +
          vendor.spendingShare,
        0
      );

  const concentratedVendors =
    vendors.filter(
      (vendor) =>
        vendor.isHighConcentration
    ).length;

  return {
    topVendorShare:
      round(topVendorShare),

    topThreeShare:
      round(topThreeShare),

    concentratedVendors,
  };
}