import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import UserManagement from "./UserManagement";

type AppUser = {
  id: string;
  username: string;
  display_name: string;
  role: "admin" | "superuser" | "user" | "kiosk";
  active: boolean;
  visible_password: string | null;
  created_at: string;
};

export default async function AdminPage() {
  const session = await getSession();
  // Dubbel-koll — middleware skyddar också, men defense in depth
  if (!session || (session.role !== "admin" && session.role !== "superuser")) {
    redirect("/");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  );

  const { data: users } = await supabase
    .from("app_users")
    .select("id, username, display_name, role, active, visible_password, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Användarhantering</h1>
        <p className="text-sm text-text-primary/50 mt-1">
          Inloggad som {session.display_name} · {session.role}
        </p>
      </div>

      <UserManagement
        users={(users as AppUser[]) ?? []}
        currentUser={session}
      />
    </main>
  );
}
