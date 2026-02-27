"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/staff/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded bg-zinc-600 px-6 py-2 text-sm text-white hover:bg-zinc-700"
    >
      Logga ut
    </button>
  );
}
