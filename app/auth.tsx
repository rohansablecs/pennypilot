"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  Check,
  ArrowUpRight,
} from "lucide-react";

const enterprises = [
  ["🏭", "Manufacturing", "Factories, workshops & production"],
  ["🛒", "Retail", "Shops & consumer businesses"],
  ["🚚", "Logistics & Transport", "Fleet, freight & delivery"],
  ["🍽️", "Food & Hospitality", "Restaurants, cafés & food"],
  ["💻", "IT & Services", "Software & professional services"],
  ["🏗️", "Construction", "Contractors & construction"],
  ["📦", "Wholesale & Distribution", "Trading & distribution"],
  ["✦", "Other", "Other MSME businesses"],
];

export default function Auth() {
  const [mode, setMode] =
    useState<"login" | "signup">("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [enterprise, setEnterprise] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit() {
    setError("");

    const cleanEmail = email.trim();
    const cleanBusiness = businessName.trim();

    if (!cleanEmail || !password) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    if (
      mode === "signup" &&
      !cleanBusiness
    ) {
      setError(
        "Enter your business name."
      );
      return;
    }

    if (
      mode === "signup" &&
      !enterprise
    ) {
      setError(
        "Select your enterprise type."
      );
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const {
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        setError(
          loginError.message
        );
      }

      setLoading(false);
      return;
    }

    const {
      data,
      error: signupError,
    } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            business_name:
              cleanBusiness,
            enterprise_type:
              enterprise,
          },
        },
      });

    if (signupError) {
      setError(
        signupError.message
      );
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        "Account creation failed."
      );
      setLoading(false);
      return;
    }

    /*
     * The database trigger creates the
     * businesses record automatically.
     */

    if (!data.session) {
      setError(
        "Account created. Please verify your email, then sign in."
      );

      setMode("login");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <main className="auth-page">

      {/* ================================================= */}
      {/* LEFT — BRAND / PRODUCT */}
      {/* ================================================= */}

      <section className="auth-intro">

        <div className="intro-inner">

          {/* BRAND */}

          <div className="brand">

            <div className="brand-logo">
              <img
                src="/icon.svg"
                alt="PennyPilot"
              />
            </div>

            <div className="brand-name">
              PennyPilot
            </div>

          </div>

          {/* MAIN MESSAGE */}

          <div className="intro-content">

            <div className="intro-label">
              FINANCIAL OS
            </div>

            <h1>
              Financial clarity
              <br />
              <span>
                for your business.
              </span>
            </h1>

            <p>
              Keep your expenses organized,
              understand your spending and
              stay in control of your business
              finances from one workspace.
            </p>

            <div className="intro-rule" />

            {/* PRODUCT PRINCIPLES */}

            <div className="principles">

              <div className="principle">

                <div className="principle-number">
                  01
                </div>

                <div>
                  <strong>
                    Track
                  </strong>

                  <span>
                    Keep every business expense
                    in one place.
                  </span>
                </div>

              </div>

              <div className="principle">

                <div className="principle-number">
                  02
                </div>

                <div>
                  <strong>
                    Understand
                  </strong>

                  <span>
                    See where your money is
                    actually going.
                  </span>
                </div>

              </div>

              <div className="principle">

                <div className="principle-number">
                  03
                </div>

                <div>
                  <strong>
                    Act
                  </strong>

                  <span>
                    Use financial signals to make
                    better business decisions.
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* FOOTER */}

          <div className="intro-footer">

            <span>
              PENNYPILOT
            </span>

            <span>
              Financial operations for MSMEs
            </span>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* RIGHT — AUTH */}
      {/* ================================================= */}

      <section className="auth-area">

        <div className="auth-area-inner">

          {/* TOP */}

          <div className="auth-top">

            <div className="auth-status">
              <span />
              SECURE WORKSPACE
            </div>

            <div className="auth-existing">

              {mode === "signup"
                ? "Already have an account?"
                : "New to PennyPilot?"}

              <button
                type="button"
                onClick={() => {
                  setMode(
                    mode === "signup"
                      ? "login"
                      : "signup"
                  );

                  setError("");
                }}
                disabled={loading}
              >
                {mode === "signup"
                  ? "Sign in"
                  : "Create account"}

                <ArrowUpRight size={13} />
              </button>

            </div>

          </div>

          {/* FORM WRAPPER */}

          <div className="auth-form-wrap">

            <div className="auth-heading">

              <div className="auth-heading-label">
                {mode === "signup"
                  ? "CREATE WORKSPACE"
                  : "WELCOME BACK"}
              </div>

              <h2>
                {mode === "signup"
                  ? "Set up your account."
                  : "Sign in to your workspace."}
              </h2>

              <p>
                {mode === "signup"
                  ? "Tell us a little about your business to get started."
                  : "Enter your account details to continue."}
              </p>

            </div>

            {/* TABS */}

            <div className="auth-tabs">

              <button
                type="button"
                className={
                  mode === "signup"
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                disabled={loading}
              >
                Create account
              </button>

              <button
                type="button"
                className={
                  mode === "login"
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                disabled={loading}
              >
                Sign in
              </button>

            </div>

            {/* ================================================= */}
            {/* SIGNUP FIELDS */}
            {/* ================================================= */}

            {mode === "signup" && (
              <div className="signup-fields">

                {/* BUSINESS */}

                <div className="field">

                  <label htmlFor="business-name">
                    Business name
                  </label>

                  <div className="input">

                    <Building2 size={16} />

                    <input
                      id="business-name"
                      value={
                        businessName
                      }
                      onChange={(e) =>
                        setBusinessName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. XYZ Manufacturing"
                      autoComplete="organization"
                      disabled={loading}
                    />

                  </div>

                </div>

                {/* ENTERPRISE */}

                <div className="field">

                  <label>
                    Enterprise type
                  </label>

                  <div className="enterprise-grid">

                    {enterprises.map(
                      ([
                        emoji,
                        name,
                        description,
                      ]) => {

                        const selected =
                          enterprise ===
                          name;

                        return (
                          <button
                            type="button"
                            key={name}
                            disabled={
                              loading
                            }
                            className={`enterprise ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setEnterprise(
                                name
                              )
                            }
                          >

                            <span className="enterprise-icon">
                              {emoji}
                            </span>

                            <span className="enterprise-text">

                              <strong>
                                {name}
                              </strong>

                              <small>
                                {description}
                              </small>

                            </span>

                            {selected && (
                              <span className="enterprise-check">
                                <Check
                                  size={10}
                                />
                              </span>
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* EMAIL */}

            <div className="field">

              <label htmlFor="email">
                Email
              </label>

              <div className="input">

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="field">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

                {mode === "signup" && (
                  <span>
                    Minimum 6 characters
                  </span>
                )}

              </div>

              <div className="input">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="error">

                <span className="error-dot" />

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="button"
              className="submit"
              disabled={loading}
              onClick={submit}
            >

              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="spinner"
                  />

                  <span>
                    Please wait...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "signup"
                      ? "Create PennyPilot"
                      : "Sign in"}
                  </span>

                  <ChevronRight size={17} />
                </>
              )}

            </button>

            {/* SECURITY */}

            <div className="security">

              <span className="security-dot" />

              Your financial data stays private
              to your account.

            </div>

          </div>

          {/* BOTTOM */}

          <div className="auth-footer">

            <span>
              © PennyPilot
            </span>

            <span>
              Financial Operating System
            </span>

          </div>

        </div>

      </section>

      <style jsx>{`

        /* ================================================= */
        /* PAGE */
        /* ================================================= */

        .auth-page {
          width: 100%;
          min-height: 100svh;

          display: grid;

          grid-template-columns:
            48% 52%;

          background: #f4f5f6;

          color: #11161b;

          font-family: inherit;
        }

        /* ================================================= */
        /* LEFT */
        /* ================================================= */

        .auth-intro {
          min-height: 100svh;

          background: #ffffff;

          border-right:
            1px solid #dce1e5;
        }

        .intro-inner {
          width:
            min(
              100%,
              620px
            );

          height: 100%;

          margin: 0 auto;

          padding:
            52px 72px 32px;

          display: flex;

          flex-direction: column;

          box-sizing: border-box;
        }

        /* ================================================= */
        /* BRAND */
        /* ================================================= */

        .brand {
          display: flex;

          align-items: center;

          gap: 22px;
        }

        .brand-logo {
          width: 92px;
          height: 92px;

          flex: 0 0 92px;
        }

        .brand-logo img {
          display: block;

          width: 92px;
          height: 92px;
        }

        .brand-name {
          color: #11161b;

          font-size:
            clamp(
              38px,
              3.2vw,
              52px
            );

          font-weight: 760;

          letter-spacing:
            -0.055em;
        }

        /* ================================================= */
        /* INTRO CONTENT */
        /* ================================================= */

        .intro-content {
          margin-top:
            auto;

          margin-bottom:
            auto;

          max-width:
            560px;
        }

        .intro-label {
          margin-bottom:
            22px;

          color:
            #7b858e;

          font-size:
            15px;

          font-weight:
            800;

          letter-spacing:
            0.22em;
        }

        .intro-content h1 {
          margin: 0;

          color:
            #11161b;

          font-size:
            clamp(
              47px,
              5vw,
              72px
            );

          line-height:
            0.99;

          letter-spacing:
            -0.065em;

          font-weight:
            760;
        }

        .intro-content h1 span {
          color:
            #77828c;
        }

        .intro-content p {
          max-width:
            500px;

          margin:
            30px 0 0;

          color:
            #69747e;

          font-size:
            15px;

          line-height:
            1.7;
        }

        .intro-rule {
          width: 100%;

          height: 1px;

          margin:
            32px 0 24px;

          background:
            #e2e5e8;
        }

        /* ================================================= */
        /* PRINCIPLES */
        /* ================================================= */

        .principles {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              1fr
            );

          gap: 24px;
        }

        .principle {
          display: flex;

          gap: 11px;

          min-width: 0;
        }

        .principle-number {
          color:
            #9aa3ab;

          font-size:
            9px;

          font-weight:
            750;

          letter-spacing:
            0.08em;

          padding-top:
            2px;
        }

        .principle strong {
          display: block;

          color:
            #222930;

          font-size:
            11px;

          font-weight:
            750;
        }

        .principle span {
          display: block;

          margin-top:
            5px;

          color:
            #8a949d;

          font-size:
            9px;

          line-height:
            1.5;
        }

        /* ================================================= */
        /* INTRO FOOTER */
        /* ================================================= */

        .intro-footer {
          display: flex;

          justify-content:
            space-between;

          align-items:
            center;

          padding-top:
            20px;

          color:
            #a0a8af;

          font-size:
            8px;

          letter-spacing:
            0.04em;
        }

        .intro-footer span:first-child {
          color:
            #77828b;

          font-weight:
            800;

          letter-spacing:
            0.14em;
        }

        /* ================================================= */
        /* RIGHT */
        /* ================================================= */

        .auth-area {
          min-height: 100svh;

          background:
            #f4f5f6;
        }

        .auth-area-inner {
          width:
            min(
              100%,
              650px
            );

          height: 100%;

          margin: 0 auto;

          padding:
            52px 72px 32px;

          box-sizing:
            border-box;

          display: flex;

          flex-direction:
            column;
        }

        /* ================================================= */
        /* TOP */
        /* ================================================= */

        .auth-top {
          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 20px;
        }

        .auth-status {
          display: flex;

          align-items:
            center;

          gap: 9px;

          color:
            #7d878f;

          font-size:
            12px;

          font-weight:
            800;

          letter-spacing:
            0.16em;
        }

        .auth-status span {
          width: 11px;
          height: 11px;

          border-radius:
            50%;

          background:
            #3f7f5b;

          box-shadow:
            0 0 0 8px
            rgba(
              63,
              127,
              91,
              0.09
            );
        }

        .auth-existing {
          display: flex;

          align-items:
            center;

          gap: 8px;

          color:
            #89929a;

          font-size:
            10px;
        }

        .auth-existing button {
          display: flex;

          align-items:
            center;

          gap: 2px;

          padding: 0;

          border: 0;

          background:
            transparent;

          color:
            #1a2026;

          font-family:
            inherit;

          font-size:
            10px;

          font-weight:
            750;

          cursor:
            pointer;
        }

        .auth-existing button:hover {
          color:
            #65717b;
        }

        /* ================================================= */
        /* FORM */
        /* ================================================= */

        .auth-form-wrap {
          width:
            100%;

          max-width:
            520px;

          margin:
            auto;

          padding:
            38px 40px;

          box-sizing:
            border-box;

          border:
            1px solid #dce1e5;

          border-radius:
            13px;

          background:
            #ffffff;

          box-shadow:
            0 18px 45px
            rgba(
              17,
              22,
              27,
              0.045
            );
        }

        .auth-heading-label {
          margin-bottom:
            9px;

          color:
            #8b949c;

          font-size:
            9px;

          font-weight:
            800;

          letter-spacing:
            0.18em;
        }

        .auth-heading h2 {
          margin: 0;

          color:
            #11161b;

          font-size:
            27px;

          line-height:
            1.1;

          letter-spacing:
            -0.045em;

          font-weight:
            760;
        }

        .auth-heading p {
          margin:
            9px 0 0;

          color:
            #7b858e;

          font-size:
            11px;

          line-height:
            1.5;
        }

        /* ================================================= */
        /* TABS */
        /* ================================================= */

        .auth-tabs {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 4px;

          padding: 4px;

          margin:
            25px 0 23px;

          border:
            1px solid #dce1e5;

          border-radius:
            8px;

          background:
            #f1f3f4;
        }

        .auth-tabs button {
          height: 36px;

          border: 0;

          border-radius:
            5px;

          background:
            transparent;

          color:
            #7c8790;

          font-family:
            inherit;

          font-size:
            10px;

          font-weight:
            700;

          cursor:
            pointer;
        }

        .auth-tabs button.selected {
          background:
            #ffffff;

          color:
            #171d22;

          box-shadow:
            0 1px 4px
            rgba(
              17,
              22,
              27,
              0.08
            );
        }

        /* ================================================= */
        /* FIELDS */
        /* ================================================= */

        .signup-fields {
          display: flex;

          flex-direction:
            column;

          gap: 2px;
        }

        .field {
          margin-bottom:
            17px;
        }

        .field label {
          display: block;

          margin-bottom:
            7px;

          color:
            #59646e;

          font-size:
            9px;

          font-weight:
            750;
        }

        .input {
          height: 43px;

          display: flex;

          align-items:
            center;

          gap: 9px;

          padding:
            0 12px;

          box-sizing:
            border-box;

          border:
            1px solid #d6dce0;

          border-radius:
            7px;

          background:
            #ffffff;

          color:
            #77838c;

          transition:
            border-color
              0.15s,
            box-shadow
              0.15s;
        }

        .input:focus-within {
          border-color:
            #8d969e;

          box-shadow:
            0 0 0 3px
            rgba(
              17,
              22,
              27,
              0.045
            );
        }

        .input input {
          width:
            100%;

          min-width:
            0;

          height:
            100%;

          border:
            0;

          outline:
            0;

          background:
            transparent;

          color:
            #151b20;

          font-family:
            inherit;

          font-size:
            11px;
        }

        .input input::placeholder {
          color:
            #a1a9b0;
        }

        /* ================================================= */
        /* ENTERPRISE */
        /* ================================================= */

        .enterprise-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 6px;
        }

        .enterprise {
          min-height:
            52px;

          position:
            relative;

          display:
            flex;

          align-items:
            center;

          gap: 9px;

          padding:
            7px 9px;

          text-align:
            left;

          border:
            1px solid #dce1e5;

          border-radius:
            7px;

          background:
            #ffffff;

          color:
            #222930;

          cursor:
            pointer;

          transition:
            border-color
              0.15s,
            background
              0.15s;
        }

        .enterprise:hover {
          border-color:
            #b9c1c7;

          background:
            #fafafa;
        }

        .enterprise.selected {
          border-color:
            #9ba4ab;

          background:
            #f6f7f7;

          box-shadow:
            inset 3px 0 0
            #171d22;
        }

        .enterprise-icon {
          width:
            25px;

          flex:
            0 0 25px;

          text-align:
            center;

          font-size:
            14px;
        }

        .enterprise-text {
          min-width:
            0;
        }

        .enterprise-text strong {
          display:
            block;

          color:
            #2b3238;

          font-size:
            8px;

          font-weight:
            750;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .enterprise-text small {
          display:
            block;

          margin-top:
            3px;

          color:
            #8a949d;

          font-size:
            6.5px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .enterprise-check {
          position:
            absolute;

          top:
            5px;

          right:
            5px;

          width:
            15px;

          height:
            15px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          background:
            #3f7f5b;

          color:
            white;
        }

        /* ================================================= */
        /* PASSWORD */
        /* ================================================= */

        .password-label {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          margin-bottom:
            7px;
        }

        .password-label label {
          margin:
            0;
        }

        .password-label span {
          color:
            #a0a8af;

          font-size:
            7px;
        }

        .password-toggle {
          width:
            28px;

          height:
            28px;

          flex:
            0 0 28px;

          display:
            grid;

          place-items:
            center;

          border:
            0;

          background:
            transparent;

          color:
            #7c8790;

          cursor:
            pointer;
        }

        .password-toggle:hover {
          color:
            #222a31;
        }

        /* ================================================= */
        /* ERROR */
        /* ================================================= */

        .error {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          margin:
            -4px 0 14px;

          padding:
            10px 11px;

          border:
            1px solid #ead4d4;

          border-radius:
            7px;

          background:
            #fbf5f5;

          color:
            #a05252;

          font-size:
            9px;

          line-height:
            1.4;
        }

        .error-dot {
          width:
            5px;

          height:
            5px;

          flex:
            0 0 5px;

          border-radius:
            50%;

          background:
            #b65b5b;
        }

        /* ================================================= */
        /* SUBMIT */
        /* ================================================= */

        .submit {
          width:
            100%;

          height:
            45px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            7px;

          border:
            0;

          border-radius:
            7px;

          background:
            #11161b;

          color:
            #ffffff;

          font-family:
            inherit;

          font-size:
            10px;

          font-weight:
            750;

          cursor:
            pointer;

          transition:
            background
              0.15s,
            transform
              0.15s;
        }

        .submit:hover:not(:disabled) {
          background:
            #242b31;

          transform:
            translateY(-1px);
        }

        .submit:disabled {
          opacity:
            0.55;

          cursor:
            wait;
        }

        .spinner {
          animation:
            spin
            0.8s
            linear
            infinite;
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* ================================================= */
        /* SECURITY */
        /* ================================================= */

        .security {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          margin-top:
            14px;

          color:
            #929ba3;

          font-size:
            7px;
        }

        .security-dot {
          width:
            5px;

          height:
            5px;

          border-radius:
            50%;

          background:
            #3f7f5b;
        }

        /* ================================================= */
        /* FOOTER */
        /* ================================================= */

        .auth-footer {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding-top:
            20px;

          color:
            #9aa2a9;

          font-size:
            7px;
        }

        /* ================================================= */
        /* RESPONSIVE */
        /* ================================================= */

        @media (
          max-width: 1050px
        ) {

          .auth-page {
            grid-template-columns:
              45% 55%;
          }

          .intro-inner,
          .auth-area-inner {
            padding-left:
              40px;

            padding-right:
              40px;
          }

          .intro-content h1 {
            font-size:
              50px;
          }

          .brand-name {
            font-size:
              38px;
          }

          .brand-logo {
            width:
              72px;

            height:
              72px;
          }

          .brand-logo img {
            width:
              72px;

            height:
              72px;
          }

        }

        /* ================================================= */
        /* SHORT DESKTOP */
        /* ================================================= */

        @media (
          max-height: 780px
        ) and (
          min-width: 800px
        ) {

          .intro-inner,
          .auth-area-inner {
            padding-top:
              28px;

            padding-bottom:
              20px;
          }

          .brand-logo {
            width:
              65px;

            height:
              65px;
          }

          .brand-logo img {
            width:
              65px;

            height:
              65px;
          }

          .brand-name {
            font-size:
              34px;
          }

          .intro-label {
            margin-bottom:
              14px;
          }

          .intro-content h1 {
            font-size:
              48px;
          }

          .intro-content p {
            margin-top:
              18px;
          }

          .intro-rule {
            margin:
              20px 0 16px;
          }

          .auth-form-wrap {
            padding:
              25px 32px;
          }

          .auth-heading h2 {
            font-size:
              24px;
          }

          .auth-tabs {
            margin:
              17px 0;
          }

          .field {
            margin-bottom:
              11px;
          }

          .enterprise {
            min-height:
              45px;
          }

        }

        /* ================================================= */
        /* MOBILE */
        /* ================================================= */

        @media (
          max-width: 799px
        ) {

          .auth-page {
            display:
              flex;

            flex-direction:
              column;

            min-height:
              100svh;
          }

          .auth-intro {
            min-height:
              auto;

            border-right:
              0;

            border-bottom:
              1px solid #dce1e5;
          }

          .intro-inner {
            width:
              100%;

            height:
              auto;

            padding:
              22px 22px 26px;
          }

          .brand-logo {
            width:
              48px;

            height:
              48px;
          }

          .brand-logo img {
            width:
              48px;

            height:
              48px;
          }

          .brand {
            gap:
              13px;
          }

          .brand-name {
            font-size:
              29px;
          }

          .intro-content {
            margin:
              38px 0 0;
          }

          .intro-label {
            font-size:
              10px;

            margin-bottom:
              13px;
          }

          .intro-content h1 {
            font-size:
              clamp(
                38px,
                10vw,
                54px
              );
          }

          .intro-content p {
            font-size:
              11px;

            margin-top:
              17px;
          }

          .intro-rule {
            margin:
              22px 0 18px;
          }

          .principles {
            grid-template-columns:
              1fr;

            gap:
              11px;
          }

          .principle span {
            font-size:
              8px;
          }

          .intro-footer {
            margin-top:
              25px;
          }

          .auth-area {
            min-height:
              auto;
          }

          .auth-area-inner {
            width:
              100%;

            height:
              auto;

            padding:
              22px;
          }

          .auth-top {
            align-items:
              flex-start;
          }

          .auth-existing {
            display:
              none;
          }

          .auth-form-wrap {
            max-width:
              none;

            margin:
              28px 0 0;

            padding:
              24px 18px;
          }

          .auth-footer {
            padding-bottom:
              5px;
          }

        }

        @media (
          max-width: 480px
        ) {

          .enterprise-grid {
            grid-template-columns:
              1fr;
          }

          .auth-form-wrap {
            padding:
              21px 15px;
          }

          .auth-heading h2 {
            font-size:
              23px;
          }

        }

      `}</style>

    </main>
  );
}