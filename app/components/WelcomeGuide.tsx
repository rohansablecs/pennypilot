"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Wallet,
  Activity,
  MessageCircle,
} from "lucide-react";

const WELCOME_STORAGE_KEY = "pennypilot-welcome-seen";

export default function WelcomeGuide() {
  /*
   * null = haven't checked localStorage yet
   * true = show guide
   * false = don't show
   */
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const hasSeenWelcome =
        window.localStorage.getItem(WELCOME_STORAGE_KEY);

      if (hasSeenWelcome === "true") {
        setVisible(false);
        return;
      }

      /*
       * Mark it as seen immediately.
       *
       * This means the guide is truly "first opening" only.
       * Even if the user refreshes without clicking Got it,
       * it will not appear again.
       */
      window.localStorage.setItem(
        WELCOME_STORAGE_KEY,
        "true"
      );

      setVisible(true);
    } catch {
      /*
       * If localStorage is unavailable,
       * still allow the guide to appear for this session.
       */
      setVisible(true);
    }
  }, []);

  /*
   * Prevent hydration flash.
   */
  if (visible !== true) {
    return null;
  }

  const dismiss = () => {
    setVisible(false);

    try {
      window.localStorage.setItem(
        WELCOME_STORAGE_KEY,
        "true"
      );
    } catch {
      // Ignore storage errors.
    }
  };

  return (
    <section className="welcome-guide">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="welcome-main">

        <div className="welcome-heading">

          <span className="welcome-label">
            QUICK START
          </span>

          <h3>
            Get the most out of PennyPilot.
          </h3>

          <p>
            Start by adding your real business
            expenses. PennyPilot will use your
            data to build your financial picture.
          </p>

        </div>

        <button
          type="button"
          className="welcome-close"
          onClick={dismiss}
          aria-label="Dismiss welcome guide"
        >
          <X size={15} />
        </button>

      </div>


      {/* =====================================================
          STEPS
      ===================================================== */}

      <div className="welcome-steps">

        <div className="welcome-step">

          <div className="step-icon">
            <Plus size={15} />
          </div>

          <div>
            <strong>
              Add expenses
            </strong>

            <span>
              Record purchases, bills and
              business spending.
            </span>
          </div>

        </div>


        <div className="welcome-step">

          <div className="step-icon">
            <Wallet size={15} />
          </div>

          <div>
            <strong>
              Set your budget
            </strong>

            <span>
              Add a monthly limit to keep
              spending under control.
            </span>
          </div>

        </div>


        <div className="welcome-step">

          <div className="step-icon">
            <Activity size={15} />
          </div>

          <div>
            <strong>
              Review your analytics
            </strong>

            <span>
              Understand categories, vendors
              and spending patterns.
            </span>
          </div>

        </div>


        <div className="welcome-step">

          <div className="step-icon">
            <MessageCircle size={15} />
          </div>

          <div>
            <strong>
              Ask Copilot
            </strong>

            <span>
              Ask questions about the financial
              data you've recorded.
            </span>
          </div>

        </div>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="welcome-bottom">

        <div className="welcome-tip">

          <span />

          <p>
            Try asking Copilot:

            <strong>
              "Where is most of my money going?"
            </strong>
          </p>

        </div>

        <button
          type="button"
          className="welcome-dismiss"
          onClick={dismiss}
        >
          Got it
        </button>

      </div>


      {/* =====================================================
          COMPONENT STYLES
      ===================================================== */}

      <style jsx>{`

        .welcome-guide {
          width: 100%;
          box-sizing: border-box;

          margin: 0 0 26px;

          padding: 20px 22px;

          border: 1px solid #dce1e5;
          border-radius: 11px;

          background: #ffffff;

          box-shadow:
            0 5px 20px
            rgba(17, 22, 27, 0.035);

          animation:
            welcomeIn
            0.3s
            ease-out;
        }

        @keyframes welcomeIn {

          from {
            opacity: 0;
            transform:
              translateY(-5px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }

        }


        /* =====================================================
           HEADER
        ===================================================== */

        .welcome-main {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;
        }

        .welcome-heading {
          min-width: 0;
        }

        .welcome-label {
          display: block;

          margin-bottom: 6px;

          color: #7b858e;

          font-size: 8px;
          font-weight: 800;

          letter-spacing: 0.17em;
        }

        .welcome-heading h3 {
          margin: 0;

          color: #11161b;

          font-size: 19px;
          line-height: 1.2;

          font-weight: 750;

          letter-spacing: -0.035em;
        }

        .welcome-heading p {
          max-width: 620px;

          margin: 6px 0 0;

          color: #78838c;

          font-size: 10px;
          line-height: 1.5;
        }


        /* =====================================================
           CLOSE
        ===================================================== */

        .welcome-close {
          width: 29px;
          height: 29px;

          flex: 0 0 29px;

          display: grid;
          place-items: center;

          border: 1px solid #dce1e5;
          border-radius: 6px;

          background: #ffffff;
          color: #7c8790;

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease,
            border-color 0.15s ease;
        }

        .welcome-close:hover {
          background: #f4f5f6;

          border-color: #cfd5da;

          color: #11161b;
        }


        /* =====================================================
           STEPS
        ===================================================== */

        .welcome-steps {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 7px;

          margin-top: 18px;
        }

        .welcome-step {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          min-width: 0;

          padding: 11px;

          border: 1px solid #e1e5e8;
          border-radius: 7px;

          background: #fafbfb;

          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            transform 0.15s ease;
        }

        .welcome-step:hover {
          background: #ffffff;

          border-color: #d5dbe0;

          transform:
            translateY(-1px);
        }

        .step-icon {
          width: 27px;
          height: 27px;

          flex: 0 0 27px;

          display: grid;
          place-items: center;

          border: 1px solid #d9dee2;
          border-radius: 6px;

          background: #ffffff;
          color: #68747e;
        }

        .welcome-step strong {
          display: block;

          color: #30373d;

          font-size: 9px;
          font-weight: 750;
        }

        .welcome-step span {
          display: block;

          margin-top: 4px;

          color: #8a949c;

          font-size: 7px;
          line-height: 1.45;
        }


        /* =====================================================
           FOOTER
        ===================================================== */

        .welcome-bottom {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          margin-top: 13px;
          padding-top: 11px;

          border-top: 1px solid #e7e9eb;
        }

        .welcome-tip {
          display: flex;

          align-items: center;

          gap: 7px;

          min-width: 0;
        }

        .welcome-tip > span {
          width: 6px;
          height: 6px;

          flex: 0 0 6px;

          border-radius: 50%;

          background: #3f7f5b;
        }

        .welcome-tip p {
          margin: 0;

          color: #7c8790;

          font-size: 8px;
        }

        .welcome-tip strong {
          margin-left: 4px;

          color: #4e5962;

          font-weight: 700;
        }


        /* =====================================================
           DISMISS
        ===================================================== */

        .welcome-dismiss {
          flex: 0 0 auto;

          height: 29px;

          padding: 0 13px;

          border: 1px solid #d8dde1;
          border-radius: 6px;

          background: #ffffff;
          color: #4f5a64;

          font-family: inherit;

          font-size: 8px;
          font-weight: 700;

          cursor: pointer;

          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
        }

        .welcome-dismiss:hover {
          background: #f4f5f6;

          border-color: #cfd5da;

          color: #11161b;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1000px) {

          .welcome-steps {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {

          .welcome-guide {
            padding: 17px;
          }

          .welcome-steps {
            grid-template-columns: 1fr;
          }

          .welcome-bottom {
            align-items: flex-start;

            flex-direction: column;
          }

          .welcome-dismiss {
            width: 100%;
          }

        }

      `}</style>

    </section>
  );
}