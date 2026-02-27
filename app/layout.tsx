import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
