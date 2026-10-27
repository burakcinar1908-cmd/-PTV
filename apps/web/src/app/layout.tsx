import type { ReactNode } from "react";
import type { Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import DestekWidget from "@/components/destek/DestekWidget";

export const metadata = {
  title: { default: "IPTV Platform", template: "%s · IPTV Platform" },
  description: "Türkçe canlı yayın platformu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d2b33",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <a href="#icerik" className="atla">
          İçeriğe geç
        </a>
        <Header />
        <div id="icerik" tabIndex={-1}>
          {children}
        </div>
        <Footer />
        <DestekWidget />
      </body>
    </html>
  );
}
