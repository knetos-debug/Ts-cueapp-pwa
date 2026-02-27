import MakerspaceBanner from "@/components/MakerspaceBanner";

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
