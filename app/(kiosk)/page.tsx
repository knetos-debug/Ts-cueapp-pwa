import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import KioskQueue from "@/components/KioskQueue";
import LoginUI from "@/components/LoginUI";

export default async function RootPage() {
  const session = await getSession();

  // Inte inloggad → visa login direkt på grund-URL:en
  if (!session) return <LoginUI />;

  // Personal/admin → till staffvyn
  if (session.role !== "kiosk") redirect("/staff");

  // Kiosk → kiosk-vyn
  return <KioskQueue />;
}
