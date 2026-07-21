import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Budget Ledger",
  description: "Personal budgeting ledger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <main className="flex-1 pb-20 max-w-lg mx-auto w-full px-4 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
