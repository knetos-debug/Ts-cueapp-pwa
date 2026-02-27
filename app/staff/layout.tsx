import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      {/* Top nav */}
      <nav className="flex items-center justify-between border-b border-text-primary/10 bg-card-bg px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold text-text-primary">Trainstation</span>
          <Link
            href="/staff"
            className="text-sm font-medium text-text-primary hover:text-text-primary/80"
          >
            Kö
          </Link>
          <span className="text-sm text-text-primary/30" title="Kommer i Fas 4">
            Statistik
          </span>
          <span className="text-sm text-text-primary/30" title="Kommer i Fas 5">
            Inställningar
          </span>
        </div>
        <LogoutButton />
      </nav>

      {children}
    </div>
  );
}
