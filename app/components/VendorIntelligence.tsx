"use client";

import {
  Building2,
  CalendarDays,
  Layers3,
  Receipt,
  TrendingUp,
} from "lucide-react";

import {
  analyzeVendors,
  calculateVendorConcentration,
  VendorExpense,
} from "@/lib/vendorEngine";

type Props = {
  expenses: VendorExpense[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VendorIntelligence({
  expenses,
}: Props) {
  const vendors = analyzeVendors(expenses);

  const concentration =
    calculateVendorConcentration(vendors);

  if (!vendors.length) {
    return (
      <section className="vendor-intelligence-card">
        <div className="vendor-intelligence-header">
          <div>
            <div className="vendor-eyebrow">
              VENDOR INTELLIGENCE
            </div>

            <h2>Vendor intelligence</h2>

            <p>
              PennyPilot will build vendor profiles as
              transactions are recorded.
            </p>
          </div>

          <div className="vendor-header-icon">
            <Building2 size={19} />
          </div>
        </div>

        <div className="vendor-empty">
          <Building2 size={19} />

          <span>
            No vendor spending data available yet.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="vendor-intelligence-card">
      <div className="vendor-intelligence-header">
        <div>
          <div className="vendor-eyebrow">
            VENDOR INTELLIGENCE
          </div>

          <h2>Vendor intelligence</h2>

          <p>
            Understand where your business money is
            going and how concentrated your spending is.
          </p>
        </div>

        <div className="vendor-header-icon">
          <Building2 size={19} />
        </div>
      </div>

      <div className="vendor-summary">
        <div>
          <span>Vendors</span>
          <strong>{vendors.length}</strong>
        </div>

        <div>
          <span>Top vendor share</span>
          <strong>
            {concentration.topVendorShare}%
          </strong>
        </div>

        <div>
          <span>Top 3 share</span>
          <strong>
            {concentration.topThreeShare}%
          </strong>
        </div>
      </div>

      <div className="vendor-list">
        {vendors.slice(0, 8).map((vendor, index) => (
          <div
            className="vendor-row"
            key={vendor.vendor}
          >
            <div className="vendor-rank">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="vendor-main">
              <div className="vendor-name">
                {vendor.vendor}
              </div>

              <div className="vendor-meta">
                {vendor.dominantCategory}
                {" · "}
                {vendor.transactionCount}{" "}
                {vendor.transactionCount === 1
                  ? "transaction"
                  : "transactions"}
              </div>
            </div>

            <div className="vendor-stats">
              <div className="vendor-stat">
                <span>Total spend</span>
                <strong>
                  {money(vendor.totalSpend)}
                </strong>
              </div>

              <div className="vendor-stat">
                <span>Average</span>
                <strong>
                  {money(
                    vendor.averageTransaction
                  )}
                </strong>
              </div>

              <div className="vendor-stat">
                <span>Share</span>
                <strong>
                  {vendor.spendingShare}%
                </strong>
              </div>

              <div className="vendor-stat vendor-last">
                <span>Last transaction</span>
                <strong>
                  {formatDate(vendor.latestDate)}
                </strong>
              </div>
            </div>

            <div className="vendor-chevron">
              <TrendingUp size={15} />
            </div>
          </div>
        ))}
      </div>

      {vendors.some(
        (vendor) => vendor.isHighConcentration
      ) && (
        <div className="vendor-concentration">
          <Layers3 size={16} />

          <span>
            One or more vendors account for a
            significant share of recorded spending.
            PennyPilot can use this concentration signal
            when generating financial insights.
          </span>
        </div>
      )}
    </section>
  );
}