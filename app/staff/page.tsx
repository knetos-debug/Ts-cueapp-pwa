import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StaffQueue from "@/components/StaffQueue";

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

  if (!staffMember) redirect("/staff/login?unauthorized=1");

  return (
    <StaffQueue
      staffName={staffMember.name}
      staffRole={staffMember.role}
    />
  );
}
