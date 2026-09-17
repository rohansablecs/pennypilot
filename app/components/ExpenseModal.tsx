"use client";

import { useEffect, useState } from "react";
import { X, Save, ReceiptText } from "lucide-react";

export type ExpenseForm = {
  amount: string;
  category: string;
  vendor: string;
  method: string;
  date: string;
  notes: string;
};

type Props = {
  open: boolean;
  saving: boolean;
  initialForm: ExpenseForm;
  categories: string[];
  paymentMethods: string[];
  editing?: boolean;
  onClose: () => void;
  onSave: (form: ExpenseForm) => void;
};

export default function ExpenseModal({
  open,
  saving,
  initialForm,
  categories,
  paymentMethods,
  editing = false,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ExpenseForm>(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError("");
    }
  }, [open, initialForm]);

  if (!open) return null;

  function update(field: keyof ExpenseForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function validate() {
    const amount = Number(form.amount);

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      return "Enter a valid expense amount.";
    }

    if (amount > 100000000) {
      return "Amount is too large.";
    }

    if (!form.vendor.trim()) {
      return "Enter a vendor.";
    }

    if (form.vendor.trim().length < 2) {
      return "Vendor name is too short.";
    }

    if (!form.category) {
      return "Select a category.";
    }

    if (!form.method) {
      return "Select a payment method.";
    }

    if (!form.date) {
      return "Select an expense date.";
    }

    return "";
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    onSave({
      ...form,
      amount: String(Number(form.amount).toFixed(2)),
      vendor: form.vendor.trim().replace(/\s+/g, " "),
      notes: form.notes.trim(),
    });
  }

  return (
    <>
      <div
        className="pp-modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !saving) {
            onClose();
          }
        }}
      >
        <div className="pp-expense-modal">
          {/* HEADER */}
          <div className="pp-modal-header">
            <div className="pp-modal-heading">
              <div className="pp-modal-icon">
                {editing ? (
                  <Save size={19} strokeWidth={2} />
                ) : (
                  <ReceiptText size={19} strokeWidth={2} />
                )}
              </div>

              <div>
                <h2>
                  {editing ? "Edit expense" : "Add expense"}
                </h2>

                <p>
                  {editing
                    ? "Update the transaction details."
                    : "Record a business expense."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="pp-modal-close"
              onClick={onClose}
              disabled={saving}
              aria-label="Close modal"
            >
              <X size={19} />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={submit}>
            <div className="pp-form-grid">
              {/* AMOUNT */}
              <div className="pp-field pp-full">
                <label htmlFor="expense-amount">
                  Amount
                </label>

                <div className="pp-amount-input">
                  <span>₹</span>

                  <input
                    id="expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      update("amount", e.target.value)
                    }
                    autoFocus
                  />
                </div>
              </div>

              {/* VENDOR */}
              <div className="pp-field">
                <label htmlFor="expense-vendor">
                  Vendor
                </label>

                <input
                  id="expense-vendor"
                  type="text"
                  placeholder="e.g. Reliance, Amazon"
                  value={form.vendor}
                  onChange={(e) =>
                    update("vendor", e.target.value)
                  }
                />
              </div>

              {/* CATEGORY */}
              <div className="pp-field">
                <label htmlFor="expense-category">
                  Category
                </label>

                <select
                  id="expense-category"
                  value={form.category}
                  onChange={(e) =>
                    update("category", e.target.value)
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAYMENT */}
              <div className="pp-field">
                <label htmlFor="expense-method">
                  Payment method
                </label>

                <select
                  id="expense-method"
                  value={form.method}
                  onChange={(e) =>
                    update("method", e.target.value)
                  }
                >
                  <option value="">
                    Select method
                  </option>

                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE */}
              <div className="pp-field">
                <label htmlFor="expense-date">
                  Date
                </label>

                <input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    update("date", e.target.value)
                  }
                />
              </div>

              {/* NOTES */}
              <div className="pp-field pp-full">
                <label htmlFor="expense-notes">
                  Notes
                </label>

                <textarea
                  id="expense-notes"
                  rows={3}
                  placeholder="Optional note about this expense..."
                  value={form.notes}
                  onChange={(e) =>
                    update("notes", e.target.value)
                  }
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="pp-form-error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* ACTIONS */}
            <div className="pp-modal-actions">
              <button
                type="button"
                className="pp-secondary-button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="pp-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update expense"
                    : "Save expense"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .pp-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.38);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: ppFadeIn 140ms ease-out;
        }

        .pp-expense-modal {
          width: min(620px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow:
            0 28px 80px rgba(15, 23, 42, 0.2),
            0 8px 24px rgba(15, 23, 42, 0.08);
          animation: ppModalIn 160ms ease-out;
        }

        .pp-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px;
          border-bottom: 1px solid #edf0f2;
        }

        .pp-modal-heading {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .pp-modal-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f1f5f9;
          color: #111827;
        }

        .pp-modal-heading h2 {
          margin: 0;
          color: #111827;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .pp-modal-heading p {
          margin: 5px 0 0;
          color: #7a8088;
          font-size: 12px;
          line-height: 1.4;
        }

        .pp-modal-close {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 34px;
          border: 1px solid #e5e7eb;
          border-radius: 9px;
          background: #ffffff;
          color: #6b7280;
          cursor: pointer;
          transition:
            background 120ms ease,
            color 120ms ease,
            border-color 120ms ease;
        }

        .pp-modal-close:hover:not(:disabled) {
          background: #f8fafc;
          color: #111827;
          border-color: #d1d5db;
        }

        .pp-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        form {
          padding: 22px 24px 24px;
        }

        .pp-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px 16px;
        }

        .pp-field {
          min-width: 0;
        }

        .pp-full {
          grid-column: 1 / -1;
        }

        .pp-field label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 12px;
          font-weight: 650;
        }

        .pp-field input,
        .pp-field select,
        .pp-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe3e8;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #111827;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 120ms ease,
            box-shadow 120ms ease;
        }

        .pp-field input,
        .pp-field select {
          height: 42px;
          padding: 0 12px;
        }

        .pp-field textarea {
          min-height: 82px;
          padding: 11px 12px;
          resize: vertical;
          line-height: 1.45;
        }

        .pp-field input::placeholder,
        .pp-field textarea::placeholder {
          color: #a3a8af;
        }

        .pp-field input:focus,
        .pp-field select:focus,
        .pp-field textarea:focus {
          border-color: #111827;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
        }

        .pp-amount-input {
          position: relative;
        }

        .pp-amount-input span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #374151;
          font-size: 15px;
          font-weight: 650;
          pointer-events: none;
        }

        .pp-amount-input input {
          padding-left: 31px;
          height: 50px;
          font-size: 20px;
          font-weight: 650;
          letter-spacing: -0.02em;
        }

        .pp-form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 17px;
          padding: 10px 12px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
        }

        .pp-form-error span {
          width: 17px;
          height: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #dc2626;
          color: white;
          font-size: 11px;
          font-weight: 800;
        }

        .pp-modal-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #edf0f2;
        }

        .pp-secondary-button,
        .pp-primary-button {
          height: 40px;
          padding: 0 16px;
          border-radius: 9px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition:
            transform 100ms ease,
            background 120ms ease,
            border-color 120ms ease;
        }

        .pp-secondary-button {
          border: 1px solid #dfe3e8;
          background: #ffffff;
          color: #374151;
        }

        .pp-secondary-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cfd4da;
        }

        .pp-primary-button {
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
        }

        .pp-primary-button:hover:not(:disabled) {
          background: #242a33;
        }

        .pp-primary-button:active:not(:disabled),
        .pp-secondary-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .pp-primary-button:disabled,
        .pp-secondary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @keyframes ppFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes ppModalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .pp-modal-backdrop {
            padding: 12px;
            align-items: flex-end;
          }

          .pp-expense-modal {
            max-height: calc(100vh - 24px);
            border-radius: 16px;
          }

          .pp-form-grid {
            grid-template-columns: 1fr;
          }

          .pp-full {
            grid-column: auto;
          }

          .pp-modal-header {
            padding: 18px;
          }

          form {
            padding: 18px;
          }

          .pp-modal-actions {
            position: sticky;
            bottom: 0;
            background: #ffffff;
          }
        }
      `}</style>
    </>
  );
}