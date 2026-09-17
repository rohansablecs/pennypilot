"use client";

import { useState } from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  Check,
  Loader2,
  Mail,
  Lock,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const enterprises = [
  {
    emoji: "🏭",
    name: "Manufacturing",
    description: "Factories, workshops & production",
  },
  {
    emoji: "🛒",
    name: "Retail",
    description: "Shops & consumer businesses",
  },
  {
    emoji: "🚚",
    name: "Logistics & Transport",
    description: "Fleet, freight & delivery",
  },
  {
    emoji: "🍽️",
    name: "Food & Hospitality",
    description: "Restaurants, cafés & food",
  },
  {
    emoji: "💻",
    name: "IT & Services",
    description: "Software & professional services",
  },
  {
    emoji: "🏗️",
    name: "Construction",
    description: "Contractors & construction",
  },
  {
    emoji: "📦",
    name: "Wholesale & Distribution",
    description: "Trading & distribution",
  },
  {
    emoji: "✦",
    name: "Other",
    description: "Other MSME businesses",
  },
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

  const switchMode = (
    nextMode: "login" | "signup"
  ) => {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  };

  const submit = async () => {
    if (loading) return;

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanBusinessName =
      businessName.trim();

    if (!cleanEmail || !password) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      mode === "signup" &&
      !cleanBusinessName
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

    try {
      /*
       * =====================================================
       * LOGIN
       * =====================================================
       */

      if (mode === "login") {
        const {
          error: loginError,
        } =
          await supabase.auth.signInWithPassword(
            {
              email: cleanEmail,
              password,
            }
          );

        if (loginError) {
          setError(
            loginError.message
          );
        }

        return;
      }

      /*
       * =====================================================
       * SIGN UP
       * =====================================================
       */

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
                cleanBusinessName,

              enterprise_type:
                enterprise,
            },
          },
        });

      if (signupError) {
        setError(
          signupError.message
        );
        return;
      }

      if (!data.user) {
        setError(
          "Account creation failed. Please try again."
        );
        return;
      }

      /*
       * The business record is created by
       * the Supabase database trigger.
       */

      if (!data.session) {
        setError(
          "Account created. Please verify your email, then sign in."
        );

        setMode("login");

        return;
      }
    } catch (err) {
      console.error(
        "PennyPilot authentication error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void submit();
  };

  return (
    <main className="login-page">
      <div className="login-container">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="login-brand">
          <div className="login-logo">
            ◒
          </div>

          <div className="login-eyebrow">
            PENNYPILOT
          </div>
        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <div className="login-hero">
          <div className="login-kicker">
            FINANCIAL OPERATING SYSTEM
          </div>

          <h1>
            Your business.
            <br />

            <span>
              Your financial control center.
            </span>
          </h1>

          <p className="login-description">
            Track spending, understand cash flow,
            control budgets and identify unusual
            expenses — all in one place.
          </p>
        </div>

        {/* =================================================
            AUTH CARD
        ================================================= */}

        <form
          className="auth-card"
          onSubmit={handleSubmit}
        >

          {/* MODE SWITCH */}

          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === "signup"
                  ? "selected"
                  : ""
              }
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
              onClick={() =>
                switchMode("login")
              }
            >
              Sign in
            </button>
          </div>

          {/* =================================================
              SIGNUP ONLY
          ================================================= */}

          {mode === "signup" && (
            <div className="signup-section">

              <div className="form-field">
                <label htmlFor="business-name">
                  Business name
                </label>

                <div className="input-wrapper">
                  <Building2 size={17} />

                  <input
                    id="business-name"
                    type="text"
                    value={businessName}
                    onChange={(event) =>
                      setBusinessName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. XYZ Manufacturing"
                    autoComplete="organization"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>
                  Enterprise type
                </label>

                <div className="enterprise-grid">
                  {enterprises.map(
                    (item) => {
                      const selected =
                        enterprise ===
                        item.name;

                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`enterprise-option ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setEnterprise(
                              item.name
                            )
                          }
                          disabled={loading}
                        >
                          <span className="enterprise-emoji">
                            {item.emoji}
                          </span>

                          <span className="enterprise-copy">
                            <strong>
                              {item.name}
                            </strong>

                            <small>
                              {item.description}
                            </small>
                          </span>

                          {selected && (
                            <span className="selected-check">
                              <Check
                                size={14}
                                strokeWidth={2.5}
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

          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="form-field">
            <label htmlFor="auth-email">
              Email address
            </label>

            <div className="input-wrapper">
              <Mail size={17} />

              <input
                id="auth-email"
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

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="form-field">
            <div className="password-label-row">
              <label htmlFor="auth-password">
                Password
              </label>

              {mode === "login" && (
                <span>
                  Your secure account
                </span>
              )}
            </div>

            <div className="input-wrapper password-input">
              <Lock size={17} />

              <input
                id="auth-password"
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
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="auth-error"
              role="alert"
            >
              <span className="auth-error-dot" />

              <span>{error}</span>
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={16}
                  className="auth-spinner"
                />

                <span>
                  {mode === "signup"
                    ? "Creating account..."
                    : "Signing in..."}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === "signup"
                    ? "Create PennyPilot account"
                    : "Sign in to PennyPilot"}
                </span>

                <ChevronRight
                  size={17}
                />
              </>
            )}
          </button>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="auth-footer">
            {mode === "signup" ? (
              <>
                Already have an account?

                <button
                  type="button"
                  onClick={() =>
                    switchMode("login")
                  }
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to PennyPilot?

                <button
                  type="button"
                  onClick={() =>
                    switchMode("signup")
                  }
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </form>

        {/* =================================================
            TRUST LINE
        ================================================= */}

        <div className="login-trust">
          <span className="trust-dot" />
          Your financial data stays private to your account.
        </div>
      </div>
    </main>
  );
}