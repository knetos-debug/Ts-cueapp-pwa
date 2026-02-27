import { getSession } from "@/lib/auth/session";
import MakerspaceBanner from "@/components/MakerspaceBanner";

export default async function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const showBanner = session?.role === "kiosk";

  if (!showBanner) {
    // Login-vyn eller redirect — ingen banner
    return <>{children}</>;
  }

  return (
    <>
      <header className="relative w-full overflow-hidden">
        <MakerspaceBanner />
      </header>
      <div
        style={{
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </div>
    </>
  );
}
