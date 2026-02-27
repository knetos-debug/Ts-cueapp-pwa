"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import ChangePasswordModal from "./ChangePasswordModal";
import { btn, btnBase } from "@/lib/buttonStyles";
import type { SessionPayload } from "@/lib/auth/session";

type Props = {
  session: SessionPayload;
};

export default function AppNav({ session }: Props) {
  const [showPwModal, setShowPwModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canAdmin = session.role === "admin" || session.role === "superuser";

  return (
    <>
      <nav className="flex items-center justify-between border-b border-white/5 bg-nav-bg px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-tight text-text-primary">trainstation</span>
          <Link href="/staff" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
            Kö
          </Link>
          {canAdmin && (
            <Link href="/admin" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
              Användare
            </Link>
          )}
          <span className="text-sm text-text-primary/25" title="Kommer i Fas 4">
            Statistik
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Vem är inloggad + byt lösenord */}
          <button
            onClick={() => setShowPwModal(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-text-primary/50 hover:bg-white/5 hover:text-text-primary/80 transition-colors"
            title="Byt lösenord"
          >
            <span className="hidden sm:inline">{session.display_name}</span>
            <span>🔑</span>
          </button>

          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={isPending}
            className={`${btnBase} ${btn.zinc}`}
          >
            {isPending ? "…" : "Logga ut"}
          </button>
        </div>
      </nav>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </>
  );
}
