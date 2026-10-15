import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/layout/Header";
import DestekWidget from "@/components/destek/DestekWidget";

export const metadata = {
  title: "IPTV Platform",
  description: "Türkçe canlı yayın platformu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Header />
        {children}
        <DestekWidget />
      </body>
    </html>
  );
}
