import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { supabaseConfigError } from "../lib/supabase";
import "./Auth.css";

interface AuthProps {
  onBack: () => void;
}

function Auth({ onBack }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      if (result.error.toLowerCase().includes("invalid api key")) {
        setError(
          "Invalid Supabase API key. In Supabase Dashboard → Project Settings → API Keys, " +
          "copy the Publishable key (sb_publishable_...) or legacy anon key (eyJ...) into " +
          "frontend/.env as VITE_SUPABASE_ANON_KEY, then restart the dev server.",
        );
      } else {
        setError(result.error);
      }
      return;
    }

    if (mode === "register") {
      setSuccess("Account created! Check your email to confirm, then sign in.");
      setMode("login");
      return;
    }

    onBack();
  };

  return (
    <div className="auth-page">
      <button className="auth-back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="auth-card">
        <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Welcome back to Movie Vault"
            : "Join Movie Vault to track movies you've seen"}
        </p>

        {supabaseConfigError && (
          <div className="auth-error">{supabaseConfigError}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 6 characters"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(null); setSuccess(null); }}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default Auth;
