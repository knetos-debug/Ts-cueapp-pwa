import Link from "next/link";
import LogoutButton from "@/app/staff/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      <nav className="flex items-center justify-between border-b border-text-primary/10 bg-card-bg px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold text-text-primary">Trainstation</span>
          <Link
            href="/staff"
            className="text-sm font-medium text-text-primary hover:text-text-primary/80"
          >
            Kö
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-text-primary hover:text-text-primary/80"
          >
            Användare
          </Link>
        </div>
        <LogoutButton />
      </nav>
      {children}
    </div>
  );
}
