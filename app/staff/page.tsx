import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import StaffQueue from "@/components/StaffQueue";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <StaffQueue
      staffName={session.display_name}
      staffRole={session.role}
    />
  );
}
