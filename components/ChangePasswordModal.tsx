"use client";

import { useState, useTransition } from "react";
import { changeOwnPasswordAction } from "@/app/actions/auth";
import { btn, btnBase } from "@/lib/buttonStyles";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("Det nya lösenordet matchar inte bekräftelsen.");
      return;
    }
    startTransition(async () => {
      const res = await changeOwnPasswordAction(current, next);
      if (res.error) {
        setError(res.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card-bg p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-text-primary">Byt lösenord</h2>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-green-400">✓ Lösenordet har ändrats.</p>
            <button onClick={onClose} className={`w-full ${btnBase} ${btn.zinc}`}>
              Stäng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-900/40 border border-red-600/40 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-text-primary/60">Nuvarande lösenord</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-ink"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-primary/60">Nytt lösenord</label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-ink"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-primary/60">Bekräfta nytt lösenord</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-lg bg-bg-main border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-ink"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 ${btnBase} ${btn.zinc}`}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`flex-1 ${btnBase} ${btn.blue}`}
              >
                {isPending ? "Sparar…" : "Spara"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
