"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { btn, btnBase } from "@/lib/buttonStyles";

function LoginForm() {
  const params = useSearchParams();
  const unauthorized = params.get("unauthorized") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    unauthorized ? "Du har inte behörighet att logga in." : null
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(username, password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-card-bg p-6 shadow-lg space-y-4"
    >
      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-600/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="username" className="block text-xs font-medium text-text-primary/60 uppercase tracking-wider">
          Användarnamn
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isPending}
          className="w-full rounded-lg bg-bg-main border border-white/10 px-4 py-2.5 text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-2 focus:ring-accent-ink disabled:opacity-50"
          placeholder="ditt användarnamn"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs font-medium text-text-primary/60 uppercase tracking-wider">
          Lösenord
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isPending}
          className="w-full rounded-lg bg-bg-main border border-white/10 px-4 py-2.5 text-text-primary placeholder:text-text-primary/30 focus:outline-none focus:ring-2 focus:ring-accent-ink disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !username || !password}
        className={`w-full ${btnBase} ${btn.blue} py-3 text-base`}
      >
        {isPending ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Trainstation</h1>
          <p className="mt-1 text-sm text-text-primary/50">Köapp — logga in</p>
        </div>
        <Suspense fallback={
          <div className="rounded-2xl bg-card-bg p-6 text-center text-sm text-text-primary/50">
            Laddar…
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
