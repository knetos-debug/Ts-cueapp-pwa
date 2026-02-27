"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unauthorized") === "1") setUnauthorized(true);
    if (params.get("error") === "auth") setAuthError(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg bg-card-bg p-8 text-center shadow-xl">
          <div className="mb-4 text-4xl">📬</div>
          <h1 className="mb-2 text-xl font-semibold text-text-primary">
            Kolla din e-post
          </h1>
          <p className="text-text-primary/70">
            Vi har skickat en inloggningslänk till{" "}
            <span className="font-medium text-text-primary">{email}</span>.
            Länken är giltig i 60 minuter.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Trainstation Personal
          </h1>
          <p className="mt-1 text-sm text-text-primary/60">
            Logga in med din e-post
          </p>
        </div>

        <div className="rounded-lg bg-card-bg p-6 shadow-xl">
          {unauthorized && (
            <div className="mb-4 rounded bg-red-900/40 p-3 text-sm text-red-300">
              Den här e-postadressen har inte behörighet. Kontakta en admin.
            </div>
          )}
          {authError && (
            <div className="mb-4 rounded bg-red-900/40 p-3 text-sm text-red-300">
              Inloggningslänken är ogiltig eller har gått ut. Försök igen.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-primary/80">
                E-postadress
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                autoFocus
                className="w-full rounded border border-text-primary/20 bg-bg-main px-4 py-2 text-text-primary placeholder:text-text-primary/40 focus:border-accent-ink focus:outline-none focus:ring-1 focus:ring-accent-ink"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Skickar…" : "Skicka inloggningslänk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
