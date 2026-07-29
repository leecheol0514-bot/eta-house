import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "포켓몬 거래소",
  description: "교환할 포켓몬을 올리고 원하는 트레이너와 채팅으로 거래하세요.",
  openGraph: {
    title: "포켓몬 거래소",
    description: "포켓몬 교환 게시판 — 채팅으로 협상하고 거래 확정까지!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EE1515",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
