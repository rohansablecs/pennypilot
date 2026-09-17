"use client";

import WelcomeGuide from "./components/WelcomeGuide";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Filter,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  Sun,
  TrendingUp,
  Wallet,
  X,
  Zap,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import ExpenseModal, {
  type ExpenseForm,
} from "./components/ExpenseModal";

import ReceiptScanner from "./components/ReceiptScanner";
import Watchtower from "./components/Watchtower";
import SpendingChart from "./components/SpendingChart";
import CategoryBreakdown from "./components/CategoryBreakdown";
import Copilot from "./components/Copilot";

import { exportExpensesCsv } from "@/lib/csvExport";

/* =========================================================
   TYPES
========================================================= */

type Expense = {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  payment_method: string;
  expense_date: string;
  notes?: string | null;
  created_at?: string;
};

type Business = {
  id: string;
  owner_id: string;
  business_name: string;
  enterprise_type: string;
  monthly_budget: number | null;
};

type Theme = "dark" | "light";

/* =========================================================
   CONSTANTS
========================================================= */

const categories = [
  "Raw Materials",
  "Salaries",
  "Logistics",
  "Utilities",
  "Rent",
  "Marketing",
  "Office",
  "Maintenance",
];

const paymentMethods = [
  "UPI",
  "Bank",
  "Cash",
  "Card",
];

/* =========================================================
   HELPERS
========================================================= */

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const today = () =>
  new Date().toISOString().split("T")[0];

const monthStart = () => {
  const date = new Date();

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];
};

const monthLabel = () =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date());

const normalizeVendor = (vendor: string) =>
  vendor
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");

