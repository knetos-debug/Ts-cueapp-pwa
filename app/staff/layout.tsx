import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-bg-main">
      <AppNav session={session} />
      {children}
    </div>
  );
}
