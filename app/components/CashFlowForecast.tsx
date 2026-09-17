"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Gauge,
  TrendingUp,
} from "lucide-react";

import {
  calculateCashFlowForecast,
  CashFlowExpense,
} from "@/lib/cashFlowEngine";

type Props = {
  expenses: CashFlowExpense[];
  budget: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }

  if (Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return money(value);
}

export default function CashFlowForecast({
  expenses,
  budget,
}: Props) {
  const forecast = calculateCashFlowForecast(
    expenses,
    budget
  );

  const statusLabel = {
    healthy: "On track",
    watch: "Watch spending",
    "over-budget": "Budget overrun projected",
    "insufficient-data": "Waiting for data",
  }[forecast.forecastStatus];

  const statusIcon =
    forecast.forecastStatus === "over-budget" ? (
      <CircleAlert size={17} />
    ) : (
      <Gauge size={17} />
    );

  return (
    <section className="cashflow-card">
      <div className="cashflow-header">
        <div>
          <div className="cashflow-eyebrow">
            PREDICTIVE INTELLIGENCE
          </div>

          <h2>Cash-flow forecast</h2>

          <p>
            Projected from your recorded spending
            velocity.
          </p>
        </div>

        <div className="cashflow-status">
          {statusIcon}
          {statusLabel}
        </div>
      </div>

      <div className="cashflow-hero">
        <div>
          <span>Projected month-end spend</span>

          <strong>
            {compactMoney(
              forecast.projectedMonthEnd
            )}
          </strong>

          <small>
            Based on {money(forecast.dailyBurn)} average
            daily burn.
          </small>
        </div>

        <div className="cashflow-hero-icon">
          <TrendingUp size={22} />
        </div>
      </div>

      <div className="cashflow-grid">
        <div className="cashflow-metric">
          <div className="cashflow-metric-icon">
            <ArrowUpRight size={16} />
          </div>

          <div>
            <span>Daily burn</span>
            <strong>
              {money(forecast.dailyBurn)}
            </strong>
          </div>
        </div>

        <div className="cashflow-metric">
          <div className="cashflow-metric-icon">
            <CalendarDays size={16} />
          </div>

          <div>
            <span>30-day outflow</span>
            <strong>
              {compactMoney(
                forecast.projected30DayOutflow
              )}
            </strong>
          </div>
        </div>

        <div className="cashflow-metric">
          <div className="cashflow-metric-icon">
            <Gauge size={16} />
          </div>

          <div>
            <span>Budget utilization</span>
            <strong>
              {forecast.budget > 0
                ? `${Math.round(
                    forecast.budgetUtilization
                  )}%`
                : "No budget"}
            </strong>
          </div>
        </div>

        <div className="cashflow-metric">
          <div className="cashflow-metric-icon">
            <CircleAlert size={16} />
          </div>

          <div>
            <span>Budget remaining</span>
            <strong>
              {money(forecast.remainingBudget)}
            </strong>
          </div>
        </div>
      </div>

      <div className="cashflow-progress">
        <div className="cashflow-progress-label">
          <span>
            {money(forecast.currentSpend)} spent
          </span>

          <span>
            {forecast.budget > 0
              ? `${money(forecast.budget)} limit`
              : "No budget set"}
          </span>
        </div>

        <div className="cashflow-progress-track">
          <div
            className={`cashflow-progress-fill ${forecast.forecastStatus}`}
            style={{
              width: `${Math.min(
                forecast.budget > 0
                  ? forecast.budgetUtilization
                  : 0,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="cashflow-insight">
        {forecast.forecastStatus ===
          "over-budget" && (
          <>
            <CircleAlert size={16} />

            <span>
              At the current spending pace, PennyPilot
              projects approximately{" "}
              <strong>
                {money(forecast.projectedOverrun)}
              </strong>{" "}
              above your monthly budget.
            </span>
          </>
        )}

        {forecast.forecastStatus === "watch" && (
          <>
            <CircleAlert size={16} />

            <span>
              Your current spending pace puts the
              projected month-end spend close to the
              budget limit.
            </span>
          </>
        )}

        {forecast.forecastStatus === "healthy" && (
          <>
            <Gauge size={16} />

            <span>
              Your current spending pace projects
              approximately{" "}
              <strong>
                {money(
                  Math.max(
                    0,
                    forecast.budget -
                      forecast.projectedMonthEnd
                  )
                )}
              </strong>{" "}
              of unused budget by month-end.
            </span>
          </>
        )}

        {forecast.forecastStatus ===
          "insufficient-data" && (
          <>
            <CalendarDays size={16} />

            <span>
              Add transactions to build a spending
              velocity baseline and generate a forecast.
            </span>
          </>
        )}
      </div>
    </section>
  );
}