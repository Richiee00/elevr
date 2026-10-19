import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Disclaimer } from "@/components/layout/Disclaimer";

export const metadata: Metadata = {
  title: "Capitol Buy Tracker",
  description: "Stock purchases disclosed by US politicians compared with current market prices.",
};

export const viewport: Viewport = { themeColor: "#0a0a0a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <Suspense>
          <Header />
        </Suspense>
        <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4">
          {children}
          <Disclaimer />
        </main>
      </body>
    </html>
  );
}
