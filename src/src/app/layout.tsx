import type { Metadata } from "next";
import {
  Bebas_Neue,
  DM_Sans,
  Noto_Sans_JP,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { FloatingPillBar } from "@/components/nav/FloatingPillBar";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Serizawa Test — 芹沢テスト",
    template: "%s | Serizawa Test",
  },
  description:
    "An open, AI-assisted framework for evaluating Japanese and Japanese-American character representation in Western-produced media. Not peer-reviewed research. Just peer-reviewed opinions.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://serizawa.japanifornia.com"
  ),
  openGraph: {
    siteName: "Serizawa Test · Japanifornia",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@japanifornia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable} ${notoSansJP.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="antialiased"
        style={{
          backgroundColor: "var(--color-ink-950)",
          color: "var(--color-washi-100)",
          fontFamily: "var(--font-body)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {children}
        <FloatingPillBar />
      </body>
    </html>
  );
}
