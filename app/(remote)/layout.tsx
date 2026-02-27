import MakerspaceBanner from "@/components/MakerspaceBanner";

export default function RemoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main" style={{ overscrollBehavior: "none" }}>
      <header className="relative w-full overflow-hidden">
        <MakerspaceBanner />
      </header>
      {children}
    </div>
  );
}
