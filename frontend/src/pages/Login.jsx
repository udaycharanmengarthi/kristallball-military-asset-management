import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Radar,
  Lock,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import ClassificationBanner from "../components/ClassificationBanner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from =
    location.state?.from?.pathname ||
    "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    /*
     * Normalize username because usernames should never
     * depend on accidental leading/trailing spaces.
     *
     * Do NOT trim the password.
     */
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Username is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      console.log("LOGIN DEBUG:", {
        username: cleanUsername,
        passwordLength: password.length,
      });

      await login(
        cleanUsername,
        password
      );

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      console.error(
        "LOGIN FAILED:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to sign in. Check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-900">
      <ClassificationBanner />

      <div className="grid-texture flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-brass-600/40 bg-brass-500/10">
              <Radar
                className="h-7 w-7 text-brass-400"
                strokeWidth={1.5}
              />
            </div>

            <h1 className="font-mono text-xl font-semibold tracking-widest2 text-mist-50">
              KRISTALLBALL
            </h1>

            <p className="mt-1 text-sm text-mist-400">
              Military Asset Management System
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-ink-600 bg-ink-800/70 p-6 shadow-panel"
          >
            <div className="mb-4">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest2 text-mist-400">
                Username
              </label>

              <div className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-2.5 focus-within:border-brass-500">
                <User
                  className="h-4 w-4 text-mist-500"
                  strokeWidth={1.75}
                />

                <input
                  autoFocus
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  className="w-full bg-transparent text-sm text-mist-50 outline-none placeholder:text-mist-500"
                  placeholder="e.g. admin_user"
                  autoComplete="off"
                  name="kb-username"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest2 text-mist-400">
                Password
              </label>

              <div className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-2.5 focus-within:border-brass-500">
                <Lock
                  className="h-4 w-4 text-mist-500"
                  strokeWidth={1.75}
                />

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  className="w-full bg-transparent text-sm text-mist-50 outline-none placeholder:text-mist-500"
                  placeholder="••••••••••"
                  autoComplete="new-password"
                  name="kb-password"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-rust-600/40 bg-rust-500/10 px-3 py-2 text-sm text-rust-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !username ||
                !password
              }
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brass-500 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brass-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {loading
                ? "Authenticating…"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-5 rounded-md border border-ink-700 bg-ink-850/50 px-4 py-3 text-xs text-mist-400">
            <div className="mb-1.5 font-mono uppercase tracking-widest2 text-mist-500">
              Demo Credentials
            </div>

            <div className="space-y-0.5">
              <div>
                admin_user / AdminPass123!
              </div>
              <div>
                commander_alpha / CommandPass123!
                {" "}
                (Fort Alpha)
              </div>
              <div>
                commander_bravo / CommandPass123!
                {" "}
                (Fort Bravo)
              </div>
              <div>
                commander_charlie / CommandPass123!
                {" "}
                (Fort Charlie)
              </div>
              <div>
                logistics_officer / LogisticsPass123!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}