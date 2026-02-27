import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/staff/login");

  const { data: staffMember } = await supabase
    .from("staff")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg bg-card-bg p-8 text-center shadow-xl">
        <div className="mb-2 text-4xl">👋</div>
        <h1 className="mb-1 text-2xl font-bold text-text-primary">
          Välkommen, {staffMember?.name ?? user.email}
        </h1>
        <p className="mb-1 text-sm text-text-primary/60">
          Roll: {staffMember?.role ?? "–"}
        </p>
        <p className="mb-8 text-text-primary/50 text-sm">
          Staff-vyn byggs i nästa fas (V2 Fas 2).
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
