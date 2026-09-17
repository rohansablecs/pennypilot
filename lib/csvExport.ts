export type ExportExpense = {
  id: string;
  amount: number | string;
  category: string;
  vendor: string;
  payment_method: string;
  expense_date: string;
  notes?: string | null;
};

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function exportExpensesCsv(
  expenses: ExportExpense[],
  businessName: string
) {
  if (!expenses.length) {
    return false;
  }

  const headers = [
    "Date",
    "Vendor",
    "Category",
    "Payment Method",
    "Amount (INR)",
    "Notes",
  ];

  const rows = expenses.map((expense) =>
    [
      expense.expense_date,
      expense.vendor,
      expense.category,
      expense.payment_method,
      Number(expense.amount).toFixed(2),
      expense.notes ?? "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [
    headers.join(","),
    ...rows,
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  const safeName =
    businessName
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "business";

  anchor.href = url;

  anchor.download =
    `pennypilot-${safeName}-expenses.csv`;

  document.body.appendChild(anchor);

  anchor.click();

  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);

  return true;
}