const emptyExpenseForm = (): ExpenseForm => ({
  amount: "",
  category: "Raw Materials",
  vendor: "",
  method: "UPI",
  date: today(),
  notes: "",
});

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard({
  session,
}: {
  session: any;
}) {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [tab, setTab] =
    useState("Dashboard");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showExpense, setShowExpense] =
    useState(false);

  const [showScanner, setShowScanner] =
    useState(false);

  const [showBudget, setShowBudget] =
    useState(false);

  const [showCopilot, setShowCopilot] =
    useState(false);

  const [budgetInput, setBudgetInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [scannerForm, setScannerForm] =
    useState<ExpenseForm | null>(null);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Expense | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [theme, setTheme] =
    useState<Theme>("dark");

  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "pennypilot-theme"
      ) as Theme | null;

    const nextTheme =
      saved === "light"
        ? "light"
        : "dark";

    setTheme(nextTheme);

    document.documentElement.classList.toggle(
      "light",
      nextTheme === "light"
    );
  }, []);

  const toggleTheme = () => {
    const nextTheme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);

    localStorage.setItem(
      "pennypilot-theme",
      nextTheme
    );

    document.documentElement.classList.toggle(
      "light",
      nextTheme === "light"
    );
  };

  /* =========================================================
     DATA
  ========================================================= */

  const loadData = async () => {
    setLoading(true);
    setActionError("");

    const {
      data: businessData,
      error: businessError,
    } = await supabase
      .from("businesses")
      .select("*")
      .eq(
        "owner_id",
        session.user.id
      )
      .single();

    if (
      businessError ||
      !businessData
    ) {
      console.error(
        "Business load error:",
        businessError
      );

      setLoading(false);
      return;
    }

    setBusiness(
      businessData
    );

    setBudgetInput(
      businessData.monthly_budget
        ? String(
            businessData.monthly_budget
          )
        : ""
    );

    const {
      data: expenseData,
      error: expenseError,
    } = await supabase
      .from("expenses")
      .select("*")
      .eq(
        "business_id",
        businessData.id
      )
      .order(
        "expense_date",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (expenseError) {
      console.error(
        "Expense load error:",
        expenseError
      );
    }

    setExpenses(
      expenseData || []
    );

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session.user.id]);

  /* =========================================================
     MONTHLY DATA
  ========================================================= */

  const currentMonthExpenses =
    useMemo(() => {
      const start =
        monthStart();

      return expenses.filter(
        (expense) =>
          expense.expense_date >=
          start
      );
    }, [expenses]);

  const monthlyTotal =
    useMemo(
      () =>
        currentMonthExpenses.reduce(
          (sum, expense) =>
            sum +
            Number(
              expense.amount
            ),
          0
        ),
      [currentMonthExpenses]
    );

  const allTimeTotal =
    useMemo(
      () =>
        expenses.reduce(
          (sum, expense) =>
            sum +
            Number(
              expense.amount
            ),
          0
        ),
      [expenses]
    );

  const budget =
    Number(
      business?.monthly_budget
    ) || 0;

  const budgetPercentage =
    budget > 0
      ? Math.round(
          (monthlyTotal /
            budget) *
            100
        )
      : 0;

  const budgetRemaining =
    Math.max(
      budget - monthlyTotal,
      0
    );

  const daysPassed =
    Math.max(
      new Date().getDate(),
      1
    );

  const dailySpend =
    monthlyTotal /
    daysPassed;

  const daysInMonth =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();

  const projectedMonthlySpend =
    dailySpend *
    daysInMonth;

  /* =========================================================
     CATEGORY INTELLIGENCE
  ========================================================= */

  const categoryTotals =
    useMemo(() => {
      return currentMonthExpenses.reduce(
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
      );
    }, [
      currentMonthExpenses,
    ]);

  const topCategory =
    Object.entries(
      categoryTotals
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0];

  /* =========================================================
     VENDOR INTELLIGENCE
  ========================================================= */

  const vendorTotals =
    useMemo(() => {
      return currentMonthExpenses.reduce(
        (
          result,
          expense
        ) => {
          const vendor =
            normalizeVendor(
              expense.vendor || ""
            ) ||
            "Unknown vendor";

          result[vendor] =
            (result[vendor] ||
              0) +
            Number(
              expense.amount
            );

          return result;
        },
        {} as Record<
          string,
          number
        >
      );
    }, [
      currentMonthExpenses,
    ]);

  const sortedVendors =
    useMemo(
      () =>
        Object.entries(
          vendorTotals
        ).sort(
          (a, b) =>
            b[1] - a[1]
        ),
      [vendorTotals]
    );

  const topVendor =
    sortedVendors[0];

  /* =========================================================
     ANOMALIES
  ========================================================= */

  const anomalyCount =
    useMemo(
      () =>
        countAnomalies(
          expenses
        ),
      [expenses]
    );

  /* =========================================================
     INSIGHTS
  ========================================================= */

  const insights = useMemo(
    () => {
      const list: {
        icon: string;
        title: string;
        text: string;
        type:
          | "good"
          | "warning"
          | "info";
      }[] = [];

      if (
        expenses.length === 0
      ) {
        return [
          {
            icon: "✦",
            title:
              "Start building your baseline",
            text:
              "Add real transactions and PennyPilot will begin learning your spending patterns.",
            type: "info" as const,
          },
        ];
      }

      if (!budget) {
        list.push({
          icon: "◷",
          title:
            "Set your monthly budget",
          text:
            "Budget Guard needs a spending limit to measure your pace.",
          type: "info",
        });
      } else if (
        budgetPercentage >=
        100
      ) {
        list.push({
          icon: "⚠",
          title:
            "Budget limit reached",
          text:
            `Recorded spending has reached ${budgetPercentage}% of your monthly limit.`,
          type: "warning",
        });
      } else if (
        budgetPercentage >=
        80
      ) {
        list.push({
          icon: "⚠",
          title:
            "Budget Guard is watching",
          text:
            `${budgetPercentage}% used · ${money(
              budgetRemaining
            )} remains.`,
          type: "warning",
        });
      } else {
        list.push({
          icon: "✓",
          title:
            "Spending is within budget",
          text:
            `${money(
              budgetRemaining
            )} remains this month.`,
          type: "good",
        });
      }

      if (topCategory) {
        const share =
          monthlyTotal > 0
            ? Math.round(
                (topCategory[1] /
                  monthlyTotal) *
                  100
              )
            : 0;

        list.push({
          icon: "◈",
          title:
            `${topCategory[0]} is your largest spend`,
          text:
            `${money(
              topCategory[1]
            )} · ${share}% of monthly spending.`,
          type: "info",
        });
      }

      if (topVendor) {
        list.push({
          icon: "◆",
          title:
            `${topVendor[0]} is your top vendor`,
          text:
            `${money(
              topVendor[1]
            )} recorded this month.`,
          type: "info",
        });
      }

      if (
        budget > 0 &&
        projectedMonthlySpend >
          budget
      ) {
        list.push({
          icon: "↗",
          title:
            "Current spending pace is high",
          text:
            `At the current pace, spending could reach approximately ${money(
              projectedMonthlySpend
            )}.`,
          type: "warning",
        });
      }

      if (
        anomalyCount >
        0
      ) {
        list.push({
          icon: "!",
          title:
            `${anomalyCount} unusual transaction${
              anomalyCount === 1
                ? ""
                : "s"
            } detected`,
          text:
            "Watchtower found spending outside your normal category patterns.",
          type: "warning",
        });
      }

      return list.slice(
        0,
        4
      );
    },
    [
      expenses.length,
      budget,
      budgetPercentage,
      budgetRemaining,
      topCategory,
      topVendor,
      monthlyTotal,
      projectedMonthlySpend,
      anomalyCount,
    ]
  );

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredExpenses =
    useMemo(() => {
      return expenses.filter(
        (expense) => {
          const query =
            search
              .trim()
              .toLowerCase();

          const vendor =
            expense.vendor
              ?.toLowerCase() ||
            "";

          const category =
            expense.category
              ?.toLowerCase() ||
            "";

          const payment =
            expense.payment_method
              ?.toLowerCase() ||
            "";

          const matchesSearch =
            !query ||
            vendor.includes(
              query
            ) ||
            category.includes(
              query
            ) ||
            payment.includes(
              query
            );

          const matchesCategory =
            categoryFilter ===
              "All" ||
            expense.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      expenses,
      search,
      categoryFilter,
    ]);

  /* =========================================================
     OPEN NEW EXPENSE
  ========================================================= */

  const openNewExpense = () => {
    setEditingExpense(null);
    setScannerForm(
      null
    );
    setActionError("");
    setShowExpense(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEditExpense = (
    expense: Expense
  ) => {
    setEditingExpense(
      expense
    );

    setScannerForm({
      amount: String(
        expense.amount
      ),
      category:
        expense.category ||
        "Raw Materials",
      vendor:
        expense.vendor ||
        "",
      method:
        expense.payment_method ||
        "UPI",
      date:
        expense.expense_date ||
        today(),
      notes:
        expense.notes ||
        "",
    });

    setActionError("");
    setShowExpense(true);
  };

  /* =========================================================
     SAVE / UPDATE EXPENSE
  ========================================================= */

  const saveExpense = async (
    form: ExpenseForm
  ) => {
    if (!business) {
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      const amount =
        Number(form.amount);

      const vendor =
        normalizeVendor(
          form.vendor
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        throw new Error(
          "Enter a valid expense amount."
        );
      }

      if (
        !vendor ||
        vendor.length <
          2
      ) {
        throw new Error(
          "Enter a valid vendor name."
        );
      }

      if (
        !form.category
      ) {
        throw new Error(
          "Select a category."
        );
      }

      if (
        !form.method
      ) {
        throw new Error(
          "Select a payment method."
        );
      }

      if (!form.date) {
        throw new Error(
          "Select an expense date."
        );
      }

      const duplicate =
        expenses.find(
          (expense) => {
            if (
              editingExpense &&
              expense.id ===
                editingExpense.id
            ) {
              return false;
            }

            return (
              Number(
                expense.amount
              ) === amount &&
              normalizeVendor(
                expense.vendor
              ).toLowerCase() ===
                vendor.toLowerCase() &&
              expense.category ===
                form.category &&
              expense.expense_date ===
                form.date
            );
          }
        );

      if (duplicate) {
        const proceed =
          window.confirm(
            `A very similar expense already exists.\n\n` +
              `${money(
                amount
              )} · ${vendor} · ${form.date}\n\n` +
              `Do you want to save this transaction anyway?`
          );

        if (!proceed) {
          setSaving(false);
          return;
        }
      }

      if (
        editingExpense
      ) {
        const {
          error,
        } = await supabase
          .from("expenses")
          .update({
            amount,
            category:
              form.category,
            vendor,
            payment_method:
              form.method,
            expense_date:
              form.date,
            notes:
              form.notes?.trim() ||
              null,
          })
          .eq(
            "id",
            editingExpense.id
          )
          .eq(
            "business_id",
            business.id
          );

        if (error) {
          throw error;
        }
      } else {
        const {
          error,
        } = await supabase
          .from("expenses")
          .insert({
            business_id:
              business.id,
            amount,
            category:
              form.category,
            vendor,
            payment_method:
              form.method,
            expense_date:
              form.date,
            notes:
              form.notes?.trim() ||
              null,
          });

        if (error) {
          throw error;
        }
      }

      setShowExpense(
        false
      );

      setEditingExpense(
        null
      );

      setScannerForm(
        null
      );

      await loadData();
    } catch (error: any) {
      console.error(
        "Save expense error:",
        error
      );

      setActionError(
        error?.message ||
          "Could not save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const requestDeleteExpense = (
    expense: Expense
  ) => {
    setDeleteTarget(
      expense
    );
    setActionError("");
  };

  const confirmDeleteExpense =
    async () => {
      if (
        !deleteTarget ||
        !business
      ) {
        return;
      }

      setSaving(true);
      setActionError("");

      try {
        const {
          error,
        } = await supabase
          .from("expenses")
          .delete()
          .eq(
            "id",
            deleteTarget.id
          )
          .eq(
            "business_id",
            business.id
          );

        if (error) {
          throw error;
        }

        setDeleteTarget(
          null
        );

        await loadData();
      } catch (error: any) {
        console.error(
          "Delete expense error:",
          error
        );

        setActionError(
          error?.message ||
            "Could not delete expense."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     SAVE BUDGET
  ========================================================= */

  const saveBudget =
    async () => {
      if (!business) {
        return;
      }

      const value =
        Number(
          budgetInput
        );

      if (
        !Number.isFinite(
          value
        ) ||
        value <= 0
      ) {
        setActionError(
          "Enter a valid monthly budget."
        );
        return;
      }

      setSaving(true);
      setActionError("");

      try {
        const {
          error,
        } = await supabase
          .from("businesses")
          .update({
            monthly_budget:
              value,
          })
          .eq(
            "id",
            business.id
          )
          .eq(
            "owner_id",
            session.user.id
          );

        if (error) {
          throw error;
        }

        setBusiness({
          ...business,
          monthly_budget:
            value,
        });

        setShowBudget(
          false
        );
      } catch (error: any) {
        console.error(
          "Budget error:",
          error
        );

        setActionError(
          error?.message ||
            "Could not save budget."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     EXPORT
  ========================================================= */

  const handleExport = () => {
    if (!business) {
      return;
    }

    const exported =
      exportExpensesCsv(
        expenses,
        business.business_name
      );

    if (!exported) {
      setActionError(
        "There are no transactions to export yet."
      );
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout =
    async () => {
      await supabase.auth.signOut();
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          ◒
        </div>

        <p>
          Building your financial workspace...
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          ◒
        </div>

        <p>
          Business profile not found.
        </p>

        <button
          className="primary-button"
          onClick={
            logout
          }
        >
          Sign out
        </button>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div>

          <div className="brand">
            <span className="brand-mark">
              ◒
            </span>

            <span>
              PennyPilot
            </span>
          </div>

          <div className="sidebar-label">
            FINANCIAL OS
          </div>

          <NavButton
            icon={
              <LayoutDashboard
                size={16}
              />
            }
            label="Dashboard"
            active={
              tab ===
              "Dashboard"
            }
            onClick={() =>
              setTab(
                "Dashboard"
              )
            }
          />

          <NavButton
            icon={
              <Receipt
                size={16}
              />
            }
            label="Expenses"
            active={
              tab ===
              "Expenses"
            }
            onClick={() =>
              setTab(
                "Expenses"
              )
            }
          />

          <NavButton
            icon={
              <TrendingUp
                size={16}
              />
            }
            label="Analytics"
            active={
              tab ===
              "Analytics"
            }
            onClick={() =>
              setTab(
                "Analytics"
              )
            }
          />

        </div>

        <div className="sidebar-bottom">

          <button
            className="theme-toggle"
            onClick={
              toggleTheme
            }
            title={
              theme ===
              "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <span className="theme-toggle-icon">
              {theme ===
              "dark" ? (
                <Sun
                  size={14}
                />
              ) : (
                <Moon
                  size={14}
                />
              )}
            </span>

            <span>
              {theme ===
              "dark"
                ? "Light mode"
                : "Dark mode"}
            </span>

            <span className="theme-toggle-state">
              {theme ===
              "dark"
                ? "☼"
                : "☾"}
            </span>
          </button>

          <div className="enterprise-mini">

            <span>
              🏢
            </span>

            <div>
              <strong>
                {
                  business.business_name
                }
              </strong>

              <small>
                {
                  business.enterprise_type
                }
              </small>
            </div>

          </div>

          <button
            className="switch-button"
            onClick={
              logout
            }
          >
            <LogOut
              size={13}
            />
            Sign out
          </button>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div className="topbar-context">

            <div className="status-line">
              <span className="status-dot" />
              LIVE WORKSPACE
            </div>

            <p className="muted">
              {
                business.business_name
              }
            </p>

            <h1>
              {tab}
            </h1>

          </div>

          <div className="top-actions">

            <button
              className="icon-button"
              title="Notifications"
            >
              <Bell
                size={17}
              />
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setShowCopilot(
                  true
                )
              }
            >
              <Zap
                size={15}
              />
              Copilot
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setShowScanner(
                  true
                )
              }
            >
              <Receipt
                size={15}
              />
              Scan receipt
            </button>

            <button
              className="primary-button"
              onClick={
                openNewExpense
              }
            >
              <Plus
                size={16}
              />
              Add expense
            </button>

          </div>

        </header>

        {actionError && (
          <div className="global-action-error">
            <ShieldAlert
              size={15}
            />

            <span>
              {actionError}
            </span>

            <button
              onClick={() =>
                setActionError(
                  ""
                )
              }
            >
              <X
                size={14}
              />
            </button>
          </div>
        )}

        {/* =====================================================
            DASHBOARD
        ===================================================== */}

        {tab ===
          "Dashboard" && (
          <>

            <div className="dashboard-heading">

              <div>

                <span className="section-kicker">
                  {monthLabel().toUpperCase()}
                </span>

                <h2>
                  Financial command center
                </h2>

                <p>
                  A live view of your
                  business spending,
                  budget and financial
                  signals.
                </p>

              </div>

              <div className="dashboard-heading-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowCopilot(
                      true
                    )
                  }
                >
                  <Zap size={15} />
                  Ask Copilot
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowBudget(
                      true
                    )
                  }
                >
                  <Wallet
                    size={15}
                  />

                  {budget
                    ? "Edit budget"
                    : "Set monthly budget"}
                </button>

              </div>

            </div>

            {/* =================================================
                FIRST-TIME USER GUIDE
            ================================================= */}

            <WelcomeGuide />

            <section className="stats-grid">

              <StatCard
                icon={
                  <Wallet />
                }
                label="MONTHLY SPEND"
                value={money(
                  monthlyTotal
                )}
                detail={
                  currentMonthExpenses.length
                    ? `${currentMonthExpenses.length} transactions`
                    : "No transactions yet"
                }
              />

              <StatCard
                icon={
                  <TrendingUp />
                }
                label="DAILY BURN"
                value={money(
                  dailySpend
                )}
                detail="Average spend per day"
              />

              <StatCard
                icon={
                  <CircleDollarSign />
                }
                label="BUDGET REMAINING"
                value={
                  budget
                    ? money(
                        budgetRemaining
                      )
                    : "Not set"
                }
                detail={
                  budget
                    ? `${budgetPercentage}% used`
                    : "Set a budget to track"
                }
              />

              <StatCard
                icon={
                  <ShieldAlert />
                }
                label="WATCHTOWER"
                value={
                  expenses.length <
                  3
                    ? "—"
                    : String(
                        anomalyCount
                      )
                }
                detail={
                  expenses.length <
                  3
                    ? "Building baseline"
                    : "Unusual patterns"
                }
                danger={
                  expenses.length >=
                    3 &&
                  anomalyCount >
                    0
                }
              />

            </section>

            <section className="panel budget-panel">

              <div className="budget-panel-top">

                <div>

                  <div className="panel-eyebrow-row">

                    <span className="section-kicker">
                      BUDGET GUARD
                    </span>

                    {budget >
                      0 && (
                      <span className="live-badge">
                        ACTIVE
                      </span>
                    )}

                  </div>

                  <h2>
                    {budget
                      ? `${money(
                          monthlyTotal
                        )} of ${money(
                          budget
                        )}`
                      : "Your budget isn't configured yet"}
                  </h2>

                  <p>
                    {budget
                      ? `${money(
                          budgetRemaining
                        )} remaining this month.`
                      : "Set a monthly spending limit to activate Budget Guard."}
                  </p>

                </div>

                {budget >
                  0 && (
                  <strong className="budget-percent">
                    {
                      budgetPercentage
                    }
                    %
                  </strong>
                )}

              </div>

              {budget >
              0 ? (
                <>
                  <div className="progress-track">
                    <div
                      className={`progress-value ${
                        budgetPercentage >=
                        100
                          ? "danger"
                          : budgetPercentage >=
                              80
                            ? "warning"
                            : ""
                      }`}
                      style={{
                        width: `${Math.min(
                          budgetPercentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="budget-meta">
                    <span>
                      {money(
                        monthlyTotal
                      )}{" "}
                      spent
                    </span>

                    <span>
                      {money(
                        budget
                      )}{" "}
                      limit
                    </span>
                  </div>
                </>
              ) : (
                <button
                  className="primary-button"
                  onClick={() =>
                    setShowBudget(
                      true
                    )
                  }
                >
                  Configure budget

                  <ChevronRight
                    size={15}
                  />
                </button>
              )}

            </section>

            <section className="insight-strip">

              <div className="insight-title">

                <div className="insight-title-icon">
                  <Zap
                    size={15}
                  />
                </div>

                <div>

                  <strong>
                    PennyPilot
                    intelligence
                  </strong>

                  <span>
                    Automated signals
                    from your ledger
                  </span>

                </div>

              </div>

              {insights.map(
                (
                  insight,
                  index
                ) => (
                  <div
                    className={`insight-card ${insight.type}`}
                    key={
                      index
                    }
                  >

                    <span>
                      {
                        insight.icon
                      }
                    </span>

                    <div>

                      <strong>
                        {
                          insight.title
                        }
                      </strong>

                      <p>
                        {
                          insight.text
                        }
                      </p>

                    </div>

                  </div>
                )
              )}

            </section>

            <section className="two-column">

              <SpendingChart
                expenses={
                  currentMonthExpenses
                }
              />

              <Watchtower
                expenses={
                  expenses
                }
              />

            </section>

            <section className="two-column">

              <CategoryBreakdown
                expenses={
                  currentMonthExpenses
                }
              />

              <section className="panel">

                <div className="panel-header">

                  <div>

                    <span className="section-kicker">
                      VENDOR INTELLIGENCE
                    </span>

                    <h2>
                      Top vendors
                    </h2>

                    <p>
                      Highest recorded
                      monthly spend.
                    </p>

                  </div>

                  <Building2
                    size={17}
                  />

                </div>

                {topVendor ? (
                  <div className="vendor-grid">

                    {sortedVendors
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          [
                            vendor,
                            amount,
                          ],
                          index
                        ) => (
                          <div
                            className="vendor-card"
                            key={
                              vendor
                            }
                          >

                            <span className="vendor-rank">
                              {String(
                                index +
                                  1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <div>

                              <strong>
                                {
                                  vendor
                                }
                              </strong>

                              <p>
                                {money(
                                  amount
                                )}
                              </p>

                            </div>

                            <span className="vendor-arrow">

                              <ChevronRight
                                size={
                                  13
                                }
                              />

                            </span>

                          </div>
                        )
                      )}

                  </div>
                ) : (
                  <div className="empty">

                    <div className="empty-icon">
                      <Building2
                        size={18}
                      />
                    </div>

                    <strong>
                      No vendor
                      intelligence yet
                    </strong>

                    <p>
                      Vendor patterns
                      appear after
                      transactions are
                      recorded.
                    </p>

                  </div>
                )}

              </section>

            </section>

            <section className="panel ledger-panel">

              <div className="panel-header">

                <div>

                  <span className="section-kicker">
                    LEDGER
                  </span>

                  <h2>
                    Recent expenses
                  </h2>

                  <p>
                    Latest recorded
                    transactions.
                  </p>

                </div>

                <button
                  className="link-button"
                  onClick={() =>
                    setTab(
                      "Expenses"
                    )
                  }
                >
                  View ledger

                  <ChevronRight
                    size={14}
                  />
                </button>

              </div>

              <ExpenseTable
                expenses={expenses.slice(
                  0,
                  8
                )}
                onEdit={
                  openEditExpense
                }
                onDelete={
                  requestDeleteExpense
                }
              />

            </section>

          </>
        )}

        {/* =====================================================
            EXPENSES
        ===================================================== */}

        {tab ===
          "Expenses" && (
          <section className="panel ledger-panel">

            <div className="panel-header">

              <div>

                <span className="section-kicker">
                  TRANSACTION LEDGER
                </span>

                <h2>
                  Expense ledger
                </h2>

                <p>
                  Search, inspect and
                  manage your real
                  transactions.
                </p>

              </div>

              <div className="panel-header-actions">

                <button
                  className="secondary-button"
                  onClick={
                    handleExport
                  }
                >
                  <Download
                    size={15}
                  />
                  Export CSV
                </button>

                <button
                  className="primary-button"
                  onClick={
                    openNewExpense
                  }
                >
                  <Plus
                    size={16}
                  />
                  Add expense
                </button>

              </div>

            </div>

            <div className="ledger-tools">

              <div className="search-box">

                <Search
                  size={15}
                />

                <input
                  placeholder="Search vendor, category or payment..."
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                />

              </div>

              <div className="filter-box">

                <Filter
                  size={14}
                />

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryFilter(
                      event
                        .target
                        .value
                    )
                  }
                >

                  <option value="All">
                    All categories
                  </option>

                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            <div className="ledger-result-count">

              Showing{" "}
              <strong>
                {
                  filteredExpenses.length
                }
              </strong>{" "}
              of{" "}
              <strong>
                {
                  expenses.length
                }
              </strong>{" "}
              transactions

            </div>

            <ExpenseTable
              expenses={
                filteredExpenses
              }
              onEdit={
                openEditExpense
              }
              onDelete={
                requestDeleteExpense
              }
            />

          </section>
        )}

        {/* =====================================================
            ANALYTICS
        ===================================================== */}

        {tab ===
          "Analytics" && (
          <div className="analytics-stack">

            <section className="analytics-intro">

              <div>

                <span className="section-kicker">
                  FINANCIAL ANALYTICS
                </span>

                <h2>
                  Understand the
                  trajectory.
                </h2>

                <p>
                  Patterns calculated
                  directly from your
                  recorded transactions.
                </p>

              </div>

              <div className="analytics-total">

                <span>
                  ALL-TIME SPEND
                </span>

                <strong>
                  {money(
                    allTimeTotal
                  )}
                </strong>

              </div>

            </section>

            <section className="stats-grid">

              <StatCard
                icon={
                  <Wallet />
                }
                label="ALL-TIME SPEND"
                value={money(
                  allTimeTotal
                )}
                detail={`${expenses.length} transactions`}
              />

              <StatCard
                icon={
                  <TrendingUp />
                }
                label="DAILY BURN"
                value={money(
                  dailySpend
                )}
                detail="Current monthly pace"
              />

              <StatCard
                icon={
                  <Building2 />
                }
                label="VENDORS"
                value={String(
                  Object.keys(
                    vendorTotals
                  ).length
                )}
                detail="Active this month"
              />

              <StatCard
                icon={
                  <ShieldAlert />
                }
                label="WATCHTOWER"
                value={String(
                  anomalyCount
                )}
                detail="Detected patterns"
                danger={
                  anomalyCount >
                  0
                }
              />

            </section>

            <div className="two-column">

              <SpendingChart
                expenses={
                  currentMonthExpenses
                }
              />

              <CategoryBreakdown
                expenses={
                  currentMonthExpenses
                }
                limit={10}
              />

            </div>

            <section className="panel">

              <div className="panel-header">

                <div>

                  <span className="section-kicker">
                    PROJECTION
                  </span>

                  <h2>
                    Spending velocity
                  </h2>

                  <p>
                    Projection based on
                    your current daily
                    spending pace.
                  </p>

                </div>

                <TrendingUp
                  size={17}
                />

              </div>

              <div className="forecast-grid">

                <div>

                  <span>
                    DAILY AVERAGE
                  </span>

                  <strong>
                    {money(
                      dailySpend
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    PROJECTED MONTH
                  </span>

                  <strong>
                    {money(
                      projectedMonthlySpend
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    MONTHLY BUDGET
                  </span>

                  <strong>
                    {budget
                      ? money(
                          budget
                        )
                      : "Not set"}
                  </strong>

                </div>

              </div>

            </section>

          </div>
        )}

        {/* =====================================================
            EXPENSE MODAL
        ===================================================== */}

        <ExpenseModal
          open={
            showExpense
          }
          saving={
            saving
          }
          categories={
            categories
          }
          paymentMethods={
            paymentMethods
          }
          editing={
            !!editingExpense
          }
          initialForm={
            scannerForm ||
            emptyExpenseForm()
          }
          onClose={() => {
            if (saving) {
              return;
            }

            setShowExpense(
              false
            );

            setEditingExpense(
              null
            );

            setScannerForm(
              null
            );

            setActionError(
              ""
            );
          }}
          onSave={
            saveExpense
          }
        />

        {/* =====================================================
            RECEIPT SCANNER
        ===================================================== */}

        {showScanner && (
          <div
            className="modal-overlay"
            onClick={() => {
              if (!saving) {
                setShowScanner(
                  false
                );
              }
            }}
          >

            <div
              className="modal receipt-modal"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <ReceiptScanner
                onClose={() =>
                  setShowScanner(
                    false
                  )
                }
                onDetected={(
                  data: any
                ) => {

                  const rawText =
                    [
                      data.rawText,
                      data.vendor,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      );

                  setShowScanner(
                    false
                  );

                  setEditingExpense(
                    null
                  );

                  setScannerForm({
                    amount:
                      data.amount ||
                      "",
                    category:
                      guessCategory(
                        rawText
                      ),
                    vendor:
                      normalizeVendor(
                        data.vendor ||
                          ""
                      ),
                    method:
                      guessPaymentMethod(
                        rawText
                      ),
                    date:
                      isValidDate(
                        data.date
                      )
                        ? data.date
                        : today(),
                    notes:
                      "Created from scanned receipt",
                  });

                  setShowExpense(
                    true
                  );
                }}
              />

            </div>

          </div>
        )}

        {/* =====================================================
            DELETE CONFIRMATION
        ===================================================== */}

        {deleteTarget && (
          <div
            className="modal-overlay"
            onClick={() => {
              if (!saving) {
                setDeleteTarget(
                  null
                );
              }
            }}
          >

            <div
              className="confirm-modal"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="confirm-icon danger">
                <Trash2
                  size={18}
                />
              </div>

              <span className="section-kicker">
                DELETE TRANSACTION
              </span>

              <h2>
                Delete this expense?
              </h2>

              <p>
                This will permanently
                remove the transaction
                from your PennyPilot
                ledger.
              </p>

              <div className="delete-preview">

                <div>
                  <span>
                    VENDOR
                  </span>

                  <strong>
                    {
                      deleteTarget.vendor
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    AMOUNT
                  </span>

                  <strong>
                    {money(
                      Number(
                        deleteTarget.amount
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    DATE
                  </span>

                  <strong>
                    {formatDate(
                      deleteTarget.expense_date
                    )}
                  </strong>
                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setDeleteTarget(
                      null
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="danger-button"
                  disabled={
                    saving
                  }
                  onClick={
                    confirmDeleteExpense
                  }
                >
                  <Trash2
                    size={14}
                  />

                  {saving
                    ? "Deleting..."
                    : "Delete expense"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            BUDGET MODAL
        ===================================================== */}

        {showBudget && (
          <div
            className="modal-overlay"
            onClick={() => {
              if (!saving) {
                setShowBudget(
                  false
                );
              }
            }}
          >

            <div
              className="modal"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <span className="section-kicker">
                    BUDGET GUARD
                  </span>

                  <h2>
                    Monthly budget
                  </h2>

                  <p>
                    Set the maximum
                    monthly spending
                    limit.
                  </p>

                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowBudget(
                      false
                    )
                  }
                >
                  <X
                    size={17}
                  />
                </button>

              </div>

              <label>
                Monthly spending limit

                <input
                  type="number"
                  min="1"
                  step="1000"
                  autoFocus
                  placeholder="₹ 100000"
                  value={
                    budgetInput
                  }
                  onChange={(
                    event
                  ) =>
                    setBudgetInput(
                      event.target
                        .value
                    )
                  }
                />
              </label>

              <div className="budget-explainer">

                <Wallet
                  size={17}
                />

                <p>
                  PennyPilot compares
                  your real
                  transactions against
                  this limit and
                  calculates your
                  spending pace.
                </p>

              </div>

              <button
                className="primary-button full"
                disabled={
                  saving
                }
                onClick={
                  saveBudget
                }
              >

                {saving
                  ? "Saving..."
                  : "Save budget"}

                {!saving && (
                  <ChevronRight
                    size={15}
                  />
                )}

              </button>

            </div>

          </div>
        )}

        {/* =====================================================
            COPILOT
        ===================================================== */}

        <Copilot
          open={
            showCopilot
          }
          onClose={() =>
            setShowCopilot(
              false
            )
          }
          businessName={
            business.business_name
          }
          expenses={
            expenses
          }
          monthlyBudget={
            budget
          }
        />

      </main>

    </div>
  );
}

/* =========================================================
   NAV BUTTON
========================================================= */

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${
        active
          ? "active"
          : ""
      }`}
      onClick={
        onClick
      }
    >
      {icon}

      <span>
        {label}
      </span>
    </button>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  detail,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`stat-card ${
        danger
          ? "stat-danger"
          : ""
      }`}
    >

      <div className="stat-top">

        <div className="stat-icon">
          {icon}
        </div>

        {danger && (
          <span className="stat-alert">
            ALERT
          </span>
        )}

      </div>

      <p>
        {label}
      </p>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>

    </div>
  );
}

/* =========================================================
   EXPENSE TABLE
========================================================= */

function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (
    expense: Expense
  ) => void;
  onDelete: (
    expense: Expense
  ) => void;
}) {
  return (
    <div className="table-wrapper">

      {expenses.length ===
      0 ? (
        <div className="empty intelligent-empty">

          <div className="empty-icon">
            <Receipt
              size={19}
            />
          </div>

          <strong>
            No expenses found
          </strong>

          <p>
            Add your first real
            transaction to start
            building your financial
            picture.
          </p>

        </div>
      ) : (
        <table>

          <thead>
            <tr>

              <th>
                Date
              </th>

              <th>
                Vendor
              </th>

              <th>
                Category
              </th>

              <th>
                Payment
              </th>

              <th className="amount-heading">
                Amount
              </th>

              <th />

            </tr>
          </thead>

          <tbody>

            {expenses.map(
              (
                expense
              ) => (
                <tr
                  key={
                    expense.id
                  }
                >

                  <td>
                    {formatDate(
                      expense.expense_date
                    )}
                  </td>

                  <td>

                    <strong>
                      {
                        expense.vendor ||
                        "Unknown"
                      }
                    </strong>

                  </td>

                  <td>

                    <span className="category-pill">
                      {
                        expense.category ||
                        "Uncategorized"
                      }
                    </span>

                  </td>

                  <td>

                    <span className="payment-text">
                      {
                        expense.payment_method ||
                        "Unknown"
                      }
                    </span>

                  </td>

                  <td className="amount-cell">

                    <strong>
                      {money(
                        Number(
                          expense.amount
                        )
                      )}
                    </strong>

                  </td>

                  <td>

                    <div className="expense-actions">

                      <button
                        className="row-action"
                        title="Edit expense"
                        onClick={() =>
                          onEdit(
                            expense
                          )
                        }
                      >
                        <Pencil
                          size={13}
                        />
                      </button>

                      <button
                        className="row-action danger"
                        title="Delete expense"
                        onClick={() =>
                          onDelete(
                            expense
                          )
                        }
                      >
                        <Trash2
                          size={13}
                        />
                      </button>

                    </div>

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>
      )}

    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   VALID DATE
========================================================= */

function isValidDate(
  value?: string
) {
  if (!value) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return (
    !Number.isNaN(
      date.getTime()
    ) &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  );
}

/* =========================================================
   ANOMALY DETECTION
========================================================= */

function countAnomalies(
  expenses: Expense[]
) {
  if (
    expenses.length < 3
  ) {
    return 0;
  }

  let count = 0;

  for (const expense of expenses) {
    const historical =
      expenses.filter(
        (other) =>
          other.id !==
            expense.id &&
          other.category ===
            expense.category
      );

    if (
      historical.length <
      2
    ) {
      continue;
    }

    const average =
      historical.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount
          ),
        0
      ) /
      historical.length;

    if (
      average > 0 &&
      Number(
        expense.amount
      ) /
        average >=
        2.5
    ) {
      count++;
    }
  }

  return count;
}

/* =========================================================
   RECEIPT CATEGORY GUESS
========================================================= */

function guessCategory(
  text: string
) {
  const value =
    text
      ?.toLowerCase() ||
    "";

  if (
    value.includes(
      "fuel"
    ) ||
    value.includes(
      "petrol"
    ) ||
    value.includes(
      "diesel"
    ) ||
    value.includes(
      "transport"
    ) ||
    value.includes(
      "uber"
    ) ||
    value.includes(
      "ola"
    ) ||
    value.includes(
      "logistics"
    )
  ) {
    return "Logistics";
  }

  if (
    value.includes(
      "advert"
    ) ||
    value.includes(
      "marketing"
    ) ||
    value.includes(
      "facebook ads"
    ) ||
    value.includes(
      "google ads"
    ) ||
    value.includes(
      "meta"
    )
  ) {
    return "Marketing";
  }

  if (
    value.includes(
      "rent"
    ) ||
    value.includes(
      "lease"
    )
  ) {
    return "Rent";
  }

  if (
    value.includes(
      "office"
    ) ||
    value.includes(
      "stationery"
    ) ||
    value.includes(
      "paper"
    ) ||
    value.includes(
      "printer"
    )
  ) {
    return "Office";
  }

  if (
    value.includes(
      "salary"
    ) ||
    value.includes(
      "payroll"
    ) ||
    value.includes(
      "employee"
    ) ||
    value.includes(
      "wages"
    )
  ) {
    return "Salaries";
  }

  if (
    value.includes(
      "repair"
    ) ||
    value.includes(
      "maintenance"
    ) ||
    value.includes(
      "service center"
    )
  ) {
    return "Maintenance";
  }

  if (
    value.includes(
      "electricity"
    ) ||
    value.includes(
      "electric"
    ) ||
    value.includes(
      "water bill"
    ) ||
    value.includes(
      "internet"
    ) ||
    value.includes(
      "airtel"
    ) ||
    value.includes(
      "jio"
    ) ||
    value.includes(
      "vi "
    )
  ) {
    return "Utilities";
  }

  return "Raw Materials";
}

/* =========================================================
   PAYMENT METHOD GUESS
========================================================= */

function guessPaymentMethod(
  text: string
) {
  const value =
    text
      ?.toLowerCase() ||
    "";

  if (
    value.includes(
      "upi"
    ) ||
    value.includes(
      "gpay"
    ) ||
    value.includes(
      "google pay"
    ) ||
    value.includes(
      "phonepe"
    ) ||
    value.includes(
      "paytm"
    ) ||
    value.includes(
      "bhim"
    ) ||
    value.includes(
      "vpa"
    ) ||
    value.includes(
      "@upi"
    )
  ) {
    return "UPI";
  }

  if (
    value.includes(
      "visa"
    ) ||
    value.includes(
      "mastercard"
    ) ||
    value.includes(
      "credit card"
    ) ||
    value.includes(
      "debit card"
    ) ||
    value.includes(
      "card"
    )
  ) {
    return "Card";
  }

  if (
    value.includes(
      "cash"
    ) ||
    value.includes(
      "cash paid"
    )
  ) {
    return "Cash";
  }

  if (
    value.includes(
      "bank transfer"
    ) ||
    value.includes(
      "neft"
    ) ||
    value.includes(
      "rtgs"
    ) ||
    value.includes(
      "imps"
    )
  ) {
    return "Bank";
  }

  return "UPI";
}