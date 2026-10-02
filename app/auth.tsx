"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
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

    if (mode === "signup" && !cleanBusiness) {
      setError(
        "Enter your business name."
      );
      return;
    }

    if (mode === "signup" && !enterprise) {
      setError(
        "Select your enterprise type."
      );
      return;
    }

    if (
      mode === "signup" &&
      password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      }

      setLoading(false);
      return;
    }

    const {
      data,
      error: signupError,
    } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          business_name: cleanBusiness,
          enterprise_type: enterprise,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
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

  const switchMode = (
    nextMode: "login" | "signup"
  ) => {
    if (loading) return;

    setMode(nextMode);
    setError("");
  };

  return (
    <main className="login-page">

      {/* =====================================================
          BRAND PANEL
      ===================================================== */}

      <section className="login-brand">

        <div className="login-brand-inner">

          <div className="login-logo-row">

            <div className="login-logo">
              <div className="login-logo">

  <img

    src="/icon.png"

    alt="PennyPilot"

  />

</div>
            </div>

            <div>
              <strong>PennyPilot</strong>

              <span>
                Financial intelligence for MSMEs
              </span>
            </div>

          </div>

          <div className="login-hero">

            <div className="login-eyebrow">
              FINANCIAL OPERATING SYSTEM
            </div>

            <h1>
              Know where
              <br />
              your money goes.
            </h1>

            <p>
              PennyPilot brings your expenses,
              budgets and financial signals into
              one calm workspace built for
              growing businesses.
            </p>

          </div>

          <div className="login-feature-grid">

            <div className="login-feature">

              <span className="login-feature-number">
                01
              </span>

              <div>
                <strong>
                  Capture
                </strong>

                <p>
                  Record every business
                  expense without the
                  spreadsheet chaos.
                </p>
              </div>

            </div>

            <div className="login-feature">

              <span className="login-feature-number">
                02
              </span>

              <div>
                <strong>
                  Understand
                </strong>

                <p>
                  Turn transactions into
                  useful spending patterns.
                </p>
              </div>

            </div>

            <div className="login-feature">

              <span className="login-feature-number">
                03
              </span>

              <div>
                <strong>
                  Decide
                </strong>

                <p>
                  Use forecasts and signals
                  to stay financially aware.
                </p>
              </div>

            </div>

          </div>

          <div className="login-trust">

            <span className="trust-dot" />

            <span>
              Private workspace
            </span>

            <span className="trust-divider">
              /
            </span>

            <span>
              Built for MSMEs
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          AUTH PANEL
      ===================================================== */}

      <section className="login-container">

        <div className="login-container-inner">

          <div className="login-topbar">

            <div className="login-kicker">
              <span className="status-dot" />
              SECURE WORKSPACE
            </div>

            <div className="login-switch">

              <span>
                {mode === "signup"
                  ? "Already have an account?"
                  : "New to PennyPilot?"}
              </span>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  switchMode(
                    mode === "signup"
                      ? "login"
                      : "signup"
                  )
                }
              >
                {mode === "signup"
                  ? "Sign in"
                  : "Create account"}

                <ArrowUpRight size={13} />
              </button>

            </div>

          </div>

          <div className="auth-card">

            <div className="auth-card-header">

              <div className="login-eyebrow">
                {mode === "signup"
                  ? "CREATE YOUR WORKSPACE"
                  : "WELCOME BACK"}
              </div>

              <h2>
                {mode === "signup"
                  ? "Set up your business."
                  : "Welcome back."}
              </h2>

              <p>
                {mode === "signup"
                  ? "Create your PennyPilot workspace and start building your financial picture."
                  : "Sign in to continue to your financial workspace."}
              </p>

            </div>

            <div className="auth-tabs">

              <button
                type="button"
                className={
                  mode === "signup"
                    ? "selected"
                    : ""
                }
                disabled={loading}
                onClick={() =>
                  switchMode("signup")
                }
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
                disabled={loading}
                onClick={() =>
                  switchMode("login")
                }
              >
                Sign in
              </button>

            </div>

            {mode === "signup" && (
              <div className="signup-section">

                <div className="form-field">

                  <label htmlFor="business-name">
                    Business name
                  </label>

                  <div className="input-wrapper">

                    <Building2
                      size={16}
                    />

                    <input
                      id="business-name"
                      value={businessName}
                      onChange={(event) =>
                        setBusinessName(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Acme Manufacturing"
                      autoComplete="organization"
                      disabled={loading}
                    />

                  </div>

                </div>

                <div className="form-field">

                  <label>
                    What does your business do?
                  </label>

                  <div className="enterprise-grid">

                    {enterprises.map(
                      ([
                        emoji,
                        name,
                        description,
                      ]) => {
                        const selected =
                          enterprise === name;

                        return (
                          <button
                            type="button"
                            key={name}
                            disabled={loading}
                            className={`enterprise-option ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setEnterprise(name)
                            }
                          >

                            <span className="enterprise-emoji">
                              {emoji}
                            </span>

                            <span className="enterprise-copy">

                              <strong>
                                {name}
                              </strong>

                              <small>
                                {description}
                              </small>

                            </span>

                            {selected && (
                              <span className="selected-check">
                                <Check size={11} />
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

            <div className="form-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            <div className="form-field">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                {mode === "signup" && (
                  <span>
                    Minimum 6 characters
                  </span>
                )}

              </div>

              <div className="input-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
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
                  disabled={loading}
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
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

            {error && (
              <div className="auth-error">

                <span className="auth-error-dot" />

                <span>
                  {error}
                </span>

              </div>
            )}

            <button
              type="button"
              className="auth-submit"
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
                      ? "Create workspace"
                      : "Sign in"}
                  </span>

                  <ChevronRight
                    size={17}
                  />
                </>
              )}

            </button>

            <div className="auth-security">

              <span className="trust-dot" />

              <span>
                Your financial workspace is
                private to your account.
              </span>

            </div>

          </div>

          <div className="auth-footer">

            <span>
              © {new Date().getFullYear()} PennyPilot
            </span>

            <span>
              Financial Operating System
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}