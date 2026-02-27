"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { btn, btnBase } from "@/lib/buttonStyles";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className={`${btnBase} ${btn.zinc}`}
    >
      {isPending ? "Loggar ut…" : "Logga ut"}
    </button>
  );
}
