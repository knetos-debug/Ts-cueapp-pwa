import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import MakerspaceBanner from "@/components/MakerspaceBanner";
import "./globals.css";

const ubuntu = Ubuntu({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-ubuntu",
});

export const metadata: Metadata = {
  title: "Köapp – Makerspace Queue",
  description: "PWA för kösystem till makerspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={ubuntu.variable}>
      <body className="min-h-screen bg-bg-main text-text-primary antialiased font-sans">
        <header className="relative w-full overflow-hidden">
          <MakerspaceBanner />
        </header>
        <div className="px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-4 pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </body>
    </html>
  );
}
