import type { Metadata, Viewport } from "next";
import { Unbounded, Outfit } from "next/font/google";
import "@hack/game-kit/gk.css";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-display" });
const body = Outfit({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Oga — tag am, pay am, e go do am",
  description:
    "The X-native micro-gig agent. Roasts, bios, captions, CV headlines — delivered in public, paid per gig with your stablecoin in MiniPay.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16100b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
