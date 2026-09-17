"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  X,
  Send,
  Sparkles,
  Wallet,
  Loader2,
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

type Props = {
  open: boolean;
  onClose: () => void;
  businessName: string;
  expenses: Expense[];
  monthlyBudget: number;
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

const QUICK_QUESTIONS = [
  "Why did I spend more this month?",
  "What is my largest expense?",
  "Where is most of my money going?",
  "Which vendor gets the most money?",
  "How much budget do I have left?",
  "Can I afford another ₹40,000 expense?",
];

function formatMessage(text: string) {
  const parts = text.split(
    /(\*\*.*?\*\*)/g
  );

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return (
      <span key={index}>
        {part}
      </span>
    );
  });
}

export default function Copilot({
  open,
  onClose,
  businessName,
  expenses,
  monthlyBudget,
}: Props) {
  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [messages, setMessages] =
    useState<Message[]>([
      {
        role: "assistant",
        text: `I'm PennyPilot Copilot. Ask me anything about ${businessName}'s financial activity.`,
      },
    ]);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Keep the conversation pinned to the
   * newest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  /*
   * Reset the opening message if the
   * business changes.
   */
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text: `I'm PennyPilot Copilot. Ask me anything about ${businessName}'s financial activity.`,
      },
    ]);
  }, [businessName]);

  if (!open) {
    return null;
  }

  async function ask(
    rawQuestion: string
  ) {
    const clean =
      rawQuestion.trim();

    if (
      !clean ||
      loading
    ) {
      return;
    }

    const conversation =
      messages.map(
        (message) => ({
          role:
            message.role,
          content:
            message.text,
        })
      );

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: clean,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/copilot",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              question:
                clean,

              businessName,

              monthlyBudget,

              expenses,

              conversation,
            }),
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Request failed with status ${response.status}.`
        );
      }

      if (
        typeof data?.answer !==
          "string" ||
        !data.answer.trim()
      ) {
        throw new Error(
          "The AI returned an empty answer."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role:
            "assistant",
          text:
            data.answer.trim(),
        },
      ]);
    } catch (error) {
      console.error(
        "PennyPilot Copilot:",
        error
      );

      setMessages((current) => [
        ...current,
        {
          role:
            "assistant",
          text:
            error instanceof Error
              ? error.message
              : "Copilot could not answer that question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    void ask(question);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void ask(question);
    }
  }

  return (
    <div className="copilot-overlay">
      <section
        className="copilot-panel"
        aria-label="PennyPilot Copilot"
      >
        {/* HEADER */}
        <header className="copilot-header">
          <div className="copilot-title">
            <div className="copilot-icon">
              <Sparkles size={17} />
            </div>

            <div>
              <h2>
                PennyPilot Copilot
              </h2>

              <span>
                AI financial intelligence
              </span>
            </div>
          </div>

          <button
            className="copilot-close"
            onClick={onClose}
            aria-label="Close Copilot"
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        {/* CONNECTION STATUS */}
        <div className="copilot-status">
          <div className="status-left">
            <span className="status-dot" />

            <span>
              Connected to your financial ledger
            </span>
          </div>

          <span className="model-pill">
            GPT-OSS 120B
          </span>
        </div>

        {/* CHAT */}
        <main className="copilot-messages">
          {messages.map(
            (message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`message-row ${message.role}`}
              >
                {message.role ===
                  "assistant" && (
                  <div className="assistant-avatar">
                    <Sparkles
                      size={13}
                    />
                  </div>
                )}

                <div
                  className={`message-bubble ${message.role}`}
                >
                  {formatMessage(
                    message.text
                  )}
                </div>
              </div>
            )
          )}

          {/* LOADING */}
          {loading && (
            <div className="message-row assistant">
              <div className="assistant-avatar">
                <Sparkles
                  size={13}
                />
              </div>

              <div className="message-bubble assistant loading">
                <Loader2
                  size={14}
                  className="spinner"
                />

                <span>
                  Analyzing your financial data…
                </span>
              </div>
            </div>
          )}

          {/* QUICK QUESTIONS */}
          {messages.length === 1 &&
            !loading && (
              <div className="quick-section">
                <div className="quick-label">
                  Ask PennyPilot
                </div>

                <div className="quick-list">
                  {QUICK_QUESTIONS.map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          void ask(
                            item
                          )
                        }
                      >
                        <span>
                          {item}
                        </span>

                        <span className="quick-arrow">
                          →
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

          <div
            ref={messagesEndRef}
            className="messages-end"
          />
        </main>

        {/* INPUT */}
        <footer className="copilot-footer">
          <form
            className="copilot-input"
            onSubmit={
              handleSubmit
            }
          >
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask anything about your finances..."
              rows={1}
              disabled={loading}
              aria-label="Ask PennyPilot"
            />

            <button
              type="submit"
              disabled={
                loading ||
                !question.trim()
              }
              aria-label="Send question"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="spinner"
                />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>

          <div className="footer-note">
            <span>
              <Wallet size={11} />

              Grounded in your ledger
            </span>

            <span>
              AI can make mistakes
            </span>
          </div>
        </footer>
      </section>

      <style jsx>{`
        .copilot-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;

          display: flex;
          justify-content: flex-end;

          background: rgba(
            3,
            7,
            18,
            0.48
          );

          backdrop-filter: blur(
            6px
          );

          -webkit-backdrop-filter:
            blur(6px);
        }

        .copilot-panel {
          width: min(
            500px,
            100vw
          );

          height: 100dvh;

          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background: #ffffff;

          border-left: 1px solid
            #dbe2ea;

          box-shadow:
            -24px 0 70px
            rgba(
              15,
              23,
              42,
              0.24
            );
        }

        /* HEADER */

        .copilot-header {
          min-height: 76px;

          flex: 0 0 76px;

          padding: 18px 20px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-bottom: 1px solid
            #e5e7eb;

          background: #ffffff;
        }

        .copilot-title {
          display: flex;
          align-items: center;
          gap: 12px;

          min-width: 0;
        }

        .copilot-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background: #111827;
          color: #ffffff;
        }

        .copilot-title h2 {
          margin: 0;

          color: #111827;

          font-size: 15px;
          font-weight: 700;

          letter-spacing: -0.02em;
        }

        .copilot-title span {
          display: block;

          margin-top: 3px;

          color: #6b7280;

          font-size: 11px;
        }

        .copilot-close {
          width: 34px;
          height: 34px;

          flex: 0 0 34px;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 8px;

          background: transparent;
          color: #6b7280;

          cursor: pointer;

          transition:
            background 0.15s,
            color 0.15s;
        }

        .copilot-close:hover {
          background: #f3f4f6;
          color: #111827;
        }

        /* STATUS */

        .copilot-status {
          min-height: 38px;

          flex: 0 0 auto;

          margin: 12px 18px 0;

          padding: 8px 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          border: 1px solid
            #e5e7eb;

          border-radius: 8px;

          background: #fafafa;

          color: #4b5563;

          font-size: 10px;
        }

        .status-left {
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-left span:last-child {
          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .status-dot {
          width: 7px;
          height: 7px;

          flex: 0 0 7px;

          border-radius: 50%;

          background: #16a34a;

          box-shadow:
            0 0 0 3px
            rgba(
              22,
              163,
              74,
              0.1
            );
        }

        .model-pill {
          flex: 0 0 auto;

          padding: 4px 8px;

          border-radius: 5px;

          background: #eef2ff;

          color: #4338ca;

          font-size: 9px;
          font-weight: 700;

          white-space: nowrap;
        }

        /* MESSAGES */

        .copilot-messages {
          flex: 1 1 auto;

          min-height: 0;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 20px 18px 18px;

          scroll-behavior: smooth;

          overscroll-behavior: contain;
        }

        .copilot-messages::-webkit-scrollbar {
          width: 6px;
        }

        .copilot-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .copilot-messages::-webkit-scrollbar-thumb {
          background: #d1d5db;

          border-radius: 999px;
        }

        .message-row {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          margin-bottom: 16px;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .assistant-avatar {
          width: 27px;
          height: 27px;

          flex: 0 0 27px;

          display: grid;
          place-items: center;

          margin-top: 2px;

          border-radius: 8px;

          background: #111827;
          color: #ffffff;
        }

        .message-bubble {
          max-width: 88%;

          padding: 12px 14px;

          border-radius: 12px;

          font-size: 13px;
          line-height: 1.6;

          white-space: pre-wrap;

          overflow-wrap: anywhere;
        }

        .message-bubble strong {
          font-weight: 700;
        }

        .message-bubble.user {
          background: #111827;
          color: #ffffff;

          border-bottom-right-radius: 4px;
        }

        .message-bubble.assistant {
          background: #f3f4f6;

          border: 1px solid
            #e5e7eb;

          color: #1f2937;

          border-bottom-left-radius: 4px;
        }

        .message-bubble.loading {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #6b7280;
        }

        .messages-end {
          height: 1px;
        }

        /* QUICK QUESTIONS */

        .quick-section {
          margin-top: 24px;

          padding-bottom: 10px;
        }

        .quick-label {
          margin-bottom: 9px;

          color: #6b7280;

          font-size: 10px;
          font-weight: 700;

          text-transform: uppercase;

          letter-spacing: 0.06em;
        }

        .quick-list {
          display: flex;
          flex-direction: column;

          gap: 7px;
        }

        .quick-list button {
          width: 100%;

          min-height: 40px;

          padding: 9px 11px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          text-align: left;

          border: 1px solid
            #e5e7eb;

          border-radius: 9px;

          background: #ffffff;

          color: #374151;

          font-family: inherit;

          font-size: 12px;

          cursor: pointer;

          transition:
            background 0.15s,
            border-color 0.15s,
            transform 0.15s;
        }

        .quick-list button:hover {
          background: #f9fafb;

          border-color: #9ca3af;

          transform: translateX(
            2px
          );
        }

        .quick-arrow {
          flex: 0 0 auto;

          color: #9ca3af;

          font-size: 15px;

          transition:
            transform 0.15s,
            color 0.15s;
        }

        .quick-list button:hover
          .quick-arrow {
          color: #111827;

          transform: translateX(
            2px
          );
        }

        /* FOOTER */

        .copilot-footer {
          flex: 0 0 auto;

          padding: 14px 18px 18px;

          border-top: 1px solid
            #e5e7eb;

          background: #ffffff;
        }

        .copilot-input {
          display: flex;
          align-items: flex-end;

          gap: 8px;

          padding: 8px;

          border: 1px solid
            #d1d5db;

          border-radius: 11px;

          background: #fafafa;

          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }

        .copilot-input:focus-within {
          border-color: #9ca3af;

          box-shadow:
            0 0 0 3px
            rgba(
              17,
              24,
              39,
              0.05
            );
        }

        .copilot-input textarea {
          flex: 1;

          min-width: 0;

          min-height: 26px;
          max-height: 100px;

          resize: none;

          padding: 5px 6px;

          border: 0;
          outline: 0;

          background: transparent;

          color: #111827;

          font-family: inherit;
          font-size: 13px;
          line-height: 1.4;
        }

        .copilot-input textarea::placeholder {
          color: #9ca3af;
        }

        .copilot-input textarea:disabled {
          opacity: 0.55;
        }

        .copilot-input button {
          width: 32px;
          height: 32px;

          flex: 0 0 32px;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 8px;

          background: #111827;
          color: #ffffff;

          cursor: pointer;

          transition:
            opacity 0.15s,
            transform 0.15s;
        }

        .copilot-input button:not(
            :disabled
          ):hover {
          transform: translateY(
            -1px
          );
        }

        .copilot-input button:disabled {
          opacity: 0.35;

          cursor: default;
        }

        .footer-note {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-top: 9px;

          color: #9ca3af;

          font-size: 9px;
        }

        .footer-note span {
          display: flex;
          align-items: center;

          gap: 4px;

          min-width: 0;
        }

        .footer-note span:last-child {
          text-align: right;
        }

        /* SPINNER */

        .spinner {
          animation:
            spin 0.8s linear
            infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(
              360deg
            );
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .copilot-panel {
            width: 100%;
          }

          .copilot-header {
            padding-left: 16px;
            padding-right: 16px;
          }

          .copilot-status {
            margin-left: 14px;
            margin-right: 14px;
          }

          .copilot-messages {
            padding-left: 14px;
            padding-right: 14px;
          }

          .copilot-footer {
            padding-left: 14px;
            padding-right: 14px;
          }

          .message-bubble {
            max-width: 91%;
          }
        }
      `}</style>
    </div>
  );
}