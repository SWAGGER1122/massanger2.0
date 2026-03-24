import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glass Messenger",
  description: "Telegram-like messenger with Next.js + Supabase + Agora"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
