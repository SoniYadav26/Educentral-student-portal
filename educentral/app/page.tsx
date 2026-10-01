"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AccountType = "student" | "admin";
type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const confirmationError = new URLSearchParams(window.location.search).get("error");
      if (confirmationError === "confirmation-failed") {
        setError("This confirmation link is invalid or expired. Please sign up again.");
      }
      if (data.session) {
        const role = String(data.session.user.app_metadata.role ?? "student").toLowerCase();
        router.replace(role === "admin" ? "/admin/upload" : "/dashboard");
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (accountType === "student" && authMode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { role: "student" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setPassword("");
        setAuthMode("signin");
        if (data.session) {
          setSuccess("Account created successfully. Redirecting to your dashboard…");
          router.replace("/dashboard");
        } else {
          setSuccess("Account created successfully! Please check your inbox for the confirmation link before signing in.");
        }
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const unconfirmedEmail = signInError.code === "email_not_confirmed" ||
          /email.*not confirmed|confirm.*email/i.test(signInError.message);
        setError(unconfirmedEmail
          ? "Please confirm your email via the link sent to your inbox before signing in."
          : signInError.message);
        return;
      }

      const role = String(data.user.app_metadata.role ?? "student").toLowerCase();
      if (accountType === "admin" && role !== "admin") {
        await supabase.auth.signOut();
        setError("This account does not have administrator access.");
        return;
      }
      if (accountType === "student" && role === "admin") {
        await supabase.auth.signOut();
        setError("Choose the Admin tab to sign in with this account.");
        return;
      }

      router.replace(accountType === "admin" ? "/admin/upload" : "/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-intro">
        <Link className="brand-lockup" href="/" aria-label="EduCentral home">
          <span className="brand-mark"><BookOpen size={20} /></span>
          <span>EduCentral</span>
        </Link>
        <div className="intro-copy">
          <p className="eyebrow">YOUR CAMPUS, ORGANIZED</p>
          <h1>Make room for the work that matters.</h1>
          <p>One calm place for course material, past papers, and the people learning alongside you.</p>
        </div>
        <div className="intro-footer"><span className="status-dot" /> Built for curious minds <span>·</span> 2026</div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand brand-lockup">
            <span className="brand-mark"><BookOpen size={20} /></span><span>EduCentral</span>
          </div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>{authMode === "signup" && accountType === "student" ? "Create your student account" : "Sign in to continue"}</h2>
          <p className="form-subtitle">{authMode === "signup" && accountType === "student" ? "Get started with your campus study space." : "Pick up right where your learning left off."}</p>

          <div className="account-tabs" role="tablist" aria-label="Account type">
            {(["student", "admin"] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={accountType === type}
                className={accountType === type ? "account-tab active" : "account-tab"}
                onClick={() => { setAccountType(type); setAuthMode("signin"); setError(""); setSuccess(""); }}
              >
                {type === "student" ? "Student" : "Admin"}
              </button>
            ))}
          </div>

          {accountType === "student" && (
            <div className="account-tabs" role="tablist" aria-label="Authentication mode">
              {(["signin", "signup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={authMode === mode}
                  className={authMode === mode ? "account-tab active" : "account-tab"}
                  onClick={() => { setAuthMode(mode); setError(""); setSuccess(""); }}
                >
                  {mode === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@college.edu" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <div className="password-label"><label htmlFor="password">Password</label></div>
            <input id="password" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={authMode === "signup" ? 6 : undefined} placeholder={authMode === "signup" ? "Create a password" : "Enter your password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
            {error && <p className="form-error" role="alert">{error}</p>}
            {success && <p className="success-note" role="status">{success}</p>}
            <button className="primary-button login-submit" type="submit" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : <>{authMode === "signup" && accountType === "student" ? "Create account" : "Sign in"} <ArrowRight size={17} /></>}
            </button>
          </form>
          <p className="login-help">Having trouble signing in? Contact your campus administrator.</p>
        </div>
        <div className="login-bottom">A better start to every study session.</div>
      </section>
    </main>
  );
}
